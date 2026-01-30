"""
Example usage and testing script for the Customer Feedback Analysis System.
"""
from agents.orchestrator import OrchestratorAgent
import json


def example_text_analysis():
    """Example: Analyze text feedback."""
    
    print("\n" + "="*70)
    print("EXAMPLE 1: Text Feedback Analysis")
    print("="*70)
    
    orchestrator = OrchestratorAgent()
    
    # Example negative feedback
    text = """
    I'm extremely disappointed with the service. I waited over 2 hours 
    for support and when someone finally answered, they were incredibly rude. 
    The product I received was damaged and the refund process is taking forever.
    This is absolutely unacceptable!
    """
    
    result = orchestrator.process_text_feedback(text)
    orchestrator.print_summary(result)
    
    return result


def example_positive_feedback():
    """Example: Analyze positive feedback."""
    
    print("\n" + "="*70)
    print("EXAMPLE 2: Positive Feedback Analysis")
    print("="*70)
    
    orchestrator = OrchestratorAgent()
    
    text = """
    Thank you so much! The customer service was outstanding. The representative
    was patient, knowledgeable, and resolved my issue within minutes. 
    The product quality is excellent and shipping was faster than expected.
    I'm very satisfied with my experience!
    """
    
    result = orchestrator.process_text_feedback(text)
    orchestrator.print_summary(result)
    
    return result


def example_batch_analysis():
    """Example: Analyze multiple feedbacks and get aggregated insights."""
    
    print("\n" + "="*70)
    print("EXAMPLE 3: Batch Analysis with Sentiment Distribution")
    print("="*70)
    
    orchestrator = OrchestratorAgent()
    
    feedbacks = [
        "Great service, very happy!",
        "Terrible experience, very slow response time.",
        "Product quality is poor, received damaged item.",
        "Excellent support team, resolved my issue quickly.",
        "Waited 3 hours for support, unacceptable.",
    ]
    
    results = []
    for i, feedback in enumerate(feedbacks, 1):
        print(f"\nProcessing feedback {i}/{len(feedbacks)}...")
        result = orchestrator.process_text_feedback(feedback)
        results.append(result)
    
    # Get sentiment distribution
    print("\n" + "="*70)
    print("AGGREGATED RESULTS")
    print("="*70)
    
    sentiment_counts = {
        'Satisfied': 0,
        'Neutral': 0,
        'Dissatisfied': 0
    }
    
    for result in results:
        sentiment = result.get('sentiment')
        if sentiment in sentiment_counts:
            sentiment_counts[sentiment] += 1
    
    print(f"\nSentiment Distribution:")
    print(f"  ✓ Satisfied: {sentiment_counts['Satisfied']}")
    print(f"  ~ Neutral: {sentiment_counts['Neutral']}")
    print(f"  ✗ Dissatisfied: {sentiment_counts['Dissatisfied']}")
    
    # Collect all issues
    all_issues = []
    for result in results:
        all_issues.extend(result.get('dissatisfaction_reasons', []))
    
    if all_issues:
        print(f"\nTop Recurring Issues:")
        for issue in list(set(all_issues))[:5]:
            print(f"  • {issue}")
    
    return results


def example_json_export():
    """Example: Export results to JSON file."""
    
    print("\n" + "="*70)
    print("EXAMPLE 4: JSON Export")
    print("="*70)
    
    orchestrator = OrchestratorAgent()
    
    text = "Service was okay, nothing special. Delivery took longer than expected."
    
    result = orchestrator.process_text_feedback(text)
    
    # Export to JSON
    output_file = "example_output.json"
    orchestrator.export_results_json(result, output_file)
    
    print(f"\n✓ Results exported to: {output_file}")
    
    # Read and display
    with open(output_file, 'r') as f:
        data = json.load(f)
    
    print(f"\nJSON Structure:")
    print(f"  - Status: {data['status']}")
    print(f"  - Sentiment: {data['sentiment']}")
    print(f"  - Priority: {data['priority']}")
    print(f"  - Recommended Actions: {len(data['recommended_actions'])}")
    
    return result


def main():
    """Run all examples."""
    
    print("\n🎯 Customer Feedback Analysis System - Examples\n")
    
    # Run examples
    example_text_analysis()
    example_positive_feedback()
    example_batch_analysis()
    example_json_export()
    
    print("\n" + "="*70)
    print("✓ All examples completed successfully!")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
