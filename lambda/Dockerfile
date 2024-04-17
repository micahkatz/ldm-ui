FROM public.ecr.aws/lambda/python:3.9

# Install PostgreSQL development libraries
RUN yum install -y postgresql-devel gcc libpq-dev

COPY requirements.txt .
RUN pip install --upgrade pip
# RUN pip install psycopg2-binary
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY . ${LAMBDA_TASK_ROOT}
CMD ["app.lambda_handler"]
