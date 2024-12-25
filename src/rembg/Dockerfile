FROM public.ecr.aws/lambda/python:3.9

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

ENV OMP_NUM_THREADS=2

# Copy function code
COPY index.py ${LAMBDA_TASK_ROOT}

CMD [ "index.handler" ]