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

resource "aws_iam_role" "instance" {
  name               = "lambda-iam-role-image-wower"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_document.json
}

resource "aws_iam_role_policy_attachment" "instance" {
  role       = aws_iam_role.instance.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_permission" "lambda_root_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.instance.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.instance.execution_arn}/*/*/"
}

resource "aws_lambda_permission" "lambda_proxy_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.instance.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.instance.execution_arn}/*/*/*"
}
