terraform {
  required_version = "~> 1.1.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.30.0"
    }
  }
  backend "s3" {
    bucket = "xsalazar-terraform-state"
    key    = "image-wower/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = "us-west-2"
  default_tags {
    tags = {
      CreatedBy = "terraform"
    }
  }
}

output "ecr_repository_name" {
  value = aws_ecr_repository.instance.name
}

output "lambda_function" {
  value = aws_lambda_function.instance.function_name
}

output "gifs_bucket" {
  value = "s3://${aws_s3_bucket.gifs.bucket}"
}
