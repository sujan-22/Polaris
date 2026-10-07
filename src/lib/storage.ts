import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/*
 * Seller uploads go to S3. Files pass through a Server Action rather than a
 * presigned browser upload because the bucket has no CORS policy; the
 * browser shrinks each image to a WebP of a few hundred KB first, so this
 * stays well inside the request size limit.
 */

const region = process.env.AWS_S3_REGION;
const bucket = process.env.AWS_S3_BUCKET_NAME;

let client: S3Client | undefined;

export function storageConfigured(): boolean {
    return Boolean(region && bucket && process.env.AWS_S3_ACCESS_KEY_ID && process.env.AWS_S3_SECRET_ACCESS_KEY);
}

function s3(): S3Client {
    client ??= new S3Client({
        region,
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
        },
    });
    return client;
}

const publicBase = () => `https://${bucket}.s3.${region}.amazonaws.com/`;

export async function putImage(body: Uint8Array, contentType: string, folder: string): Promise<string> {
    const extension = contentType.split("/")[1] ?? "bin";
    const key = `polaris/${folder}/${crypto.randomUUID()}.${extension}`;
    await s3().send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
        }),
    );
    return publicBase() + key;
}

/** Deletes an uploaded image. Seeded images under /public are left alone. */
export async function deleteImage(url: string): Promise<void> {
    if (!storageConfigured() || !url.startsWith(publicBase())) return;
    await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: url.slice(publicBase().length) }));
}
