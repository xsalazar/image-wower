FROM public.ecr.aws/lambda/nodejs:18

# Copy function code
COPY app.js package.json ${LAMBDA_TASK_ROOT}/
COPY libs ${LAMBDA_TASK_ROOT}/libs

# Install packages
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm install

# Download rembg and model
RUN yum -y install wget
RUN mkdir ${LAMBDA_TASK_ROOT}/libs/u2net/
RUN wget https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx -O ${LAMBDA_TASK_ROOT}/libs/u2net/u2net_human_seg.onnx

# Make environment variable for u2net model home directory
ENV U2NET_HOME=${LAMBDA_TASK_ROOT}/libs/u2net

# Install Python 3.9 and necessary packages
RUN mkdir ${LAMBDA_TASK_ROOT}/libs/python/
WORKDIR ${LAMBDA_TASK_ROOT}/libs/python/
RUN yum -y groupinstall "Development Tools"
RUN yum -y install openssl-devel bzip2-devel libffi-devel
RUN wget https://www.python.org/ftp/python/3.9.10/Python-3.9.10.tgz -O ./Python-3.9.10.tgz
RUN tar xvf ./Python-3.9.10.tgz
WORKDIR ${LAMBDA_TASK_ROOT}/libs/python/Python-3.9.10
RUN ./configure --enable-optimizations
RUN make altinstall
RUN pip3.9 install rembg

CMD [ "app.handler" ]