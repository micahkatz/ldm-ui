import pandas as pd
import nltk
import random
from flask import Flask, request
from nltk.corpus import wordnet
from io import StringIO

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
    new_sentence = "".join(sentence)
    return new_sentence


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


@app.route("/api/augmentation", methods=['POST'])
def augmentation():

    content_type = request.headers.get('Content-Type')
    if (content_type == 'application/json'):
        json = request.json
    
        print("starting augmentation...", json)
        # df = pd.read_csv("api/input.csv")
        df = pd.read_csv(StringIO(json['csvData']),sep=",")
        all_data = []

        for index, row in df.iterrows():
            chat = row["chat"]
            sentiment = row["sentiment"]

            all_data.append([chat, sentiment])

            words = chat.split(" ")

            for _ in range(12500):
                new_chat = synonym_replacement(words)
                all_data.append([new_chat, sentiment])

                new_chat = random_deletion(words)
                all_data.append([" ".join(new_chat), sentiment])

                new_chat = random_swap(words)
                all_data.append([" ".join(new_chat), sentiment])

        new_df = pd.DataFrame(all_data, columns=["chat", "sentiment"])
        new_df.to_csv("api/output.csv", index=False)
        print("finished augmentation")

        return "Success. Finished at output.csv"
    else:
        return 'Content-Type not supported!'
