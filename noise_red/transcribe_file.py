import sys
import json
import whisper


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 transcribe_file.py <audio-path>")
        sys.exit(1)

    audio_path = sys.argv[1]

    print(f"Loading model 'medium' and transcribing: {audio_path}")
    model = whisper.load_model("medium")

    result = model.transcribe(audio_path, language="en", fp16=False)

    segments = result.get("segments", [])

    out_path = "transcript.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, indent=2)

    for seg in segments:
        print(f"[{seg['start']:.2f}s → {seg['end']:.2f}s] {seg['text']}")

    print(f"Saved structured transcript to {out_path}")


if __name__ == '__main__':
    main()
