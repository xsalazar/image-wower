resource "aws_lambda_function" "instance" {
  function_name = "image-wower"
  image_uri     = "${aws_ecr_repository.instance.arn}:abc123"
  role          = aws_iam_role.instance.arn
  timeout       = 30    // seconds -- matches API Gateway integration timeout limit
  memory_size   = 10240 // MB
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

resource "aws_lambda_alias" "instance" {
  name             = "image-wower-alias"
  function_name    = aws_lambda_function.instance.arn
  function_version = "1"

  // Since CI/CD will deploy this application externally, these do not need to be tracked after creation
  lifecycle {
    ignore_changes = [
      function_version
    ]
  }
}

resource "aws_cloudwatch_log_group" "instance" {
  name              = "/aws/lambda/${aws_lambda_function.instance.function_name}"
  retention_in_days = 30 // days
}
