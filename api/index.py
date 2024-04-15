import time
import pandas as pd
import nltk
import random
from flask import Flask, request, send_file
from nltk.corpus import wordnet
from io import BytesIO, StringIO
import os
import logging
from flask_socketio import SocketIO,emit
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import uuid
import re

load_dotenv()
app = Flask(__name__)


# socketio = SocketIO(app, path='/api', resource='/api')
socketio = SocketIO(app)

@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print(request.sid)
    print("client has connected")
    # emit("connect",{"data":f"id: {request.sid} is connected"})
    emit("augmentationResponse",{"status":f"id: {request.sid} is connected"})



@app.route("/api/brady")
def hello_world2():
    return "Brady Steele"


################################

os.environ["NLTK_DATA"]="/tmp/nltk_data"


nltk.download("wordnet",  download_dir='/tmp/nltk_data')

synonyms_cache = {}
antonyms_cache = {}
hypernyms_cache = {}
hyponyms_cache = {}

def remove_html_tags(text):
    clean_text = re.sub(r'<.*?>', '', text)
    return clean_text

def get_synonyms(word):
    if word not in synonyms_cache:
        synonyms = set()
        for syn in wordnet.synsets(word):
            for lemma in syn.lemmas():
                synonym = lemma.name()
                if '_' not in synonym:
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
                    if '_' not in antonym:
                        antonyms.add(antonym)
        antonyms_cache[word] = list(antonyms)
    return antonyms_cache[word]

def get_hypernyms(word):
    if word not in hypernyms_cache:
        hypernyms = set()
        for syn in wordnet.synsets(word):
            for hypernym in syn.hypernyms():
                hypernym_name = hypernym.lemmas()[0].name()
                if '_' not in hypernym_name:
                    hypernyms.add(hypernym_name)
        hypernyms_cache[word] = list(hypernyms)
    return hypernyms_cache[word]

def get_hyponyms(word):
    if word not in hyponyms_cache:
        hyponyms = set()
        for syn in wordnet.synsets(word):
            for hyponym in syn.hyponyms():
                hyponym_name = hyponym.lemmas()[0].name()
                if '_' not in hyponym_name:
                    hyponyms.add(hyponym_name)
        hyponyms_cache[word] = list(hyponyms)
    return hyponyms_cache[word]

def synonym_replacement_batch(words, n=10):
    new_words = words.copy()
    random_indices = random.sample(range(len(words)), min(n, len(words)))
    for idx in random_indices:
        random_word = words[idx]
        synonyms = get_synonyms(random_word)
        eligible_synonyms = [syn for syn in synonyms if '_' not in syn]
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
        eligible_antonyms = [ant for ant in antonyms if '_' not in ant]
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
        eligible_hypernyms = [hyper for hyper in hypernyms if '_' not in hyper]
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
        eligible_hyponyms = [hypo for hypo in hyponyms if '_' not in hypo]
        if eligible_hyponyms:
            hyponym = random.choice(eligible_hyponyms)
            new_words[idx] = hyponym

    return new_words

def random_deletion(words, p=0.1):
    if len(words) == 1:
        return words
    remaining = list(filter(lambda x: random.uniform(0,1) > p, words))
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

# @app.route("/api/augmentation", methods=["POST"])
# def augmentationHandler(data):
#     print("augmentationHandler", data)
#


# def upload_file(file_name, bucket, object_name=None):
#     """Upload a file to an S3 bucket

#     :param file_name: File to upload
#     :param bucket: Bucket to upload to
#     :param object_name: S3 object name. If not specified then file_name is used
#     :return: True if file was uploaded, else False
#     """

#     # If S3 object_name was not specified, use file_name
#     if object_name is None:
#         object_name = os.path.basename(file_name)

#     # Upload the file
#     s3_client = boto3.client('s3')
#     try:
#         response = s3_client.upload_file(file_name, bucket, object_name)
#     except ClientError as e:
#         logging.error(e)
#         return False
#     return True
#
def upload_file(data, file_name):
    s3 = boto3.resource('s3')
    object = s3.Object('ldm-csv-bucket', file_name)
    object.put(Body=data)


@socketio.on("augmentation")
def augmentation(json):

    try:
        # content_type = request.headers.get("Content-Type")
        # if content_type == "application/json":
        #     json = request.json
        #
        emit("augmentationResponse",{"status": "starting augmentation..."})


        print("starting augmentation...", json)
        # df = pd.read_csv("api/input.csv")
        df = pd.read_csv(StringIO(json["csvData"]), sep=",")
        columns = df.columns.tolist()
        print('sending columns', columns)
        emit("augmentationAppend",{"columns": columns})

        all_data = []

        # Loop through rows
        for index, row in df.iterrows():
            data_row = row.tolist()
            print('df.iterrows..', data_row)
            updated_data_row = data_row

            # Loop through columns
            for col_idx, value in enumerate(data_row):
                cleaned_value = remove_html_tags(str(value))
                print('cleaned_value', cleaned_value)
                print('split', cleaned_value.split())
                if len(cleaned_value.split()) > 1:
                    words = cleaned_value.split(' ')
                    for _ in range(12):
                        augmentation_methods = random.choices([
                            ('synonym', synonym_replacement_batch),
                            ('antonym', antonym_replacement_batch),
                            ('hypernym', hypernym_replacement_batch),
                            ('hyponym', hyponym_replacement_batch),
                            ('deletion', random_deletion),
                            ('swap', random_swap)], k=random.randint(1, 3))

                        new_value = words
                        functions = []

                        for method_name, method in augmentation_methods:
                            new_value = method(new_value)
                            functions.append(method_name)

                        data_row_copy = data_row.copy()
                        data_row_copy[col_idx] = ' '.join(new_value)
                        data_row_copy.append('; '.join(functions))
                        all_data.append(data_row_copy)
                        print('data_row', data_row_copy)
                        updated_data_row = data_row_copy
                        # time.sleep(1)
                        emit("augmentationAppend",{"row": data_row_copy})


            # emit("augmentationAppend",{"row": updated_data_row})
        new_columns = columns + ['functions']
        new_df = pd.DataFrame(all_data, columns=new_columns)
        csv_as_string = new_df.to_csv(index=False)
        file_name = "augmentation-" +str(uuid.uuid4()) + '.csv'
        emit("augmentationResponse",{"uri": file_name})
        upload_file(csv_as_string, file_name)

        # return csv_as_string
        # new_df.to_csv("api/output.csv", index=False)
        # print("finished augmentation")
    except Exception as e:
        print("ERROR", e)
        emit("augmentationResponse",{"error": e})
