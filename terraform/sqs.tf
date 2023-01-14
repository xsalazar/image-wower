resource "aws_sqs_queue" "instance" {
  name                       = "wow-emoji-queue"
  visibility_timeout_seconds = 90 // seconds
}
