import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'
import { randomUUID } from 'crypto'

const s3 = env.R2_ACCOUNT_ID
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })
  : null

export async function getUploadUrl(
  folder: 'deals' | 'venues',
  contentType: string,
  ext: string,
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  if (!s3 || !env.R2_BUCKET_NAME) return null

  const key = `${folder}/${randomUUID()}.${ext}`
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 })
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`

  return { uploadUrl, publicUrl }
}
