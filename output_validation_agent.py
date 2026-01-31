"""
Output Validation Module
=========================
This module validates the complete pipeline output before final consumption.

IMPORTANT: This is NOT an LLM agent. This is a deterministic Python module.

Responsibilities:
- Schema validation (all required fields present)
- Range checks (severity 1-5, sentiment -1 to +1, priority P0-P3)
- Consistency checks (severity matches priority logic)
- Type validation (strings, floats, integers)
- Null/empty checks

Returns:
- valid: bool
- errors: list of validation errors
- sanitized_output: cleaned data (if valid)
"""

import json
from typing import Dict, List, Any, Tuple


class OutputValidator:
    """Validates final pipeline output against schema and business rules."""
    
    VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3']
    VALID_CATEGORIES = [
        'Response Time', 
        'Product Quality', 
        'Customer Support', 
        'Technical Issues', 
        'Billing / Pricing', 
        'Delivery / Logistics', 
        'Other'
    ]
    
    def __init__(self):
        self.errors = []
    
    def validate(self, output: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, Any]]:
        """
        Validate complete pipeline output.
        
        Args:
            output: Dictionary containing all pipeline outputs
            
        Returns:
            (is_valid, errors, sanitized_output)
        """
        self.errors = []
        
        # 1. Schema Validation
        self._validate_schema(output)
        
        # 2. System Status Validation
        if 'system_status' in output:
            self._validate_system_status(output['system_status'])
        
        # 3. Issues Validation
        if 'issues' in output:
            self._validate_issues(output['issues'])
        
        # 4. Classified Issues Validation
        if 'classified_issues' in output:
            self._validate_classified_issues(output['classified_issues'])
        
        # 5. Validated Severity Validation
        if 'validated_severity' in output:
            self._validate_severity(output['validated_severity'])
        
        # 6. Sentiment Validation
        if 'sentiment' in output:
            self._validate_sentiment(output['sentiment'])
        
        # 7. Priority Validation
        if 'priority' in output:
            self._validate_priority(output['priority'])
        
        # 8. Consistency Checks
        self._validate_consistency(output)
        
        is_valid = len(self.errors) == 0
        sanitized = self._sanitize(output) if is_valid else {}
        
        return is_valid, self.errors, sanitized
    
    def _validate_schema(self, output: Dict[str, Any]) -> None:
        """Check for required top-level fields."""
        required_fields = [
            'system_status', 'issues', 'classified_issues', 
            'validated_severity', 'sentiment', 'priority'
        ]
        
        for field in required_fields:
            if field not in output:
                self.errors.append(f"Missing required field: {field}")
    
    def _validate_system_status(self, status: Dict[str, Any]) -> None:
        """Validate system_status structure."""
        if not isinstance(status, dict):
            self.errors.append("system_status must be a dictionary")
            return
        
        # Check state
        if 'state' not in status:
            self.errors.append("system_status missing 'state' field")
        elif status['state'] not in ['success', 'partial', 'failed']:
            self.errors.append(f"Invalid system_status.state: {status['state']}")
        
        # Check failed_agents
        if 'failed_agents' not in status:
            self.errors.append("system_status missing 'failed_agents' field")
        elif not isinstance(status['failed_agents'], list):
            self.errors.append("system_status.failed_agents must be a list")
    
    def _validate_issues(self, issues: List[Dict[str, Any]]) -> None:
        """Validate extracted issues structure."""
        if not isinstance(issues, list):
            self.errors.append("issues must be a list")
            return
        
        for idx, issue in enumerate(issues):
            if not isinstance(issue, dict):
                self.errors.append(f"Issue {idx} is not a dictionary")
                continue
            
            # Required fields
            required = ['issue_id', 'issue_text', 'evidence_span', 'confidence']
            for field in required:
                if field not in issue:
                    self.errors.append(f"Issue {idx} missing field: {field}")
            
            # Confidence range
            if 'confidence' in issue:
                conf = issue['confidence']
                if not isinstance(conf, (int, float)) or not (0.0 <= conf <= 1.0):
                    self.errors.append(f"Issue {idx} confidence out of range: {conf}")
    
    def _validate_classified_issues(self, classified: List[Dict[str, Any]]) -> None:
        """Validate classified issues structure."""
        if not isinstance(classified, list):
            self.errors.append("classified_issues must be a list")
            return
        
        for idx, item in enumerate(classified):
            if not isinstance(item, dict):
                self.errors.append(f"Classified issue {idx} is not a dictionary")
                continue
            
            # Required fields
            required = ['issue_id', 'category', 'proposed_severity', 'confidence']
            for field in required:
                if field not in item:
                    self.errors.append(f"Classified issue {idx} missing field: {field}")
            
            # Category validation
            if 'category' in item and item['category'] not in self.VALID_CATEGORIES:
                self.errors.append(f"Classified issue {idx} invalid category: {item['category']}")
            
            # Proposed severity range (0.0-1.0)
            if 'proposed_severity' in item:
                sev = item['proposed_severity']
                if not isinstance(sev, (int, float)) or not (0.0 <= sev <= 1.0):
                    self.errors.append(f"Classified issue {idx} proposed_severity out of range: {sev}")
    
    def _validate_severity(self, validated: List[Dict[str, Any]]) -> None:
        """Validate severity validation output."""
        if not isinstance(validated, list):
            self.errors.append("validated_severity must be a list")
            return
        
        for idx, item in enumerate(validated):
            if not isinstance(item, dict):
                self.errors.append(f"Validated severity {idx} is not a dictionary")
                continue
            
            # Required fields
            required = ['issue_id', 'final_severity', 'validated', 'justification']
            for field in required:
                if field not in item:
                    self.errors.append(f"Validated severity {idx} missing field: {field}")
            
            # Final severity range (1-5)
            if 'final_severity' in item:
                sev = item['final_severity']
                if not isinstance(sev, int) or not (1 <= sev <= 5):
                    self.errors.append(f"Validated severity {idx} final_severity out of range: {sev}")
            
            # Validated flag
            if 'validated' in item and not isinstance(item['validated'], bool):
                self.errors.append(f"Validated severity {idx} 'validated' must be boolean")
    
    def _validate_sentiment(self, sentiment: Dict[str, Any]) -> None:
        """Validate sentiment analysis output."""
        if not isinstance(sentiment, dict):
            self.errors.append("sentiment must be a dictionary")
            return
        
        # Required fields
        required = ['sentiment_score', 'sentiment_label', 'confidence']
        for field in required:
            if field not in sentiment:
                self.errors.append(f"sentiment missing field: {field}")
        
        # Sentiment score range (-1.0 to +1.0)
        if 'sentiment_score' in sentiment:
            score = sentiment['sentiment_score']
            if not isinstance(score, (int, float)) or not (-1.0 <= score <= 1.0):
                self.errors.append(f"sentiment_score out of range: {score}")
        
        # Sentiment label
        if 'sentiment_label' in sentiment:
            label = sentiment['sentiment_label']
            if label not in ['Positive', 'Negative', 'Neutral']:
                self.errors.append(f"Invalid sentiment_label: {label}")
        
        # Confidence
        if 'confidence' in sentiment:
            conf = sentiment['confidence']
            if not isinstance(conf, (int, float)) or not (0.0 <= conf <= 1.0):
                self.errors.append(f"sentiment confidence out of range: {conf}")
    
    def _validate_priority(self, priority: Dict[str, Any]) -> None:
        """Validate priority scoring output."""
        if not isinstance(priority, dict):
            self.errors.append("priority must be a dictionary")
            return
        
        # Required fields
        required = ['priority_level', 'priority_score']
        for field in required:
            if field not in priority:
                self.errors.append(f"priority missing field: {field}")
        
        # Priority level
        if 'priority_level' in priority:
            level = priority['priority_level']
            if level not in self.VALID_PRIORITIES:
                self.errors.append(f"Invalid priority_level: {level}")
        
        # Priority score range (0.0-1.0)
        if 'priority_score' in priority:
            score = priority['priority_score']
            if not isinstance(score, (int, float)) or not (0.0 <= score <= 1.0):
                self.errors.append(f"priority_score out of range: {score}")
    
    def _validate_consistency(self, output: Dict[str, Any]) -> None:
        """Cross-validate related fields for logical consistency."""
        
        # Check if all issues have corresponding classified issues
        if 'issues' in output and 'classified_issues' in output:
            issue_ids = {issue.get('issue_id') for issue in output['issues']}
            classified_ids = {item.get('issue_id') for item in output['classified_issues']}
            
            if issue_ids != classified_ids:
                missing = issue_ids - classified_ids
                extra = classified_ids - issue_ids
                if missing:
                    self.errors.append(f"Missing classified issues for: {missing}")
                if extra:
                    self.errors.append(f"Extra classified issues found: {extra}")
        
        # Check if validated severity matches classified issues
        if 'classified_issues' in output and 'validated_severity' in output:
            classified_ids = {item.get('issue_id') for item in output['classified_issues']}
            validated_ids = {item.get('issue_id') for item in output['validated_severity']}
            
            if classified_ids != validated_ids:
                missing = classified_ids - validated_ids
                extra = validated_ids - classified_ids
                if missing:
                    self.errors.append(f"Missing validated severity for: {missing}")
                if extra:
                    self.errors.append(f"Extra validated severity found: {extra}")
        
        # Validate priority logic consistency (P0 = severity 5, P3 = severity 1-2)
        if 'validated_severity' in output and 'priority' in output:
            avg_severity = sum(item.get('final_severity', 3) for item in output['validated_severity']) / max(len(output['validated_severity']), 1)
            priority_level = output['priority'].get('priority_level', 'P2')
            
            # Rough consistency check
            if avg_severity >= 4.5 and priority_level not in ['P0', 'P1']:
                self.errors.append(f"Inconsistent: avg_severity={avg_severity:.1f} but priority={priority_level}")
            elif avg_severity <= 2.0 and priority_level not in ['P2', 'P3']:
                self.errors.append(f"Inconsistent: avg_severity={avg_severity:.1f} but priority={priority_level}")
    
    def _sanitize(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize and normalize valid output."""
        sanitized = output.copy()
        
        # Ensure all numeric fields are properly typed
        if 'sentiment' in sanitized and 'sentiment_score' in sanitized['sentiment']:
            sanitized['sentiment']['sentiment_score'] = float(sanitized['sentiment']['sentiment_score'])
        
        if 'priority' in sanitized and 'priority_score' in sanitized['priority']:
            sanitized['priority']['priority_score'] = float(sanitized['priority']['priority_score'])
        
        # Ensure final_severity is integer
        if 'validated_severity' in sanitized:
            for item in sanitized['validated_severity']:
                if 'final_severity' in item:
                    item['final_severity'] = int(item['final_severity'])
        
        return sanitized


def validate_pipeline_output(output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to validate pipeline output.
    
    Args:
        output: Complete pipeline output dictionary
        
    Returns:
        {
            'valid': bool,
            'errors': list,
            'sanitized_output': dict
        }
    """
    validator = OutputValidator()
    is_valid, errors, sanitized = validator.validate(output)
    
    return {
        'valid': is_valid,
        'errors': errors,
        'sanitized_output': sanitized
    }


# Example usage
if __name__ == "__main__":
    # Test with sample output
    sample_output = {
        "system_status": {
            "state": "success",
            "failed_agents": [],
            "timestamp": "2024-01-15T10:30:00Z"
        },
        "issues": [
            {
                "issue_id": "issue_1",
                "issue_text": "Product broke after one day",
                "evidence_span": "The product stopped working the next morning",
                "confidence": 0.95
            }
        ],
        "classified_issues": [
            {
                "issue_id": "issue_1",
                "issue_text": "Product broke after one day",
                "category": "Product Quality",
                "proposed_severity": 0.9,
                "confidence": 0.85
            }
        ],
        "validated_severity": [
            {
                "issue_id": "issue_1",
                "final_severity": 4,
                "validated": True,
                "justification": "High severity per SOP-2024-001",
                "grounding_source": "SOP-2024-001 \u00a72.1"
            }
        ],
        "sentiment": {
            "sentiment_score": -0.75,
            "sentiment_label": "Negative",
            "confidence": 0.92
        },
        "priority": {
            "priority_level": "P1",
            "priority_score": 0.825
        },
        "insights": "Critical Product Quality issue",
        "recommended_actions": ["Escalate to QA team"],
        "business_impact": "High churn risk"
    }
    
    result = validate_pipeline_output(sample_output)
    print(json.dumps(result, indent=2))
