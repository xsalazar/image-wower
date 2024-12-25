terraform {
  required_version = "~> 1.10.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.81.0"
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

output "api_lambda_function" {
  value = aws_lambda_function.api.function_name
}

output "rembg_lambda_function" {
  value = aws_lambda_function.rembg.function_name
}

output "rembg_lambda_deploy_bucket_name" {
  value = aws_s3_bucket.rembg_lambda_deploy_bucket.bucket
}

output "combiner_lambda_function" {
  value = aws_lambda_function.combiner.function_name
}
