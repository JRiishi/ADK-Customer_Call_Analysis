# Customer Feedback Analysis System

A sophisticated multi-agent AI system for processing customer audio feedback and extracting actionable service insights.

## 🏗️ Architecture

This system uses a **multi-agent architecture** with specialized agents:

1. **Speech-to-Text Agent** - Converts audio to text using Google Speech Recognition
2. **Sentiment Agent** - Classifies sentiment using a pre-trained neural network
3. **Issue Extraction Agent** - Identifies complaints using LLM analysis
4. **Service Classification Agent** - Categorizes issues into service domains
5. **Insight Agent** - Generates business intelligence and recommendations
6. **Orchestrator Agent** - Coordinates the complete workflow

## 🚀 Quick Start

### Installation

```bash
# Activate virtual environment
source .venv/bin/activate

# Install required packages
pip install tensorflow keras google-adk speech-recognition pydub
```

### Usage

#### Process Audio Feedback
```bash
python run_analysis.py --audio path/to/audio.wav
```

#### Process Text Feedback
```bash
python run_analysis.py --text "Your customer feedback text here"
```

#### With Verbose Output
```bash
python run_analysis.py --audio audio.wav --output results.json --verbose
```

## 📊 Output Format

The system produces structured JSON output:

```json
{
  "status": "success",
  "timestamp": "2026-01-30T...",
  "transcript": "...",
  "sentiment": "Satisfied/Neutral/Dissatisfied",
  "confidence_score": 0.85,
  "dissatisfaction_reasons": [...],
  "key_complaints": [...],
  "service_categories_ranked": [
    {
      "category": "Response Time",
      "severity": 8,
      "issues": [...]
    }
  ],
  "primary_category": "Response Time",
  "overall_severity": 8,
  "insights": [...],
  "recommended_actions": [...],
  "priority": "High/Medium/Low",
  "business_impact": "..."
}
```

## 🎯 Service Categories

- **Response Time** - Wait times, delays
- **Product Quality** - Defects, quality issues
- **Customer Support Behavior** - Staff interactions
- **Technical Problems** - System errors, bugs
- **Billing/Pricing** - Payment issues
- **Delivery/Logistics** - Shipping problems

## 📁 Project Structure

```
Project Cust-AI/
├── agents/
│   ├── speech_to_text_agent.py
│   ├── sentiment_agent.py
│   ├── issue_extraction_agent.py
│   ├── service_classification_agent.py
│   ├── insight_agent.py
│   └── orchestrator.py
├── run_analysis.py          # Main entry point
├── sentiment_model.keras    # Pre-trained model
├── tokenizer.pkl           # Tokenizer for sentiment model
└── README.md
```

## 🔧 Configuration

The system uses:
- **Gemini 2.0 Flash** for LLM-based analysis
- **TensorFlow/Keras** for sentiment classification
- **Google Speech Recognition** for audio transcription

## 📝 Examples

### Example 1: Analyze Call Recording
```bash
python run_analysis.py --audio call_recording_02.wav --verbose
```

### Example 2: Quick Text Analysis
```python
from agents.orchestrator import OrchestratorAgent

orchestrator = OrchestratorAgent()
result = orchestrator.process_text_feedback(
    "The service was terrible. I waited 2 hours and staff was rude."
)
orchestrator.print_summary(result)
```

## 🛠️ Advanced Features

- **Fault Tolerance** - Each agent handles errors gracefully
- **Scalability** - Modular design allows easy extension
- **Logging** - Comprehensive processing logs
- **History Tracking** - Maintains sentiment distribution over time
- **Multi-format Audio** - Supports various audio formats via pydub

## 📈 Business Intelligence

The system provides:
- Sentiment trends analysis
- Recurring problem detection
- Service area performance ranking
- Prioritized action recommendations
- Business impact assessment

## 🔐 Requirements

- Python 3.8+
- TensorFlow 2.x
- Google ADK
- SpeechRecognition
- Pydub
- Pre-trained sentiment model

## 🤝 Contributing

To add new service categories or improve classification:
1. Update category keywords in `service_classification_agent.py`
2. Enhance LLM prompts for better extraction
3. Retrain sentiment model with more data

## 📄 License

MIT License - See LICENSE file for details
