import type { NextApiRequest, NextApiResponse } from 'next'
import { finishMultipartUpload } from '@/lib/s3';

export default async function handler(req, res) {
  const { uploadId } = req.query;
  const { fileKey, parts } = req.body;

  const response = await finishMultipartUpload({
    fileKey,
    uploadId,
    parts
  });

  res.status(200).json({});
}
