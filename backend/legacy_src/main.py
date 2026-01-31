from tensorflow import keras
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle

# Load the pre-trained sentiment model
model = keras.models.load_model('sentiment_model.keras')

# Load the pre-trained tokenizer
with open('tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)

# x = input("Input from the voice to text")
x = "Thank you so much, the issue was resolved very quickly."
y='“Wow, only three days to fix it, impressive.”'

# Convert text to sequence of integers
sequences = tokenizer.texts_to_sequences([y])

# Pad sequences to ensure uniform length (match your model's input shape)
max_length = 100  # Adjust this to match your model's expected input length
padded = pad_sequences(sequences, maxlen=max_length, padding='post', truncating='post')
# Make prediction
prediction = model.predict(padded)
print(f"Input: {y}")
if prediction>0.5:
    print("Positive")
else:
    print("Negative")
print(f"Prediction: {prediction}")

