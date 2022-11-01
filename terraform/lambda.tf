variable "remove_bg_api_key" {
  type = string
}

resource "aws_lambda_function" "instance" {
  function_name = "image-wower"
  filename      = "${path.module}/dummy-lambda-package/lambda.zip" // Simple hello world application
  role          = aws_iam_role.instance.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout       = 30   // seconds
  memory_size   = 1536 // MB

  // See: https://www.jvt.me/posts/2022/04/08/node-canvas-lambda/
  layers = ["arn:aws:lambda:us-west-2:368081326042:layer:canvas-nodejs:1"]
  environment {
    variables = {
      LD_PRELOAD : "/var/task/node_modules/canvas/build/Release/libz.so.1"
      REMOVE_BG_API_KEY = var.remove_bg_api_key
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
