resource "aws_s3_bucket" "instance" {
  bucket = "image-wower-data"
}

resource "aws_s3_bucket" "gifs" {
  bucket = "image-wower-gifs"
}
