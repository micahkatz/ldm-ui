import pandas as pd
import nltk
import random
from flask import Flask, request, send_file
from nltk.corpus import wordnet
from io import BytesIO, StringIO

app = Flask(__name__)


@app.route("/api/brady")
def hello_world2():
    return "Brady Steele"


################################

nltk.download("wordnet")


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


@app.route("/api/augmentation", methods=["POST"])
def augmentation():

    content_type = request.headers.get("Content-Type")
    if content_type == "application/json":
        json = request.json

        print("starting augmentation...", json)
        # df = pd.read_csv("api/input.csv")
        df = pd.read_csv(StringIO(json["csvData"]), sep=",")
        columns = df.columns.tolist()
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

        new_df = pd.DataFrame(all_data, columns=columns)
        csv_as_string = new_df.to_csv(index=False)
        # return send_file(
        #     csv_buffer,
        #     as_attachment=True,
        #     download_name='test.csv',
        #     mimetype='text/csv'
        # )
        return csv_as_string
        new_df.to_csv("api/output.csv", index=False)
        print("finished augmentation")

        return "Success. Finished at output.csv"
    else:
        return "Content-Type not supported!"
