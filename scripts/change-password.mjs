import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

async function main() {
  const email = await ask('Admin email [admin@grspecials.com]: ') || 'admin@grspecials.com'
  const newPassword = await ask('New password: ')

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const hash = await bcrypt.hash(newPassword, 12)
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: hash },
  })

  console.log(`✅ Password updated for ${user.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { rl.close(); await prisma.$disconnect() })
