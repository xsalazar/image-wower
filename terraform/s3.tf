resource "aws_s3_bucket" "data" {
  bucket = "image-wower-data"
}

resource "aws_s3_bucket" "gifs" {
  bucket = "image-wower-gifs"
}

resource "aws_s3_bucket" "rembg_lambda_deploy_bucket" {
  bucket = "image-wower-rembg-lambda-deploy-bucket"
}
