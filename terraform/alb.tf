resource "aws_lb" "instance" {
  name               = "image-wower-alb"
  load_balancer_type = "application"
  idle_timeout       = 120 // seconds
  subnets = [
    "subnet-24cdfd6f",
    "subnet-6a5e4813"
  ]
}

resource "aws_lb_listener" "instance" {
  load_balancer_arn = aws_lb.instance.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = data.aws_acm_certificate.instance.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.instance.arn
  }
}

resource "aws_lb_target_group" "instance" {
  name                 = "image-wower-alb-target-group"
  target_type          = "ip"
  protocol             = "HTTP"
  port                 = 8400
  vpc_id               = "vpc-6e8a0f16"
  deregistration_delay = 30 // seconds

  health_check {
    interval          = 30 // seconds
    timeout           = 5  // seconds
    healthy_threshold = 2
    protocol          = "HTTP"
    path              = "/"
  }
}

data "aws_acm_certificate" "instance" {
  domain = "*.wowemoji.dev"
}
