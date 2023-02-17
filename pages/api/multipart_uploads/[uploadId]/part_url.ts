import type { NextApiRequest, NextApiResponse } from 'next'
import { createMultipartUploadPart } from '@/lib/s3';

export default async function handler(req, res) {
  const { uploadId } = req.query;
  const { fileKey, partNumber } = req.body;

  const { signedUrl } = await createMultipartUploadPart({
    fileKey,
    uploadId,
    partNumber
  });

  res.status(201).json({
    signedUrl
  });
}
