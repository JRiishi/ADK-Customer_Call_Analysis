# Multi-Agent Customer Feedback Analysis System

A sophisticated multi-agent AI system built with **Google ADK (Agent Development Kit)** for processing customer feedback and extracting actionable business insights.

## 🏗️ Architecture

This system uses a **specialized multi-agent architecture** where each agent has a single responsibility:

```
Customer Transcript
        ↓
┌──────────────────────────────┐
│  Issue Extraction Agent      │  → Extracts issues/complaints
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  Service Classification Agent│  → Categorizes & scores issues
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  Insight & Report Agent      │  → Generates business intelligence
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  Main Orchestrator Agent     │  → Aggregates final output
└──────────────────────────────┘
```

### Agent Responsibilities

#### 1. **Issue Extraction Agent**
- **Input**: Customer transcript text
- **Output**: List of issues/complaints only
- **Rule**: Does NOT perform sentiment analysis or classification
- **Format**: `{"issues": []}`

#### 2. **Service Classification Agent**
- **Input**: Issues list from Issue Extraction Agent
- **Output**: Categorized issues with severity scores
- **Categories**: Response Time, Product Quality, Customer Support, Technical Issues, Billing/Pricing, Delivery/Logistics, Other
- **Format**: `{"classified_issues": [{"issue": "", "category": "", "severity": 0.0}]}`

#### 3. **Insight & Report Agent**
- **Input**: Classified issues
- **Output**: Business insights and recommendations
- **Rule**: Identifies patterns, does NOT repeat raw issues
- **Format**: `{"insights": "", "recommended_actions": []}`

#### 4. **Main Orchestrator Agent**
- **Input**: Customer transcript
- **Role**: Coordinates all agents and aggregates outputs
- **Rule**: Manager role - does NOT analyze text itself
- **Format**: Complete aggregated JSON

## 🚀 Quick Start

### Prerequisites

```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

#### Analyze Text Feedback

```bash
python adk_pipeline.py --text "Your customer feedback here"
```

#### Analyze from File

```bash
python adk_pipeline.py --file feedback.txt
```

#### With Verbose Output

```bash
python adk_pipeline.py --text "Customer feedback" --verbose
```

#### Save to Custom Location

```bash
python adk_pipeline.py --text "Feedback" --output results.json
```

### Run Examples

```bash
python adk_examples.py
```

## 📊 Output Format

The system produces structured JSON output:

```json
{
  "issues": [
    "Long wait time for support",
    "Product arrived damaged",
    "Rude customer service representative"
  ],
  "classified_issues": [
    {
      "issue": "Long wait time for support",
      "category": "Response Time",
      "severity": 0.8
    },
    {
      "issue": "Product arrived damaged",
      "category": "Product Quality",
      "severity": 0.9
    },
    {
      "issue": "Rude customer service representative",
      "category": "Customer Support",
      "severity": 0.7
    }
  ],
  "insights": "Primary weakness: Product Quality (severity 0.9). Critical pattern detected in customer support behavior and response times.",
  "recommended_actions": [
    "Implement quality control checks before shipping",
    "Provide customer service training on professional communication",
    "Reduce response time targets to under 30 minutes"
  ]
}
```

## 🎯 Service Categories

The system classifies issues into predefined categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Response Time** | Wait times, delays | "Waited 2 hours", "Slow response" |
| **Product Quality** | Defects, damage | "Broken item", "Poor quality" |
| **Customer Support** | Staff behavior | "Rude agent", "Unhelpful" |
| **Technical Issues** | System errors | "Website crashed", "App bug" |
| **Billing/Pricing** | Payment problems | "Wrong charge", "Expensive" |
| **Delivery/Logistics** | Shipping issues | "Late delivery", "Lost package" |
| **Other** | Uncategorized | Miscellaneous issues |

## 📁 Project Structure

```
Project Cust-AI/
├── issue_extraction/
│   └── agent.py                    # Issue Extraction Agent
├── service_classification_agent/
│   └── agent.py                    # Service Classification Agent
├── insight_and_report_agent/
│   └── agent.py                    # Insight & Report Agent
├── main_agent/
│   └── agent.py                    # Main Orchestrator Agent
├── adk_pipeline.py                 # Main pipeline script
├── adk_examples.py                 # Example usage
├── requirements.txt                # Dependencies
└── README_ADK.md                   # This file
```

## 🔧 Configuration

### Agent Models

All agents use `gemini-2.5-flash` by default. To change models, edit the respective `agent.py` files:

```python
Agent(
    model='gemini-2.5-flash',  # Change to your preferred model
    ...
)
```

### API Keys

Ensure your Google API key is configured:

```bash
export GOOGLE_API_KEY='your-api-key-here'
# or
export GEMINI_API_KEY='your-api-key-here'
```

## 📝 Python API

### Programmatic Usage

```python
from adk_pipeline import analyze_feedback, print_summary

# Analyze feedback
transcript = "Customer was unhappy with slow service and broken product"
result = analyze_feedback(transcript, verbose=False)

# Print formatted summary
print_summary(result)

# Access results
issues = result['issues']
classified = result['classified_issues']
insights = result['insights']
actions = result['recommended_actions']
```

### Batch Processing

```python
feedbacks = [
    "Feedback 1...",
    "Feedback 2...",
    "Feedback 3..."
]

all_results = []
for feedback in feedbacks:
    result = analyze_feedback(feedback)
    all_results.append(result)

# Aggregate insights across all feedbacks
```

## 🎓 Examples

### Example 1: Negative Feedback

**Input:**
```
I'm extremely frustrated. Waited 2 hours, product was damaged, 
and customer support was rude. Unacceptable!
```

**Output:**
- **Issues**: 3 identified
- **Categories**: Response Time, Product Quality, Customer Support
- **Average Severity**: 0.8 (High)
- **Recommended Actions**: Improve response times, enhance QC, train support staff

### Example 2: Positive Feedback

**Input:**
```
Great service! Quick response, excellent quality, happy with purchase.
```

**Output:**
- **Issues**: 0 identified
- **Insights**: Customer appears satisfied
- **Recommended Actions**: None

## 🔍 Key Features

✅ **Modular Architecture** - Each agent has a single, well-defined responsibility  
✅ **Strict JSON Output** - All communication uses structured JSON  
✅ **No Overlap** - Agents don't duplicate each other's work  
✅ **Deterministic** - Consistent, reproducible results  
✅ **Scalable** - Easy to add new agents or categories  
✅ **Production-Ready** - Error handling and graceful degradation  

## 🛠️ Advanced Features

### Custom Categories

To add new service categories, update `service_classification_agent/agent.py`:

```python
instruction="""
...
Allowed Service Categories:
- Response Time
- Product Quality
- Your New Category  # Add here
...
"""
```

### Severity Scoring

Severity scores range from 0.0 to 1.0:
- **0.0-0.3**: Low severity
- **0.4-0.6**: Medium severity
- **0.7-1.0**: High severity

### Error Handling

The pipeline gracefully handles:
- Missing or empty issues
- Invalid JSON responses
- API failures
- Malformed input

## 📊 Use Cases

- **Customer Service Analytics** - Identify recurring problems
- **Product Feedback Analysis** - Track quality issues
- **Support Ticket Categorization** - Auto-classify support requests
- **Business Intelligence** - Generate actionable insights
- **Quality Assurance** - Monitor service performance

## 🧪 Testing

Run comprehensive examples:

```bash
python adk_examples.py
```

This will test:
- Negative feedback processing
- Positive feedback handling
- Mixed feedback analysis
- Batch processing capabilities

## 🔐 Requirements

- Python 3.8+
- Google ADK (anthropic-adk)
- Google Generative AI SDK
- Active Google API key

## 📄 License

MIT License

## 🤝 Contributing

This system is designed to be extensible. To contribute:

1. Add new specialized agents in separate directories
2. Update the orchestrator to include them
3. Maintain strict JSON communication
4. Ensure single responsibility per agent
5. Add comprehensive examples

---

**Built with Google ADK** | **Multi-Agent Architecture** | **Production-Ready**
