from flask import Flask
import pandas as pd
from augmentation import synonym_replacement, random_deletion, random_swap
app = Flask(__name__)

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/brady")
def hello_world2():
    return "Brady Steele"

@app.route("/api/augmentation")
def augmentation():
    print('starting augmentation...')
    df = pd.read_csv('api/input.csv')
    all_data = []

    for index, row in df.iterrows():
        chat = row['chat']
        sentiment = row['sentiment']
        
        all_data.append([chat, sentiment])
        
        words = chat.split(' ')
        
        for _ in range(12500):
            new_chat = synonym_replacement(words)
            all_data.append([new_chat, sentiment])
            
            new_chat = random_deletion(words)
            all_data.append([' '.join(new_chat), sentiment])
            
            new_chat = random_swap(words)
            all_data.append([' '.join(new_chat), sentiment])

    new_df = pd.DataFrame(all_data, columns=['chat', 'sentiment'])
    new_df.to_csv('api/output.csv', index=False)
    print('finished augmentation')

    return "Success. Finished at output.csv"