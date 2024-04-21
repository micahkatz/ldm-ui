import time
import pandas as pd
import nltk
import random
from nltk.corpus import wordnet
from io import BytesIO, StringIO
import io
import os
import logging
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import uuid
import re
import json

# import psycopg2
# from psycopg2 import Error
import pg8000.native

load_dotenv()


def lambda_handler(event, context):
    for message in event["Records"]:
        process_message(message)
    print("done")


os.environ["NLTK_DATA"] = "/tmp/nltk_data"

nltk.download("wordnet", download_dir="/tmp/nltk_data")

synonyms_cache = {}
antonyms_cache = {}
hypernyms_cache = {}
hyponyms_cache = {}


def remove_html_tags(text):
    clean_text = re.sub(r"<.*?>", "", text)
    return clean_text


def get_synonyms(word):
    if word not in synonyms_cache:
        synonyms = set()
        for syn in wordnet.synsets(word):
            for lemma in syn.lemmas():
                synonym = lemma.name()
                if "_" not in synonym:
                    synonyms.add(synonym)
        if word in synonyms:
            synonyms.remove(word)
        synonyms_cache[word] = list(synonyms)
    return synonyms_cache[word]


def get_antonyms(word):
    if word not in antonyms_cache:
        antonyms = set()
        for syn in wordnet.synsets(word):
            for lemma in syn.lemmas():
                if lemma.antonyms():
                    antonym = lemma.antonyms()[0].name()
                    if "_" not in antonym:
                        antonyms.add(antonym)
        antonyms_cache[word] = list(antonyms)
    return antonyms_cache[word]


def get_hypernyms(word):
    if word not in hypernyms_cache:
        hypernyms = set()
        for syn in wordnet.synsets(word):
            for hypernym in syn.hypernyms():
                hypernym_name = hypernym.lemmas()[0].name()
                if "_" not in hypernym_name:
                    hypernyms.add(hypernym_name)
        hypernyms_cache[word] = list(hypernyms)
    return hypernyms_cache[word]


def get_hyponyms(word):
    if word not in hyponyms_cache:
        hyponyms = set()
        for syn in wordnet.synsets(word):
            for hyponym in syn.hyponyms():
                hyponym_name = hyponym.lemmas()[0].name()
                if "_" not in hyponym_name:
                    hyponyms.add(hyponym_name)
        hyponyms_cache[word] = list(hyponyms)
    return hyponyms_cache[word]


def synonym_replacement_batch(words, n=10):
    new_words = words.copy()
    random_indices = random.sample(range(len(words)), min(n, len(words)))
    for idx in random_indices:
        random_word = words[idx]
        synonyms = get_synonyms(random_word)
        eligible_synonyms = [syn for syn in synonyms if "_" not in syn]
        if eligible_synonyms:
            synonym = random.choice(eligible_synonyms)
            new_words[idx] = synonym
    return new_words


def antonym_replacement_batch(words, n=10):
    new_words = words.copy()
    random_indices = random.sample(range(len(words)), min(n, len(words)))
    for idx in random_indices:
        random_word = words[idx]
        antonyms = get_antonyms(random_word)
        eligible_antonyms = [ant for ant in antonyms if "_" not in ant]
        if eligible_antonyms:
            antonym = random.choice(eligible_antonyms)
            new_words[idx] = antonym
    return new_words


def hypernym_replacement_batch(words, n=10):
    new_words = words.copy()
    random_indices = random.sample(range(len(words)), min(n, len(words)))
    for idx in random_indices:
        random_word = words[idx]
        hypernyms = get_hypernyms(random_word)
        eligible_hypernyms = [hyper for hyper in hypernyms if "_" not in hyper]
        if eligible_hypernyms:
            hypernym = random.choice(eligible_hypernyms)
            new_words[idx] = hypernym
    return new_words


def hyponym_replacement_batch(words, n=10):
    new_words = words.copy()
    random_indices = random.sample(range(len(words)), min(n, len(words)))
    for idx in random_indices:
        random_word = words[idx]
        hyponyms = get_hyponyms(random_word)
        eligible_hyponyms = [hypo for hypo in hyponyms if "_" not in hypo]
        if eligible_hyponyms:
            hyponym = random.choice(eligible_hyponyms)
            new_words[idx] = hyponym

    return new_words


def random_deletion(words, p=0.1):
    if len(words) == 1:
        return words
    remaining = list(filter(lambda x: random.uniform(0, 1) > p, words))
    if len(remaining) == 0:
        return [random.choice(words)]
    return remaining


def random_swap(words, n=5):
    length = len(words)
    if length < 2:
        return words
    for _ in range(n):
        idx1, idx2 = random.sample(range(length), 2)
        words[idx1], words[idx2] = words[idx2], words[idx1]
    return words


def upload_file(data, file_name):
    s3 = boto3.resource("s3")
    object = s3.Object("ldm-csv-bucket", file_name)
    object.put(Body=data)


connection = pg8000.native.Connection(
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST"),
    database=os.getenv("POSTGRES_DATABASE"),
)


def get_dataset_by_id(dataset_id):
    query_initial_data = """
            SELECT name, user_id, prompt, column_data FROM dataset WHERE id = :id;
        """
    initial_data_result = connection.run(query_initial_data, id=dataset_id)
    return initial_data_result


def get_dataset_uri_by_id(dataset_id):
    query_initial_data = """
            SELECT dataset_uri FROM dataset WHERE id = :id;
        """
    initial_data_result = connection.run(query_initial_data, id=dataset_id)
    return initial_data_result[0][0]


def update_db(file_name, dataset_id):
    try:
        # password = f'endpoint={os.getenv("POSTGRES_ENDPOINT_ID")};{os.getenv("POSTGRES_PASSWORD")}'
        # database = f'{os.getenv("POSTGRES_DATABASE")} options=endpoint={os.getenv("POSTGRES_ENDPOINT_ID")}'
        # Establish a connection to the PostgreSQL database
        # connection = psycopg2.connect(
        #     user=os.getenv("POSTGRES_USER"),
        #     password=password,
        #     host=os.getenv("POSTGRES_HOST"),
        #     database=os.getenv("POSTGRES_DATABASE"),
        #     sslmode='require'
        # )

        # connection = pg8000.native.Connection(
        #     user=os.getenv("POSTGRES_USER"),
        #     password=os.getenv("POSTGRES_PASSWORD"),
        #     host=os.getenv("POSTGRES_HOST"),
        #     database=os.getenv("POSTGRES_DATABASE"),
        # )

        # connection = psycopg2.connect(os.getenv("POSTGRES_URL"))

        initial_data_result = get_dataset_by_id(dataset_id)
        dataset_name = initial_data_result[0][0]
        print("dataset_name", dataset_name)
        user_id = initial_data_result[0][1]
        print("user_id", user_id)
        prompt = initial_data_result[0][2]
        print("prompt", prompt)
        column_data = initial_data_result[0][3]
        print("column_data", column_data)

        insert_augmented_data = """
            INSERT INTO dataset (name, user_id, prompt, dataset_uri, column_data, created_at, updated_at)
            VALUES (:name, :user_id, :prompt, :uri, :column_data, NOW(), NOW());
        """
        if dataset_name is None:
            dataset_name = "Augmented Dataset"
        else:
            dataset_name = dataset_name + " (Augmented)"

        connection.run(
            insert_augmented_data,
            uri=file_name,
            id=dataset_id,
            name=dataset_name,
            user_id=user_id,
            prompt=prompt,
            column_data=column_data,
        )

        update_original_dataset_query = """
            UPDATE dataset
            SET augmented_uri = :uri
            WHERE id = :id;
        """
        connection.run(
            update_original_dataset_query,
            uri=file_name,
            id=dataset_id,
        )

        # cursor = connection.cursor()
        # cursor.execute(update_original_dataset_query, (file_name, dataset_id))
        # Execute the SQL query with the variables

        # Commit the changes
        # connection.commit()

        # Close the cursor and connection
        # cursor.close()
        # connection.close()

        print("URL saved to db:", file_name, "for dataset", dataset_id)

    except Exception as error:
        print("Error while connecting to PostgreSQL", error)


def load_csv_from_s3(bucket_name, file_key):
    try:
        s3 = boto3.client("s3")
        # Get object from S3

        # bytes_buffer = io.BytesIO()
        # s3.download_fileobj(Bucket=bucket_name, Key=file_key, Fileobj=bytes_buffer)

        # byte_value = bytes_buffer.getvalue()
        # df = pd.read_csv(bytes_buffer)

        response = s3.get_object(Bucket=bucket_name, Key=file_key)

        # Read CSV data
        csv_data = response["Body"].read()

        # Load CSV data into DataFrame
        df = pd.read_csv(BytesIO(csv_data))

        return df
    except Exception as e:
        print(f"Error: {e}")
        return None


def new_status_in_db(user_id, dataset_id):
    status_insert = """
            INSERT INTO task (user_id, status, message, dataset_id, created_at, updated_at)
            VALUES (:user_id, :status, :message, :dataset_id, NOW(), NOW())
            RETURNING id;
        """

    status = "LOADING"
    message = "Started Augmentation"

    db_result = connection.run(
        status_insert, user_id=user_id, status=status, message=message, dataset_id=dataset_id
    )

    print("finished adding new status", db_result)
    task_id = db_result[0][0]
    print("created task id", task_id)

    return task_id


def update_status_in_db(task_id, status, message=None):
    update_status_query = """
            UPDATE task
            SET status = :status,
                message = :message
            WHERE id = :id;
        """

    connection.run(
        update_status_query,
        status=status,
        message=message,
        id=task_id,
    )


def process_message(message):
    task_id = None
    try:
        print(f"Processed message {message}")

        dataset_id = message["body"]
        # dataset_id = message["body"].split("///////")[0]
        # file_key = message["body"].split("///////")[1]
        print("dataset_id", dataset_id)
        user_id = message["messageAttributes"]["uid"]["stringValue"]
        task_id = new_status_in_db(user_id=user_id, dataset_id=dataset_id)

        # s3 = boto3.resource("s3")
        # s3_response = s3.Object(Bucket="ldm-csv-bucket", Key=file_key)

        # csv_data = s3_response['Body'].read()

        # df = pd.read_csv(BytesIO(csv_data))

        file_key = get_dataset_uri_by_id(dataset_id)

        update_status_in_db(task_id=task_id, status="LOADING", message="Loading Dataset")

        df = load_csv_from_s3("ldm-csv-bucket", file_key)
        if df is None:
            return "Unable to get csv from s3"

        columns = df.columns.tolist()

        all_data = []

        # Loop through rows
        for index, row in df.iterrows():
            data_row = row.tolist()
            print("df.iterrows..", data_row)
            updated_data_row = data_row

            # Loop through columns
            for col_idx, value in enumerate(data_row):
                cleaned_value = remove_html_tags(str(value))
                print("cleaned_value", cleaned_value)
                print("split", cleaned_value.split())
                if len(cleaned_value.split()) > 1:
                    words = cleaned_value.split(" ")
                    for _ in range(12):
                        augmentation_methods = random.choices(
                            [
                                ("synonym", synonym_replacement_batch),
                                ("antonym", antonym_replacement_batch),
                                ("hypernym", hypernym_replacement_batch),
                                ("hyponym", hyponym_replacement_batch),
                                ("deletion", random_deletion),
                                ("swap", random_swap),
                            ],
                            k=random.randint(1, 3),
                        )

                        new_value = words
                        functions = []

                        for method_name, method in augmentation_methods:
                            new_value = method(new_value)
                            functions.append(method_name)

                        data_row_copy = data_row.copy()
                        data_row_copy[col_idx] = " ".join(new_value)
                        if "_functions" not in columns:
                            data_row_copy.append("; ".join(functions))
                        all_data.append(data_row_copy)
                        print("data_row", data_row_copy)
                        updated_data_row = data_row_copy

                        # update_status_in_db(task_id=task_id, status="LOADING", message=f'Created {len(all_data)} Rows')


        update_status_in_db(task_id=task_id, status="LOADING", message='Finishing')

        # check if functions column is already there
        if "_functions" not in columns:
            new_columns = columns + ["_functions"]
            new_df = pd.DataFrame(all_data, columns=new_columns)
        else:
            new_df = pd.DataFrame(all_data, columns=columns)

        csv_as_string = new_df.to_csv(index=False)
        file_name = "augmentation-" + str(uuid.uuid4()) + ".csv"
        upload_file(csv_as_string, file_name)
        update_db(file_name, dataset_id)
        update_status_in_db(task_id=task_id, status="SUCCESS", message='Completed')

        connection.close()

        return file_name
    except Exception as err:
        print("An error occurred")
        update_status_in_db(task_id=task_id, status="ERROR")
        connection.close()

        raise err


if __name__ == "__main__":
    process_message(
        # {"body": "55///////name,occupation\nmicah,software engineer\nbrady,ai engineer"}
        # {"body": "55///////1d337967-24af-4ad4-8c82-d6b81d1223c7.csv"}
        # {"body": "92", "messageAttributes": {"uid": "user_2TOon0K0TZUy8buNvs3ICvcQBdV"}}
        {"body": "92", "messageAttributes": {"uid": {"stringValue": "user_2TOon0K0TZUy8buNvs3ICvcQBdV", "stringListValues": [], "binaryListValues": [], "dataType": "String"}}}
        # {"body": "55///////augmentation-15cfa0f5-9863-439b-9e92-34930db87eec.csv"}
        # {"body": "55///////augmentation-ca74536d-fac0-42c5-b9db-3a9a0d8281b5.csv"}
    )
