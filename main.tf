terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "4.39.0"
    }
  }
}

terraform {
  backend "s3" {
    bucket = "danoph-file-uploader-demo-terraform"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

locals {
  upload-bucket-name = "danoph-file-uploader-demo"
}

resource "aws_s3_bucket" "uploads" {
  bucket = local.upload-bucket-name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
  }
}

resource "aws_iam_user" "vercel" {
  name = "file-uploader-demo"
  path = "/system/"
}

resource "aws_iam_access_key" "vercel" {
  user = aws_iam_user.vercel.name
}

resource "aws_iam_policy" "s3_access" {
  name        = "vercel_file_uploader_demo"
  path        = "/"
  description = "IAM policy for s3 access from vercel"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::${local.upload-bucket-name}/*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_user_policy_attachment" "s3_access" {
  user       = aws_iam_user.vercel.name
  policy_arn = aws_iam_policy.s3_access.arn
}

output "access_key_id" {
  value = aws_iam_access_key.vercel.id
}

output "access_key_secret" {
  sensitive = true
  value = aws_iam_access_key.vercel.secret
}
