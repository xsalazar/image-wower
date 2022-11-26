# 🌈 Image Wower

This repository holds both the Terraform infrastructure as well as the simple Javascript application that runs inside the ECS Cluster, managed via Fargate.

This application code is an "image wowing" service that takes an input image, removes the background, and overlays it on top of a colorful gif. This application leverages the [`sharp`](https://sharp.pixelplumbing.com/) library for quick, high-quality image manipulation, as well as [`imagemagick`](https://imagemagick.org/) for compositing and optimizing the output gifs.

The infrastructure supporting this backend application is a simple Application Load Balancer that forwards valid requests to the ECS Cluster.

The backend application is used to support the website [https://wowemoji.dev](https://wowemoji.dev) for quick and reliable wowifications.

## Getting Started

This repository leverages [VSCode's devcontainer](https://code.visualstudio.com/docs/remote/containers) feature to ensure all necessary dependencies are available inside the container for development.

### Application

The application code for this repository is contained in the [`./app`](./app) directory.

To get started:

```bash
cd app/ && npm init
```

All application deployments are managed via GitHub Actions and the [`./.github/workflows/deploy_application.yml`](./.github/workflows/deploy_application.yml) workflow.

### Infrastructure

The infrastructure code for this repository is contained in the [`./terraform`](./terraform) directory. The required Terraform version is `1.1.2`. The AWS artifacts managed in this repository are illustrated below.

To get started:

```bash
cd terraform/ && terraform init
```

All infrastructure deployments are managed via GitHub Actions and the [`./.github/workflows/deploy_infrastructure.yml`](./.github/workflows/deploy_infrastructure.yml) workflow.

![](./assets/architecture.svg)
