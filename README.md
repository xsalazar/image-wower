# 🌈 Image Wower

This repository holds both the Terraform infrastructure as well as the Javascript application that runs inside AWS Lambda.

The core application code is an "image wowing" service that takes an input image, removes the background, and overlays it on top of a colorful gif. This application leverages the [`sharp`](https://sharp.pixelplumbing.com/) library for quick, high-quality image manipulation.

The infrastructure supporting this backend application is an API Gateway that forwards valid requests to the Lambda function.

Depending on the nature of the request, the journey is as follows:

- Enqueue
  - Lambda receives a request to enqueue an image for processing, the Lambda will generate a unique token to give back to the client to use to poll the API
  - Lambda will store the original image in S3
  - Lambda will put a message on an SQS queue with the token, indicating it needs to be processed
- Processing
  - The SQS queue will trigger a Lambda invocation upon receiving a message on its queue
  - Lambda will find the image for the corresponding token in S3
  - Lambda will then remove the background, overlay it on a GIF, and put the result back in S3
  - Lambda will delete the message from SQS if successful
- Retrieval
  - The client will poll the API with their token
  - If the processed result hasn't been put in S3 yet, Lambda will return a 404, indicating the client should try again soon
  - If the processed result is in S3, Lambda will download the result, delete all original content in S3, and return the result to the client

This backend application is used to support the website [https://wowemoji.dev](https://wowemoji.dev) for quick and reliable wowifications.

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
