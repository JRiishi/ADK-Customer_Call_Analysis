import whisper
import json

model = whisper.load_model("medium")

result = model.transcribe(
    "call_audio.wav",
    language="en",
    fp16=False
)

segments = result["segments"]

# Save structured output
with open("transcript.json", "w", encoding="utf-8") as f:
    json.dump(segments, f, indent=2)

# Example usage
for seg in segments:
    print(
        f"[{seg['start']:.2f}s → {seg['end']:.2f}s] {seg['text']}"
    )
