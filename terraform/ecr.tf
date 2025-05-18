resource "aws_ecr_repository" "instance" {
  name = "wow-emoji-ecr-repo"
}

data "aws_ecr_repository" "instance" {
  name = aws_ecr_repository.instance.name
}
