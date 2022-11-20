FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y php \
                       php-pear \
                       python3 \
                       python3-pip \
                       gcc \
                       openssl \
                       imagemagick \
                       gifsicle \
                       nodejs \
                       npm \
                       curl

RUN pip3 install rembg gdown

# Make directory for u2net model, set that as environment variable, and download model
RUN mkdir ./u2net
ENV U2NET_HOME=./u2net
RUN gdown https://drive.google.com/uc?id=1tCU5MM1LhRgGou5OpmpjBQbSrYIUoYab -O ./u2net/u2net.onnx

# Copy function code
COPY app.js package.json ./
COPY gifs ./gifs
RUN npm install

# Expose the port used by the service
EXPOSE 8400

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "node", "app.js" ]