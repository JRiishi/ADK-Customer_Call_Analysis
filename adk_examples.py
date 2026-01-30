"""
Example usage of the Multi-Agent Customer Feedback Analysis System
"""

from adk_pipeline import analyze_feedback, print_summary
import json


def example_negative_feedback():
    """Example 1: Negative customer feedback"""
    
    print("\n" + "="*70)
    print("EXAMPLE 1: Negative Customer Feedback")
    print("="*70)
    
    transcript = """
    I'm extremely frustrated with this service. I've been waiting for over 2 hours 
    and nobody has responded to my request. The product I received was damaged and 
    broken. When I tried to call customer support, the representative was very rude 
    and unhelpful. The refund process is taking forever and I still haven't received 
    my money back. This is completely unacceptable!
    """
    
    result = analyze_feedback(transcript, verbose=True)
    print_summary(result)
    
    return result


def example_positive_feedback():
    """Example 2: Positive customer feedback"""
    
    print("\n" + "="*70)
    print("EXAMPLE 2: Positive Customer Feedback")
    print("="*70)
    
    transcript = """
    I'm very happy with the service! The support team was quick to respond and 
    resolved my issue within minutes. The product quality is excellent and exactly 
    as described. Shipping was fast and the packaging was secure. Highly recommended!
    """
    
    result = analyze_feedback(transcript, verbose=True)
    print_summary(result)
    
    return result


def example_mixed_feedback():
    """Example 3: Mixed feedback"""
    
    print("\n" + "="*70)
    print("EXAMPLE 3: Mixed Customer Feedback")
    print("="*70)
    
    transcript = """
    The product quality is good, but the delivery took much longer than expected.
    Customer support was helpful when I finally got through, but the wait time 
    was frustrating. The price is a bit high for what you get. Overall, it's okay
    but there's room for improvement.
    """
    
    result = analyze_feedback(transcript, verbose=True)
    print_summary(result)
    
    return result


def example_batch_analysis():
    """Example 4: Batch analysis of multiple feedbacks"""
    
    print("\n" + "="*70)
    print("EXAMPLE 4: Batch Analysis")
    print("="*70)
    
    feedbacks = [
        "Great service, very satisfied!",
        "Slow delivery and poor packaging",
        "Customer support was rude to me",
        "Product broke after one use, terrible quality",
        "Easy checkout process, happy with purchase",
    ]
    
    all_issues = []
    all_categories = {}
    
    for i, feedback in enumerate(feedbacks, 1):
        print(f"\n--- Processing feedback {i}/{len(feedbacks)} ---")
        result = analyze_feedback(feedback, verbose=False)
        
        all_issues.extend(result.get('issues', []))
        
        for item in result.get('classified_issues', []):
            cat = item.get('category', 'Other')
            if cat not in all_categories:
                all_categories[cat] = []
            all_categories[cat].append(item)
    
    print("\n" + "="*70)
    print("AGGREGATED BATCH RESULTS")
    print("="*70)
    
    print(f"\nTotal Issues Identified: {len(all_issues)}")
    
    print("\nIssues by Category:")
    for category, items in sorted(all_categories.items(), key=lambda x: len(x[1]), reverse=True):
        avg_severity = sum(item.get('severity', 0) for item in items) / len(items)
        print(f"  • {category}: {len(items)} issues (avg severity: {avg_severity:.2f})")
    
    # Identify top problem areas
    if all_categories:
        top_category = max(all_categories.items(), key=lambda x: len(x[1]))
        print(f"\nTop Problem Area: {top_category[0]} ({len(top_category[1])} issues)")
    
    print("\n" + "="*70)


def main():
    """Run all examples"""
    
    print("\n🎯 Multi-Agent Customer Feedback Analysis - Examples")
    print("🤖 Using Google ADK Agents Framework\n")
    
    # Run examples
    example_negative_feedback()
    example_positive_feedback()
    example_mixed_feedback()
    example_batch_analysis()
    
    print("\n✅ All examples completed!\n")


if __name__ == "__main__":
    main()
