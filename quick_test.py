#!/usr/bin/env python3
"""Quick test of ADK multi-agent system"""

from adk_pipeline import analyze_feedback, print_summary

# Test case
transcript = "The product broke after one day and customer support was extremely rude and unhelpful."

print("🧪 Testing Multi-Agent System\n")
print(f"Input: {transcript}\n")

result = analyze_feedback(transcript, verbose=True)
print_summary(result)

print("\n✅ Test Complete!")
