import type { NextApiRequest, NextApiResponse } from 'next'
import { createMultipartUpload } from '@/lib/s3';

export default async function handler(req, res) {
  const { filename } = req.body;

  const { uploadId, fileKey } = await createMultipartUpload({ filename });

  res.status(201).json({
    uploadId,
    fileKey,
  });
}
