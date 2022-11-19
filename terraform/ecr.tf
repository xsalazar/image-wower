resource "aws_ecr_repository" "instance" {
  name = "image-wower-ecr-repo"
}

data "aws_ecr_repository" "instance" {
  name = aws_ecr_repository.instance.name
}
