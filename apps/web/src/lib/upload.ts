import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { env } from './env'
import { randomUUID } from 'crypto'

export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024 // 4 MB
export const UPLOAD_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const UPLOAD_HINT = 'Max 4 MB · JPG, PNG, WebP, GIF'

function getS3() {
  if (!env.R2_ACCOUNT_ID) return null
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

export async function directUpload(
  folder: 'deals' | 'venues',
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string | null> {
  const s3 = getS3()
  if (!s3 || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) return null
  const key = `${folder}/${randomUUID()}.${ext}`
  await s3.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType }))
  return `${env.R2_PUBLIC_URL}/${key}`
}

export async function deleteOrphanedFiles(referencedUrls: Set<string>): Promise<number> {
  const s3 = getS3()
  if (!s3 || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) return 0

  const toDelete: string[] = []
  let continuationToken: string | undefined

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
    }))
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue
      const url = `${env.R2_PUBLIC_URL}/${obj.Key}`
      if (!referencedUrls.has(url)) toDelete.push(obj.Key)
    }
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  if (toDelete.length === 0) return 0

  // Delete in batches of 1000 (S3/R2 limit)
  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000)
    await s3.send(new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: { Objects: batch.map((Key) => ({ Key })) },
    }))
  }

  return toDelete.length
}
