# Define function directory
ARG FUNCTION_DIR="/function"

FROM nikolaik/python-nodejs:python3.9-nodejs18 as build-image

# Install aws-lambda-cpp build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Create function directory
RUN mkdir -p ${FUNCTION_DIR}

# Copy function code
COPY app.js package.json ${FUNCTION_DIR}/
COPY libs ${FUNCTION_DIR}/libs

# Download rembg
RUN wget https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx -O ${FUNCTION_DIR}/libs/u2net/u2net_human_seg.onnx

# Install packages
WORKDIR ${FUNCTION_DIR}
RUN npm install

# Install the runtime interface client
RUN npm install aws-lambda-ric

# Multi-stage build: grab a fresh copy of the base image
FROM nikolaik/python-nodejs:python3.9-nodejs18

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

# Make environment variable for u2net model home directory
ENV U2NET_HOME=${LAMBDA_TASK_ROOT}/libs/u2net

# Copy in the build image dependencies
COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}

# Install Python packages
RUN  pip3 install rembg --target "${LAMBDA_TASK_ROOT}"

ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
CMD [ "app.handler" ]