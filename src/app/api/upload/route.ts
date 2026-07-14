import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name) || '.jpg'
    const filename = `${crypto.randomUUID()}${ext}`
    
    // Check if Cloudflare credentials exist
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucketName = process.env.R2_BUCKET_NAME
    const publicUrl = process.env.R2_PUBLIC_URL

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      // Upload to Cloudflare R2
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      }))

      // Return the public URL or fallback to the generic dev domain
      const finalUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${filename}` : `https://pub-xxxxxxxxxxxxx.r2.dev/${filename}`
      return NextResponse.json({ url: finalUrl })
    } else {
      // Fallback to local storage if env variables are missing
      const { writeFile, mkdir } = await import('fs/promises')
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      try { await mkdir(uploadDir, { recursive: true }) } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer)
      return NextResponse.json({ url: `/uploads/${filename}` })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Rasm yuklashda xatolik yuz berdi' }, { status: 500 })
  }
}
