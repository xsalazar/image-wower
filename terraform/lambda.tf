variable "remove_bg_api_key" {
  type = string
}

variable "giphy_api_key" {
  type = string
}

resource "aws_lambda_function" "instance" {
  function_name = "image-wower"
  filename      = "${path.module}/dummy-lambda-package/lambda.zip" // Simple hello world application
  role          = aws_iam_role.instance.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 60   // seconds
  memory_size   = 1536 // MB

  environment {
    variables = {
      REMOVE_BG_API_KEY = var.remove_bg_api_key,
      GIPHY_API_KEY     = var.giphy_api_key
    }
  }

  // Since CI/CD will deploy this application externally, these do not need to be tracked after creation
  lifecycle {
    ignore_changes = [
      last_modified,
      source_code_hash,
      source_code_size
    ]
  }
}

resource "aws_cloudwatch_log_group" "instance" {
  name              = "/aws/lambda/${aws_lambda_function.instance.function_name}"
  retention_in_days = 30 // days
}
