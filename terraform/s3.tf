resource "aws_s3_bucket" "data" {
  bucket = "image-wower-data"
}

resource "aws_s3_bucket_lifecycle_configuration" "l1" {
  bucket = aws_s3_bucket.data.id
  rule {
    status = "Enabled"
    id     = "expire_all_files"
    expiration {
      days = 10
    }
  }
}

resource "aws_s3_bucket" "gifs" {
  bucket = "image-wower-gifs"
}
