resource "aws_sqs_queue" "instance" {
  name                       = "wow-emoji-queue"
  visibility_timeout_seconds = 90 // seconds
}

resource "aws_sqs_queue_policy" "instance" {
  queue_url = aws_sqs_queue.instance.id

  policy = <<POLICY
    {
      "Id": "Policy1673660011566",
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Stmt1673660009311",
          "Action": [
            "sqs:DeleteMessage",
            "sqs:SendMessage",
            "sqs:GetQueueAttributes"
          ],
          "Effect": "Allow",
          "Resource": "${aws_sqs_queue.instance.arn}",
          "Condition": {
            "ArnEquals": {
              "aws:SourceArn": "${aws_lambda_function.instance.arn}"
            }
          },
          "Principal": "*"
        }
      ]
    }
  POLICY
}

resource "aws_lambda_event_source_mapping" "instance" {
  event_source_arn = aws_sqs_queue.instance.arn
  enabled          = true
  function_name    = aws_lambda_function.instance.function_name
  batch_size       = 1
}
