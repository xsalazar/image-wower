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

resource "template_dir" "task_definition" {
  source_dir      = path.module
  destination_dir = path.module
}

output "ecr_repository_name" {
  value = aws_ecr_repository.instance.name
}

output "lambda_function" {
  value = aws_lambda_function.instance.function_name
}
