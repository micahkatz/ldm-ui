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

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name())
    if word in synonyms:
        synonyms.remove(word)
    return list(synonyms)


def synonym_replacement(words, n=5):
    new_words = words.copy()
    random_word_list = list(set([word for word in words]))
    random.shuffle(random_word_list)
    num_replaced = 0
    for random_word in random_word_list:
        synonyms = get_synonyms(random_word)
        if len(synonyms) >= 1:
            synonym = random.choice(list(synonyms))
            new_words = [synonym if word == random_word else word for word in new_words]
            num_replaced += 1
        if num_replaced >= n:
            break
    sentence = " ".join(new_words)
    return sentence


def random_deletion(words, p=0.5):
    if len(words) == 1:
        return words
    remaining = list(filter(lambda x: random.uniform(0, 1) > p, words))
    if len(remaining) == 0:
        return [random.choice(words)]
    else:
        return remaining


def random_swap(sentence, n=5):
    length = range(len(sentence))
    for _ in range(n):
        idx1, idx2 = random.sample(length, 2)
        sentence[idx1], sentence[idx2] = sentence[idx2], sentence[idx1]
    return sentence

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

    # content_type = request.headers.get("Content-Type")
    # if content_type == "application/json":
    #     json = request.json
    #
    emit("augmentationResponse",{"status": "starting augmentation..."})


    print("starting augmentation...", json)
    # df = pd.read_csv("api/input.csv")
    df = pd.read_csv(StringIO(json["csvData"]), sep=",")
    columns = df.columns.tolist()
    emit("augmentationAppend",{"columns": columns})

    all_data = []
    for index, row in df.iterrows():
        data_row = row.tolist()

        for col_idx, value in enumerate(data_row):
            if len(str(value).split()) > 1:
                words = str(value).split(" ")
                for _ in range(20):
                    if random.choice([True, False]):
                        new_value = synonym_replacement(words)
                    elif random.choice([True, False]):
                        new_value = " ".join(random_deletion(words))
                    else:
                        new_value = " ".join(random_swap(words))
                    data_row_copy = data_row.copy()
                    data_row_copy[col_idx] = new_value
                    all_data.append(data_row_copy)
                    # time.sleep(1)
                    emit("augmentationAppend",{"row": data_row_copy})


    new_df = pd.DataFrame(all_data, columns=columns)
    csv_as_string = new_df.to_csv(index=False)
    file_name = "augmentation-" +str(uuid.uuid4()) + '.csv'
    # emit("augmentationResponse",{"csv_string": csv_as_string, "uri": file_name})
    upload_file(csv_as_string, file_name)

    # return csv_as_string
    # new_df.to_csv("api/output.csv", index=False)
    # print("finished augmentation")
