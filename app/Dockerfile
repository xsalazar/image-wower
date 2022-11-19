FROM public.ecr.aws/lambda/nodejs:16

# Copy function code
COPY app.js package.json ${LAMBDA_TASK_ROOT}/
COPY gifs ${LAMBDA_TASK_ROOT}/gifs

RUN yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
RUN yum install -y php-pear \
                   php-devel \
                   python3-pip \
                   gcc \
                   openssl-devel \
                   ImageMagick \
                   ImageMagick-devel \
                   gifsicle \
                   tar \
                   gzip \
                   wget \
                   make

# Install Python 3.7
WORKDIR /usr/src
RUN wget https://www.python.org/ftp/python/3.7.15/Python-3.7.15.tgz
RUN tar xzvf Python-3.7.15.tgz
WORKDIR Python-3.7.15
RUN ./configure --prefix=/opt/python3
RUN make altinstall
# RUN ln -s /opt/python3/bin/python3.7 /usr/bin/python3.7
WORKDIR ${LAMBDA_TASK_ROOT}/

RUN pip3 install rembg gdown

# See: https://github.com/numba/numba/issues/4032
ENV NUMBA_CACHE_DIR=/tmp/numba_cache

# Make directory for u2net model, set that as environment variable, and download model
RUN mkdir ${LAMBDA_TASK_ROOT}/u2net
ENV U2NET_HOME=${LAMBDA_TASK_ROOT}/u2net
RUN gdown https://drive.google.com/uc?id=1tCU5MM1LhRgGou5OpmpjBQbSrYIUoYab -O ${LAMBDA_TASK_ROOT}/u2net/u2net.onnx

RUN npm install

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]