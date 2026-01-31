#!/usr/bin/env python3
"""
Production Readiness Diagnostic
Comprehensive check of all system components before deployment.
"""

import os
import sys
import json
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("\n" + "="*70)
print("🏭 PRODUCTION READINESS DIAGNOSTIC")
print("="*70)
print(f"Timestamp: {datetime.now().isoformat()}")
print(f"Python: {sys.version.split()[0]}")
print("="*70)

results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

# =============================================================================
# 1. ENVIRONMENT CONFIGURATION
# =============================================================================
print("\n📋 1. ENVIRONMENT CONFIGURATION")
print("-"*50)

# Check .env file exists
env_path = "main_agent/.env"
if os.path.exists(env_path):
    print(f"  ✅ .env file exists: {env_path}")
    results["passed"].append("ENV file exists")
    
    # Load and check required keys
    from dotenv import load_dotenv
    load_dotenv(env_path)
    
    required_keys = ["AWS_BEARER_TOKEN_BEDROCK", "AWS_DEFAULT_REGION"]
    for key in required_keys:
        value = os.getenv(key)
        if value and not value.startswith("YOUR_"):
            print(f"  ✅ {key}: Set ({len(value)} chars)")
            results["passed"].append(f"{key} configured")
        else:
            print(f"  ❌ {key}: NOT SET or placeholder")
            results["failed"].append(f"{key} not configured")
else:
    print(f"  ❌ .env file missing: {env_path}")
    results["failed"].append("ENV file missing")

# =============================================================================
# 2. PYTHON DEPENDENCIES
# =============================================================================
print("\n📦 2. PYTHON DEPENDENCIES")
print("-"*50)

required_packages = [
    ("boto3", "AWS SDK"),
    ("requests", "HTTP client"),
    ("whisper", "Audio transcription"),
    ("google.adk", "Google ADK framework"),
    ("dotenv", "Environment loading"),
    ("tensorflow", "ML framework"),
]

for package, desc in required_packages:
    try:
        __import__(package.replace("-", "_").split(".")[0])
        print(f"  ✅ {package}: Installed ({desc})")
        results["passed"].append(f"{package} installed")
    except ImportError as e:
        print(f"  ❌ {package}: Missing ({desc})")
        results["failed"].append(f"{package} missing")

# =============================================================================
# 3. BEDROCK LLM ADAPTER
# =============================================================================
print("\n🔌 3. BEDROCK LLM ADAPTER")
print("-"*50)

try:
    from llm_adapters.bedrock_llm import BedrockClaudeLLM
    
    llm = BedrockClaudeLLM()
    print(f"  ✅ BedrockClaudeLLM loaded")
    print(f"     Model: {llm.model}")
    print(f"     Region: {llm.region}")
    print(f"     Bearer token: {'Set' if llm._bearer_token else 'Not set'}")
    print(f"     API endpoint: {llm._api_endpoint}")
    results["passed"].append("Bedrock adapter loaded")
    
    # Test actual API call
    print("\n  Testing Bedrock API connection...")
    response = llm.generate("Say 'OK' in one word")
    if "Error" not in response:
        print(f"  ✅ Bedrock API working (response: {response.strip()[:50]})")
        results["passed"].append("Bedrock API connection")
    else:
        print(f"  ❌ Bedrock API error: {response[:100]}")
        results["failed"].append("Bedrock API connection failed")
        
except Exception as e:
    print(f"  ❌ Failed to load Bedrock adapter: {e}")
    results["failed"].append("Bedrock adapter failed")

# =============================================================================
# 4. ALL AGENTS
# =============================================================================
print("\n🤖 4. AGENT IMPORTS")
print("-"*50)

agents_to_check = [
    ("issue_extraction.agent", "root_agent", "Issue Extraction"),
    ("service_classification_agent.agent", "service_classification_agent", "Service Classification"),
    ("knowledge_retrival.agent", "knowledge_retrieval_agent", "Knowledge Retrieval"),
    ("validation_agent.agent", "severity_validation_agent", "Severity Validation"),
    ("sentiment.sentiment_agent", "sentiment_analysis_agent", "Sentiment Analysis"),
    ("insight_and_report_agent.agent", "insight_report_agent", "Insight & Report"),
    ("main_agent.agent", "main_agent", "Main Orchestrator"),
]

for module_name, agent_name, display_name in agents_to_check:
    try:
        module = __import__(module_name, fromlist=[agent_name])
        agent = getattr(module, agent_name)
        print(f"  ✅ {display_name}: Loaded")
        print(f"     Name: {agent.name}")
        print(f"     Model: {type(agent.model).__name__}")
        results["passed"].append(f"{display_name} agent loaded")
    except Exception as e:
        print(f"  ❌ {display_name}: Failed - {e}")
        results["failed"].append(f"{display_name} agent failed")

# =============================================================================
# 5. WHISPER TRANSCRIPTION
# =============================================================================
print("\n🎙️ 5. WHISPER TRANSCRIPTION")
print("-"*50)

try:
    import whisper
    print("  ✅ Whisper module imported")
    
    # Check if model can be loaded (don't actually load to save time)
    model_path = os.path.expanduser("~/.cache/whisper")
    if os.path.exists(model_path):
        print(f"  ✅ Whisper cache exists: {model_path}")
        results["passed"].append("Whisper ready")
    else:
        print(f"  ⚠️  Whisper cache not found (will download on first use)")
        results["warnings"].append("Whisper model not cached")
        
except Exception as e:
    print(f"  ❌ Whisper error: {e}")
    results["failed"].append("Whisper not available")

# =============================================================================
# 6. SUPPORTING MODULES
# =============================================================================
print("\n🔧 6. SUPPORTING MODULES")
print("-"*50)

modules_to_check = [
    ("output_validation_agent", "OutputValidator", "Output Validator"),
    ("priority_scoring", "calculate_priority", "Priority Scoring"),
]

for module_name, item_name, display_name in modules_to_check:
    try:
        module = __import__(module_name, fromlist=[item_name])
        item = getattr(module, item_name)
        print(f"  ✅ {display_name}: Loaded")
        results["passed"].append(f"{display_name} loaded")
    except Exception as e:
        print(f"  ❌ {display_name}: Failed - {e}")
        results["failed"].append(f"{display_name} failed")

# Test priority scoring
try:
    from priority_scoring import calculate_priority
    result = calculate_priority(
        final_severity=4,
        severity_confidence=0.9,
        sentiment_score=-0.8,
        sentiment_confidence=0.85,
    )
    if result.get("priority_level"):
        print(f"  ✅ Priority Scoring test: {result['priority_level']}")
        results["passed"].append("Priority scoring functional")
    else:
        print(f"  ❌ Priority Scoring returned invalid result")
        results["failed"].append("Priority scoring invalid")
except Exception as e:
    print(f"  ❌ Priority Scoring test failed: {e}")
    results["failed"].append("Priority scoring test failed")

# =============================================================================
# 7. FILE STRUCTURE
# =============================================================================
print("\n📁 7. FILE STRUCTURE")
print("-"*50)

required_files = [
    "main_agent/.env",
    "llm_adapters/bedrock_llm.py",
    "issue_extraction/agent.py",
    "service_classification_agent/agent.py",
    "knowledge_retrival/agent.py",
    "validation_agent/agent.py",
    "sentiment/sentiment_agent.py",
    "insight_and_report_agent/agent.py",
    "main_agent/agent.py",
    "output_validation_agent.py",
    "priority_scoring.py",
    "test_all_audio.py",
    "requirements.txt",
]

for file_path in required_files:
    if os.path.exists(file_path):
        print(f"  ✅ {file_path}")
    else:
        print(f"  ❌ {file_path} - MISSING")
        results["failed"].append(f"Missing file: {file_path}")

# =============================================================================
# 8. AUDIO FOLDER
# =============================================================================
print("\n🎵 8. AUDIO FILES")
print("-"*50)

audio_dir = "Audios"
if os.path.exists(audio_dir):
    audio_files = [f for f in os.listdir(audio_dir) if f.endswith(('.wav', '.mp3'))]
    print(f"  ✅ Audio folder exists: {len(audio_files)} audio files")
    results["passed"].append("Audio folder ready")
else:
    print(f"  ⚠️  Audio folder not found: {audio_dir}")
    results["warnings"].append("Audio folder missing")

# =============================================================================
# 9. END-TO-END TEST
# =============================================================================
print("\n🧪 9. END-TO-END PIPELINE TEST")
print("-"*50)

try:
    from issue_extraction.agent import root_agent as issue_extraction_agent
    from service_classification_agent.agent import service_classification_agent
    from insight_and_report_agent.agent import insight_report_agent
    
    test_transcript = "Customer complained about slow service and incorrect billing. Very frustrated."
    
    # Test Issue Extraction
    print("  Testing Issue Extraction...")
    instruction = issue_extraction_agent.instruction
    full_prompt = f"{instruction}\n\nTRANSCRIPT:\n{test_transcript}"
    issue_response = issue_extraction_agent.model.generate(full_prompt)
    
    if "issues" in issue_response.lower() and "Error" not in issue_response:
        print(f"  ✅ Issue Extraction: Working")
        results["passed"].append("E2E: Issue Extraction")
    else:
        print(f"  ❌ Issue Extraction: Failed")
        results["failed"].append("E2E: Issue Extraction failed")
    
    # Test Classification
    print("  Testing Service Classification...")
    instruction = service_classification_agent.instruction
    test_issues = '{"issues": [{"issue_id": "issue_1", "issue_text": "slow service", "evidence_span": "slow service", "confidence": 0.9}]}'
    full_prompt = f"{instruction}\n\nINPUT:\n{test_issues}"
    class_response = service_classification_agent.model.generate(full_prompt)
    
    if "classified_issues" in class_response.lower() and "Error" not in class_response:
        print(f"  ✅ Service Classification: Working")
        results["passed"].append("E2E: Service Classification")
    else:
        print(f"  ❌ Service Classification: Failed")
        results["failed"].append("E2E: Service Classification failed")
        
    # Test Insight Generation
    print("  Testing Insight Generation...")
    instruction = insight_report_agent.instruction
    test_classified = '{"classified_issues": [{"issue_id": "issue_1", "category": "Customer Support", "final_severity": 4}]}'
    full_prompt = f"{instruction}\n\nINPUT:\n{test_classified}"
    insight_response = insight_report_agent.model.generate(full_prompt)
    
    if ("insights" in insight_response.lower() or "recommended" in insight_response.lower()) and "Error" not in insight_response:
        print(f"  ✅ Insight Generation: Working")
        results["passed"].append("E2E: Insight Generation")
    else:
        print(f"  ❌ Insight Generation: Failed")
        results["failed"].append("E2E: Insight Generation failed")

except Exception as e:
    print(f"  ❌ E2E test error: {e}")
    import traceback
    traceback.print_exc()
    results["failed"].append(f"E2E test error: {str(e)}")

# =============================================================================
# SUMMARY
# =============================================================================
print("\n" + "="*70)
print("📊 DIAGNOSTIC SUMMARY")
print("="*70)

print(f"\n✅ PASSED: {len(results['passed'])}")
for item in results['passed']:
    print(f"   • {item}")

if results['warnings']:
    print(f"\n⚠️  WARNINGS: {len(results['warnings'])}")
    for item in results['warnings']:
        print(f"   • {item}")

if results['failed']:
    print(f"\n❌ FAILED: {len(results['failed'])}")
    for item in results['failed']:
        print(f"   • {item}")

# Final verdict
print("\n" + "="*70)
if not results['failed']:
    print("🎉 PRODUCTION READY: All checks passed!")
    exit_code = 0
elif len(results['failed']) <= 2:
    print("⚠️  MOSTLY READY: Minor issues to address")
    exit_code = 1
else:
    print("❌ NOT READY: Critical issues found")
    exit_code = 2

print("="*70 + "\n")
sys.exit(exit_code)
