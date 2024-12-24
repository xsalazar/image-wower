# Input queue that feeds into the rembg service
resource "aws_sqs_queue" "rembg_input" {
  name                       = "wow-emoji-rembg-input-queue"
  visibility_timeout_seconds = 90 // seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.rembg_input_deadletter.arn
    maxReceiveCount     = 5
  })
}

data "aws_sqs_queue" "rembg_input_data" {
  name = "wow-emoji-rembg-input-queue"
}

resource "aws_sqs_queue" "rembg_input_deadletter" {
  name = "wow-emoji-rembg-input-queue-deadletter"

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [data.aws_sqs_queue.rembg_input_data.arn]
  })
}


resource "aws_sqs_queue_policy" "rembg_policy" {
  queue_url = aws_sqs_queue.rembg_input.id

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
            "sqs:GetQueueAttributes",
            "sqs:ReceiveMessage"
          ],
          "Effect": "Allow",
          "Resource": "${aws_sqs_queue.rembg_input.arn}",
          "Condition": {
            "ArnEquals": {
              "aws:SourceArn": "${aws_lambda_function.rembg_input.arn}"
            }
          },
          "Principal": "*"
        }
      ]
    }
  POLICY
}

resource "aws_lambda_event_source_mapping" "rembg_sqs_lambda_mapping" {
  event_source_arn = aws_sqs_queue.rembg_input.arn
  enabled          = true
  function_name    = aws_lambda_function.rembg.function_name
  batch_size       = 1
}

# Input queue that feeds into the combiner service
resource "aws_sqs_queue" "combiner_input" {
  name                       = "wow-emoji-combiner-input-queue"
  visibility_timeout_seconds = 90 // seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.combiner_input_deadletter.arn
    maxReceiveCount     = 5
  })
}

data "aws_sqs_queue" "combiner_input_data" {
  name = "wow-emoji-combiner-input-queue"
}

resource "aws_sqs_queue" "combiner_input_deadletter" {
  name = "wow-emoji-combiner-input-queue-deadletter"

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [data.aws_sqs_queue.combiner_input_data.arn]
  })
}


resource "aws_sqs_queue_policy" "combiner_policy" {
  queue_url = aws_sqs_queue.combiner_input.id

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
            "sqs:GetQueueAttributes",
            "sqs:ReceiveMessage"
          ],
          "Effect": "Allow",
          "Resource": "${aws_sqs_queue.combiner_input.arn}",
          "Condition": {
            "ArnEquals": {
              "aws:SourceArn": "${aws_lambda_function.combiner.arn}"
            }
          },
          "Principal": "*"
        }
      ]
    }
  POLICY
}

resource "aws_lambda_event_source_mapping" "combiner_sqs_lambda_mapping" {
  event_source_arn = aws_sqs_queue.combiner_input.arn
  enabled          = true
  function_name    = aws_lambda_function.combiner.function_name
  batch_size       = 1
}
