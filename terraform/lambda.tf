resource "aws_lambda_function" "instance" {
  function_name = "image-wower"
  image_uri     = "368081326042.dkr.ecr.us-west-2.amazonaws.com/image-wower-ecr-repo:aeb86a74f0779287dc23947007cadaebfa4454a0"
  role          = aws_iam_role.instance.arn
  timeout       = 30   // seconds -- matches API Gateway integration timeout limit
  memory_size   = 4096 // MB
  package_type  = "Image"

  ephemeral_storage {
    size = 4096 # Min 512 MB and the Max 10240 MB
  }

  // Since CI/CD will deploy this application externally, these do not need to be tracked after creation
  lifecycle {
    ignore_changes = [
      last_modified,
      source_code_hash,
      source_code_size,
      image_uri
    ]
  }
}

resource "aws_cloudwatch_log_group" "instance" {
  name              = "/aws/lambda/${aws_lambda_function.instance.function_name}"
  retention_in_days = 30 // days
}

resource "aws_s3_bucket" "instance" {
  bucket = "image-wower-gifs"
}

resource "aws_s3_bucket" "rembg" {
  bucket = "rembg-binary"
}
