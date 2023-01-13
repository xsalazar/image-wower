FROM public.ecr.aws/lambda/nodejs:18

# Fix up environment for base image
RUN yum -y install wget
ENV NUMBA_CACHE_DIR=/tmp

# Copy function code
COPY app.js package.json ${LAMBDA_TASK_ROOT}/
COPY libs ${LAMBDA_TASK_ROOT}/libs

# Install packages
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm install

# Download rembg and model
RUN mkdir -p /tmp/libs/u2net
RUN wget https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx -P /tmp/libs/u2net

# Make environment variable for u2net model home directory
ENV U2NET_HOME=/tmp/libs/u2net

# Install Python 3.9 and necessary packages
RUN mkdir -p ${LAMBDA_TASK_ROOT}/libs/python/
WORKDIR ${LAMBDA_TASK_ROOT}/libs/python/
RUN yum -y groupinstall "Development Tools"
RUN yum -y install openssl-devel bzip2-devel libffi-devel xz xz-devel lzma lzma-devel
RUN wget https://www.python.org/ftp/python/3.9.10/Python-3.9.10.tgz
RUN tar xvf ./Python-3.9.10.tgz
WORKDIR ${LAMBDA_TASK_ROOT}/libs/python/Python-3.9.10
RUN ./configure --enable-optimizations
RUN make altinstall
RUN pip3.9 install rembg

WORKDIR ${LAMBDA_TASK_ROOT}

CMD [ "app.handler" ]