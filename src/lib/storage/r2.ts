// src/lib/storage/r2.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Server-only. Kredensial R2 (Secret Access Key) tidak boleh pernah sampai
 * ke browser -- semua pemanggil HARUS lewat route handler, bukan dipanggil
 * langsung dari Client Component (beda dari uploadListingPhoto.ts versi lama
 * yang upload langsung dari browser ke Supabase Storage).
 */
function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 belum dikonfigurasi (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY kosong).");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) {
    throw new Error("R2_PUBLIC_URL belum dikonfigurasi.");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME belum dikonfigurasi.");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return getPublicUrl(key);
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME belum dikonfigurasi.");
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Ekstrak key R2 dari public URL -- dipakai kalau nanti perlu hapus objek by URL. */
export function r2KeyFromUrl(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.replace(/\/$/, "").length + 1);
}
