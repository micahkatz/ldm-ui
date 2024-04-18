FROM public.ecr.aws/lambda/python:3.9

RUN yum update -y
# Install PostgreSQL development libraries
# RUN yum install -y postgresql-devel gcc
# RUN yum install -y postgresql-devel gcc libpq-dev

COPY requirements.txt .
# ADD psycopg2 "${LAMBDA_TASK_ROOT}/psycopg2"
RUN pip install --upgrade pip
# RUN pip install psycopg2-binary
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY . ${LAMBDA_TASK_ROOT}
CMD ["app.lambda_handler"]
