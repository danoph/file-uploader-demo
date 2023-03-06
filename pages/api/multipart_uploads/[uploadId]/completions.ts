import type { NextApiRequest, NextApiResponse } from 'next'
import { getS3ObjectMetadata, finishMultipartUpload } from '@/lib/s3';
import { UploadedImage } from '@/lib/models';

export default async function handler(req, res: NextApiResponse<UploadedImage>) {
  const { uploadId } = req.query;
  const { fileKey, parts } = req.body;

  const finishResponse = await finishMultipartUpload({
    fileKey,
    uploadId,
    parts
  });

  const objectMetadata = await getS3ObjectMetadata({ filename: fileKey });

  res.status(200).json({
    title: finishResponse.Key || "",
    source: `https://d1m5oohnuppcs9.cloudfront.net/${finishResponse.Key}`,
    size: objectMetadata.ContentLength || 0,
  });
}
