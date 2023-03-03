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

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_distribution" "uploads" {
  origin {
    domain_name              = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id                = "file-uploader-demo"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.uploads.cloudfront_access_identity_path
    }
  }

  enabled             = true

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "file-uploader-demo"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "uploads" {}

data "aws_iam_policy_document" "cloudfront_s3" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.uploads.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  policy = data.aws_iam_policy_document.cloudfront_s3.json
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.uploads.domain_name
}

output "access_key_id" {
  value = aws_iam_access_key.vercel.id
}

output "access_key_secret" {
  sensitive = true
  value = aws_iam_access_key.vercel.secret
}
