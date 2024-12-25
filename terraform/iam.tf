data "aws_iam_policy_document" "assume_role_policy_document" {
  version = "2012-10-17"
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "lambda_access_policy_document" {
  version = "2012-10-17"

  // From AWSLambdaVPCAccessExecutionRole
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }

  // For ECR access
  statement {
    effect = "Allow"
    actions = [
      "ecr:SetRepositoryPolicy", "ecr:GetRepositoryPolicy"
    ]
    resources = ["${aws_ecr_repository.instance.arn}"]
  }

  // For SQS access
  statement {
    effect = "Allow"
    actions = [
      "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:ReceiveMessage", "sqs:SendMessage"
    ]
    resources = ["${aws_sqs_queue.combiner_input.arn}", "${aws_sqs_queue.rembg_input.arn}"]
  }

  // For S3 access
  statement {
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = ["${aws_s3_bucket.data.arn}", "${aws_s3_bucket.data.arn}/*", "${aws_s3_bucket.gifs.arn}", "${aws_s3_bucket.gifs.arn}/*"]
  }
}

resource "aws_iam_role" "instance" {
  name               = "lambda-iam-role-image-wower"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_document.json
}

resource "aws_iam_policy" "instance" {
  name   = "lambda-image-wower-iam-policy"
  policy = data.aws_iam_policy_document.lambda_access_policy_document.json
}

resource "aws_iam_role_policy_attachment" "instance" {
  role       = aws_iam_role.instance.id
  policy_arn = aws_iam_policy.instance.arn
}

resource "aws_lambda_permission" "lambda_root_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.instance.execution_arn}/*/*/"
}

resource "aws_lambda_permission" "lambda_proxy_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.instance.execution_arn}/*/*/*"
}
