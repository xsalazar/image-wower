locals {
  ecs_service_name = "image-wower-service"
}

resource "aws_ecs_cluster" "instance" {
  name = "image-wower-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_service" "instance" {
  name                               = local.ecs_service_name
  cluster                            = aws_ecs_cluster.instance.id
  task_definition                    = aws_ecs_task_definition.instance.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"

  network_configuration {
    assign_public_ip = true
    security_groups  = ["sg-11972e50"]
    subnets = [
      "subnet-24cdfd6f",
      "subnet-6a5e4813"
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.instance.arn
    container_name   = "image-wower-container-def"
    container_port   = 8400
  }

  // Ignored because the autoscaling might change this value once the service is running
  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }
}

resource "aws_ecs_task_definition" "instance" {
  family                   = "image-wower-task-definition-family"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  container_definitions = jsonencode([{
    name  = "image-wower-container-def"
    image = "368081326042.dkr.ecr.us-west-2.amazonaws.com/image-wower-ecr-repo:bb67b8b161f9e154ef27a2bd145dde1a0fa1d231"
    portMappings = [{
      containerPort = 8400
    }]
  }])
}

resource "template_dir" "task_definition" {
  source_dir      = "${path.module}/templates"
  destination_dir = "${path.module}/rendered"

  vars = {
    awslogs_group         = aws_cloudwatch_log_group.instance.name
    awslogs_stream_prefix = "application"
    execution_role_arn    = aws_iam_role.ecs_execution_role.arn
    region                = "us-west-2"
  }
}

resource "aws_cloudwatch_log_group" "instance" {
  name              = "/aws/ecs/${local.ecs_service_name}"
  retention_in_days = 30
}


