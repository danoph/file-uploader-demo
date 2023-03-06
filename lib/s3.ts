import {
    S3Client,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    ListObjectsCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.bucket_region;
const UPLOAD_BUCKET = process.env.upload_bucket;

// NOTE: these are named differently than the normal AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
// because Vercel does not allow you to set those environment variables for a deployment
const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: `${process.env.access_key_id}`,
    secretAccessKey: `${process.env.access_key_secret}`,
  }
});

export const getS3ObjectMetadata = async ({ filename }) => {
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: filename,
    })
  );

  return response;
}

export const listBucketFiles = async () => {
  const response = await client.send(
    new ListObjectsCommand({
      Bucket: UPLOAD_BUCKET,
    })
  );

  return response?.Contents || [];
}

export const createMultipartUpload = async ({ filename }) => {
  const { Key, UploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: UPLOAD_BUCKET,
      Key: filename,
      ACL: "private",
    })
  );

  return {
    uploadId: UploadId,
    fileKey: Key,
  }
}

export const createMultipartUploadPart = async ({ fileKey, uploadId, partNumber }) => {
  const command = new UploadPartCommand({
    Bucket: UPLOAD_BUCKET,
    Key: fileKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  const signedUrl = await getSignedUrl(
    client as any, // avoiding typescript lint errors
    command as any, // avoiding typescript lint errors
    {
      expiresIn: 3600,
    }
  );

  return {
    signedUrl
  }
}

export const finishMultipartUpload = async ({ fileKey, uploadId, parts }) => {
  const response = await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: UPLOAD_BUCKET,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => {
          if (a.PartNumber < b.PartNumber) {
            return -1;
          }

          if (a.PartNumber > b.PartNumber) {
            return 1;
          }

          return 0;
        })
      }
    })
  );

  return response;
};
