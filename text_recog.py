import pandas as pd
import nltk
nltk.download('vader_lexicon')
import speech_recognition as sr
from pydub import AudioSegment
import spacy
recognizer = sr.Recognizer()
transcribe_audio_file = sr.AudioFile("/Users/riishabhjain/Desktop/Project Cust-AI/call_recording_02.wav")
with transcribe_audio_file as source:
    transcribe_audio = recognizer.record(source)
transcribed_text = recognizer.recognize_google(transcribe_audio)

# Review trascribed text
print("Transcribed text: ", transcribed_text)

# Task 1 - Speech to Text: store few statistics of the audio file such as number of channels, sample width and frame rate
    
# Review number of channels and frame rate of the audio file
audio_segment = AudioSegment.from_file("/Users/riishabhjain/Desktop/Project Cust-AI/call_recording_02.wav")
number_channels = audio_segment.channels
frame_rate = audio_segment.frame_rate

print("Number of channels: ", number_channels)
print("Frame rate: ", frame_rate)
