resource "aws_s3_bucket" "data" {
  bucket = "image-wower-data"
}

resource "aws_s3_bucket" "gifs" {
  bucket = "image-wower-gifs"
}
