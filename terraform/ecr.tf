
resource "aws_ecr_repository" "instance" {
  name = "image-wower-ecr-repo"
}

data "aws_ecr_repository" "instance" {
  name = aws_ecr_repository.instance.name
}

data "aws_ecr_image" "instance" {
  repository_name = aws_ecr_repository.instance.name
  image_tag       = "init"
}
