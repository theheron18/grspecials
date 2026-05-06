import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { randomUUID } from 'crypto'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DRY_RUN = !process.argv.includes('--confirm')
const CSV_PATH = resolve(__dirname, 'venue-import.csv')

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseCSV(raw) {
  const [headerLine, ...rows] = raw.trim().split('\n')
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return rows.map(row => {
    const values = []
    let cur = '', inQuote = false
    for (const ch of row) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    values.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

async function getOrCreateCategory(name, categoryMap) {
  const key = name.toLowerCase()
  if (categoryMap[key]) return categoryMap[key]

  const slug = toSlug(name)
  const cat = await prisma.venueCategory.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  })
  console.log(`CREATE category: "${name}"`)
  categoryMap[key] = cat
  return cat
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf8')
  const rows = parseCSV(raw)

  const categories = await prisma.venueCategory.findMany()
  const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c]))

  let imported = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const { name, category, address, neighborhood, city, latitude, longitude,
            website, phone, facebook, instagram, description } = row

    const missing = ['name', 'category', 'address', 'city', 'latitude', 'longitude']
      .filter(f => !row[f]?.trim())
    if (missing.length) {
      console.error(`ERROR  [${name || 'unknown'}] missing fields: ${missing.join(', ')}`)
      errors++
      continue
    }

    const exists = await prisma.venue.findFirst({ where: { name, city } })
    if (exists) {
      console.log(`SKIP   [${name}] already exists`)
      skipped++
      continue
    }

    let slug = toSlug(name)
    const slugConflict = await prisma.venue.findUnique({ where: { slug } })
    if (slugConflict) slug = `${slug}-${randomUUID().slice(0, 6)}`

    if (DRY_RUN) {
      const cat = categoryMap[category.toLowerCase()] ?? { name: `${category} (will create)` }
      console.log(`DRY    [${name}] → slug: ${slug}, category: ${cat.name}`)
      imported++
      continue
    }

    try {
      const cat = await getOrCreateCategory(category, categoryMap)
      await prisma.venue.create({
        data: {
          name, address, city,
          neighborhood: neighborhood || null,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          website: website || null,
          phone: phone || null,
          facebook: facebook || null,
          instagram: instagram || null,
          description: description || null,
          slug,
          categoryId: cat.id,
          portalToken: randomUUID(),
          status: 'ACTIVE',
        },
      })
      console.log(`IMPORT [${name}]`)
      imported++
    } catch (e) {
      console.error(`ERROR  [${name}] ${e.message}`)
      errors++
    }
  }

  console.log(`\n${DRY_RUN ? 'DRY RUN — ' : ''}imported: ${imported}  skipped: ${skipped}  errors: ${errors}`)
  if (DRY_RUN) console.log('Run with --confirm to write to the database.')
  await prisma.$disconnect()
}

main()
