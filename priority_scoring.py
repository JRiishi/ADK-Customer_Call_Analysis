# priority_scoring_agent.py

def calculate_priority(
    final_severity: int,
    severity_confidence: float,
    sentiment_score: float,
    sentiment_confidence: float,
):
    # Normalize severity (1–5 → 0–1)
    severity_norm = final_severity / 5.0

    # Convert sentiment to risk (negative sentiment = higher risk)
    sentiment_risk = 1.0 - sentiment_score

    # Weighted priority score
    priority_score = (0.6 * severity_norm) + (0.4 * sentiment_risk)

    # Clamp to [0, 1]
    priority_score = max(0.0, min(1.0, priority_score))

    # Priority levels
    if priority_score >= 0.80:
        level = "P0"
    elif priority_score >= 0.60:
        level = "P1"
    elif priority_score >= 0.40:
        level = "P2"
    else:
        level = "P3"

    return {
        "priority_score": round(priority_score, 2),
        "priority_level": level,
        "components": {
            "severity_weighted": round(0.6 * severity_norm, 2),
            "sentiment_weighted": round(0.4 * sentiment_risk, 2),
        },
        "confidence": round(
            min(severity_confidence, sentiment_confidence), 2
        ),
    }
