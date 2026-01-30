# 🚀 QUICK START GUIDE

## Multi-Agent Customer Feedback Analysis System

---

## ⚡ Fastest Way to Use

### 1. Activate Environment
```bash
source .venv/bin/activate
```

### 2. Run Analysis
```bash
python adk_pipeline.py --text "Your customer feedback here"
```

That's it! 🎉

---

## 📋 Common Commands

### Analyze Text Directly
```bash
python adk_pipeline.py --text "Product broke, support was rude"
```

### Analyze from File
```bash
python adk_pipeline.py --file customer_feedback.txt
```

### See Detailed Steps
```bash
python adk_pipeline.py --text "Feedback here" --verbose
```

### Save to Custom File
```bash
python adk_pipeline.py --text "Feedback" --output my_results.json
```

---

## 🧪 Test Examples

### Run Quick Test
```bash
python quick_test.py
```

### Run All Examples
```bash
python adk_examples.py
```

---

## 💻 Python Code

```python
from adk_pipeline import analyze_feedback, print_summary

# Analyze
result = analyze_feedback("Customer was unhappy with service")

# Print summary
print_summary(result)

# Access data
print(result['issues'])
print(result['classified_issues'])
print(result['insights'])
print(result['recommended_actions'])
```

---

## 📊 What You Get

```json
{
  "issues": ["List of problems identified"],
  "classified_issues": [
    {
      "issue": "Problem description",
      "category": "Product Quality/Customer Support/etc",
      "severity": 0.8
    }
  ],
  "insights": "Business intelligence summary",
  "recommended_actions": ["Action 1", "Action 2"]
}
```

---

## 🎯 Real Examples

### Example 1: Bad Experience
**Input:**
```
Product arrived broken and customer service was terrible
```

**Output:**
- 2 issues identified
- Categories: Product Quality (0.9), Customer Support (0.8)
- Actions: Improve QC, train support staff

### Example 2: Good Experience
**Input:**
```
Great product, fast shipping, very satisfied!
```

**Output:**
- 0 issues identified
- Insights: Customer satisfied

---

## 🔑 Setup (One-Time)

### Set API Key
```bash
export GOOGLE_API_KEY='your-key-here'
```

Or add to `~/.zshrc`:
```bash
echo 'export GOOGLE_API_KEY="your-key"' >> ~/.zshrc
source ~/.zshrc
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `adk_pipeline.py` | Main execution script ⭐ |
| `quick_test.py` | Quick test |
| `adk_examples.py` | Comprehensive examples |
| `IMPLEMENTATION_SUMMARY.md` | Full documentation |
| `README_ADK.md` | Detailed guide |

---

## 🆘 Help

```bash
python adk_pipeline.py --help
```

---

## ✅ System Check

Verify everything is installed:
```bash
python -c "from adk_pipeline import analyze_feedback; print('✅ System Ready!')"
```

---

**That's all you need to know!** 🎉

For more details, see `IMPLEMENTATION_SUMMARY.md`
