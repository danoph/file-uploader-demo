import type { NextApiRequest, NextApiResponse } from 'next'
import { listBucketFiles } from '@/lib/s3';
import mime from 'mime-types';

export interface UploadedImage {
  title: string;
  source: string;
  size: number;
}

// the S3 Object field types are defined as string | null so we have to be a little defensive when using
// those objects in our TypeScript code

export default async function handler(req, res: NextApiResponse<UploadedImage[]>) {
  const images = (await listBucketFiles())
  .filter(s3File => mime.lookup(s3File?.Key || "").match(/image\//))
  .map(s3File => ({
    title: s3File.Key || "some image",
    source: `https://d1m5oohnuppcs9.cloudfront.net/${s3File.Key}`,
    size: s3File.Size || 0,
  }));

  res.status(200).json(images);
}
