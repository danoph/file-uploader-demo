import type { NextApiRequest, NextApiResponse } from 'next'
import { createMultipartUpload } from '@/lib/s3';
import mime from 'mime-types';

export default async function handler(req, res) {
  const { filename } = req.body;

  if (mime.lookup(filename).match(/image\//)) {
    const { uploadId, fileKey } = await createMultipartUpload({ filename });

    res.status(201).json({
      uploadId,
      fileKey,
    });
  } else {
    res.status(422).json({
      message: "Upload must be an image"
    });
  }
}
