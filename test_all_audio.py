#!/usr/bin/env python3
"""
Multi-Agent Customer Feedback Analysis System
Processes audio files and text through specialized ADK agents
"""

import sys
import os
import json
import re
from pathlib import Path
import csv

# Load environment variables
from dotenv import load_dotenv
load_dotenv('main_agent/.env')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Add noise_red to path for Whisper-based transcription
NOISE_RED_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'noise_red')
sys.path.insert(0, NOISE_RED_PATH)

# Import agents
from issue_extraction.agent import root_agent as issue_extraction_agent
from service_classification_agent.agent import service_classification_agent
from insight_and_report_agent.agent import insight_report_agent

# Lazy-load Whisper model (loaded once on first use)
_whisper_model = None

def _get_whisper_model():
    """Load Whisper model once and cache it."""
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model("medium")
    return _whisper_model


def transcribe_audio(audio_path):
    """Transcribe audio to text using Whisper (via noise_red)."""
    try:
        import whisper
        model = _get_whisper_model()
        result = model.transcribe(audio_path, language="en", fp16=False)
        
        # Combine all segment texts into one transcript
        segments = result.get("segments", [])
        transcript = " ".join(seg["text"].strip() for seg in segments)
        
        # Calculate duration from last segment end time
        duration = segments[-1]["end"] if segments else 0.0
        
        return {
            'success': True,
            'transcript': transcript,
            'duration': duration,
            'segments': segments,  # include detailed segments
            'error': None
        }
    except Exception as e:
        return {'success': False, 'transcript': '', 'error': str(e)}


def call_agent_sync(agent, input_text):
    """
    Call ADK agent synchronously - directly using the Bedrock LLM.
    """
    # Get the agent's instruction and use it as system prompt
    instruction = agent.instruction if hasattr(agent, 'instruction') else ""
    
    # Use the model directly with combined prompt
    if hasattr(agent, 'model') and hasattr(agent.model, 'generate'):
        # Direct call to Bedrock LLM
        full_prompt = f"{instruction}\n\nTRANSCRIPT:\n{input_text}"
        return agent.model.generate(full_prompt)
    
    # Fallback to ADK flow if model doesn't have generate method
    from google.adk.sessions import InMemorySessionService
    from google.adk.runners import InvocationContext
    from google.adk.plugins.plugin_manager import PluginManager
    from google.adk.agents.run_config import RunConfig
    from google.genai import types
    import asyncio
    
    # Create session
    session_service = InMemorySessionService()
    session = session_service.create_session_sync(
        app_name="feedback_analysis",
        user_id="analyst"
    )
    
    # Create invocation context
    context = InvocationContext(
        agent=agent,
        session=session,
        session_service=session_service,
        user_content=types.Content(parts=[types.Part(text=input_text)]),
        invocation_id=f"inv_{id(agent)}",
        plugin_manager=PluginManager(),
        run_config=RunConfig()
    )
    
    # Run agent asynchronously
    async def run():
        result = []
        async for event in agent.run_async(context):
            # Extract text from event.content.parts
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            result.append(part.text)
        return ''.join(result)
    
    return asyncio.run(run())


def extract_json(text):
    """Extract JSON from text response, handling markdown code blocks."""
    # Remove ```json and ``` markers if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*$', '', text)
    text = text.strip()
    
    try:
        return json.loads(text)
    except:
        # Try to find JSON object in text
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                json_str = match.group()
                # Clean up markdown if still present
                json_str = re.sub(r'```json\s*', '', json_str)
                json_str = re.sub(r'```', '', json_str)
                return json.loads(json_str.strip())
            except:
                pass
    return None


def analyze_feedback(transcript, verbose=False):
    """Run multi-agent analysis pipeline."""
    
    if verbose:
        print("\n" + "="*60)
        print("MULTI-AGENT ANALYSIS PIPELINE")
        print("="*60)
    
    # Step 1: Extract issues
    if verbose:
        print("\n[1/3] Issue Extraction Agent")
    
    try:
        issue_response = call_agent_sync(issue_extraction_agent, transcript)
        if verbose:
            print(f"[DEBUG] Raw response: {issue_response[:500]}")
        issues_data = extract_json(issue_response) or {'issues': []}
        if verbose:
            print(f"[DEBUG] Parsed data: {issues_data}")
        issues = issues_data.get('issues', [])
    except Exception as e:
        if verbose:
            print(f"⚠️  Error: {e}")
            import traceback
            traceback.print_exc()
        issues = []
    
    if verbose:
        print(f"✓ Found {len(issues)} issues")
        for i, issue in enumerate(issues[:3], 1):
            print(f"  {i}. {issue}")
    
    # Step 2: Classify issues
    if verbose:
        print(f"\n[2/3] Service Classification Agent")
    
    if not issues:
        classified_issues = []
    else:
        try:
            classification_input = json.dumps({'issues': issues})
            classification_response = call_agent_sync(service_classification_agent, classification_input)
            classification_data = extract_json(classification_response) or {'classified_issues': []}
            classified_issues = classification_data.get('classified_issues', [])
        except Exception as e:
            if verbose:
                print(f"⚠️  Error: {e}")
            classified_issues = []
    
    if verbose:
        print(f"✓ Classified {len(classified_issues)} issues")
    
    # Step 3: Generate insights
    if verbose:
        print(f"\n[3/3] Insight & Report Agent")
    
    if not classified_issues:
        insights_data = {
            'insights': 'No issues identified.',
            'recommended_actions': []
        }
    else:
        try:
            insight_input = json.dumps({'classified_issues': classified_issues})
            insight_response = call_agent_sync(insight_report_agent, insight_input)
            insights_data = extract_json(insight_response) or {
                'insights': '',
                'recommended_actions': []
            }
        except Exception as e:
            if verbose:
                print(f"⚠️  Error: {e}")
            insights_data = {'insights': '', 'recommended_actions': []}
    
    if verbose:
        print(f"✓ Generated {len(insights_data.get('recommended_actions', []))} actions")
        print("="*60)
    
    return {
        'issues': issues,
        'classified_issues': classified_issues,
        'insights': insights_data.get('insights', ''),
        'recommended_actions': insights_data.get('recommended_actions', [])
    }


def print_summary(result):
    """Print analysis summary."""
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    
    print(f"\n📋 Issues Identified: {len(result.get('issues', []))}")
    for i, issue in enumerate(result.get('issues', [])[:5], 1):
        print(f"  {i}. {issue}")
    
    categories = {}
    for item in result.get('classified_issues', []):
        cat = item.get('category', 'Other')
        categories[cat] = categories.get(cat, 0) + 1
    
    if categories:
        print(f"\n🏷️  Issue Categories:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {cat}: {count}")
    
    insights = result.get('insights', '')
    if insights:
        print(f"\n💡 Key Insights:")
        print(f"  {insights[:200]}")
    
    actions = result.get('recommended_actions', [])
    if actions:
        print(f"\n✅ Recommended Actions:")
        for i, action in enumerate(actions[:5], 1):
            print(f"  {i}. {action}")
    
    print("\n" + "="*60)


def test_audio_folder(audio_dir="Audios", output_dir="audio_analysis_results"):
    """Test all audio files in the folder."""
    
    print("\n🎯 TESTING AUDIO FILES")
    print("="*60)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Find audio files
    audio_files = sorted(Path(audio_dir).glob("*.wav"))
    print(f"✓ Found {len(audio_files)} audio files\n")
    
    # Load ground truth
    csv_file = os.path.join(audio_dir, "call_recordings.csv")
    ground_truth = {}
    try:
        with open(csv_file) as f:
            for row in csv.DictReader(f):
                ground_truth[row['id']] = row
        print(f"✓ Loaded ground truth for {len(ground_truth)} calls\n")
    except:
        print("⚠️  No ground truth CSV found\n")
    
    all_results = []
    success_count = 0
    
    for i, audio_path in enumerate(audio_files, 1):
        audio_id = audio_path.stem
        
        print(f"\n[{i}/{len(audio_files)}] Processing: {audio_id}")
        print("-"*60)
        
        # Transcribe
        trans_result = transcribe_audio(str(audio_path))
        if not trans_result['success']:
            print(f"❌ Transcription failed: {trans_result['error']}")
            continue
        
        transcript = trans_result['transcript']
        print(f"✓ Transcribed: {transcript[:80]}...")
        
        # Analyze
        result = analyze_feedback(transcript, verbose=False)
        result['audio_id'] = audio_id
        result['transcript'] = transcript
        result['duration'] = trans_result['duration']
        
        # Add ground truth
        if audio_id in ground_truth:
            gt = ground_truth[audio_id]
            result['ground_truth'] = {
                'type': gt.get('Type'),
                'sentiment': gt.get('Sentiment')
            }
            print(f"📊 Expected: {gt.get('Type')} | {gt.get('Sentiment')}")
        
        # Quick summary
        print(f"✓ Analysis: {len(result['issues'])} issues, {len(result['classified_issues'])} classified")
        
        # Save
        output_file = os.path.join(output_dir, f"{audio_id}_analysis.json")
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        all_results.append(result)
        success_count += 1
    
    # Summary report
    print("\n" + "="*60)
    print(f"SUMMARY: {success_count}/{len(audio_files)} files processed successfully")
    print("="*60)
    
    if all_results:
        total_issues = sum(len(r['issues']) for r in all_results)
        print(f"\nTotal Issues: {total_issues}")
        print(f"Average per Call: {total_issues/len(all_results):.1f}")
        
        # Category distribution
        all_cats = {}
        for r in all_results:
            for item in r['classified_issues']:
                cat = item['category']
                all_cats[cat] = all_cats.get(cat, 0) + 1
        
        print(f"\nTop Categories:")
        for cat, count in sorted(all_cats.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  • {cat}: {count}")
    
    print(f"\n💾 Results saved in: {output_dir}/")
    print("="*60 + "\n")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Multi-Agent Feedback Analysis')
    parser.add_argument('--text', help='Direct text input')
    parser.add_argument('--audio', help='Single audio file')
    parser.add_argument('--test-folder', action='store_true', help='Test all audio files')
    parser.add_argument('--output', default='analysis_result.json')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()
    
    if args.test_folder:
        test_audio_folder()
    elif args.text:
        print("\n🚀 Analyzing Text Feedback\n")
        result = analyze_feedback(args.text, args.verbose)
        print_summary(result)
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Saved: {args.output}\n")
    elif args.audio:
        print(f"\n🎵 Transcribing: {args.audio}")
        trans = transcribe_audio(args.audio)
        if not trans['success']:
            print(f"❌ Error: {trans['error']}")
            return
        print(f"✓ Transcript: {trans['transcript']}\n")
        result = analyze_feedback(trans['transcript'], args.verbose)
        result['transcript'] = trans['transcript']
        print_summary(result)
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Saved: {args.output}\n")
    else:
        print("Error: Provide --text, --audio, or --test-folder")
        parser.print_help()


if __name__ == "__main__":
    main()
