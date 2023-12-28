resource "aws_lambda_function" "instance" {
  function_name = "image-wower"
  image_uri     = "foo:bar"
  role          = aws_iam_role.instance.arn
  timeout       = 180   // seconds
  memory_size   = 10240 // MB
  package_type  = "Image"

  ephemeral_storage {
    size = 4096 # Min 512 MB and the Max 10240 MB
  }

  // CI/CD will deploy updates to the Lambda functions outside of Terraform, so ignore future changes
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
