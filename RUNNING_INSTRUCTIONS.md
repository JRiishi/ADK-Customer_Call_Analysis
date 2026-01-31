# Cognivista QA - Running the Application

## Quick Start

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd c:\Users\asus\Downloads\CognivistaQA\ADK-Customer_Call_Analysis\backend

# Activate virtual environment (if exists)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```powershell
# Open a NEW terminal window

# Navigate to frontend directory
cd c:\Users\asus\Downloads\CognivistaQA\ADK-Customer_Call_Analysis\frontend

# Install dependencies (first time only)
npm install

# Start the frontend dev server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## What You Should See

### Backend Terminal (Expected Output)
```
======================================================================
🚀 COGNIVISTA BEDROCK LLM GATEWAY - INITIALIZING
======================================================================
📍 Region: us-east-1
🤖 Model: anthropic.claude-3-sonnet-20240229-v1:0
🔑 Auth Mode: BEARER TOKEN (API Key)
🔑 Token Preview: ABSKQmVkcm9ja0FQS...
✅ Bedrock Gateway Ready with Bearer Token Auth
======================================================================
🎼 ORCHESTRATOR AGENT - INITIALIZING
======================================================================
✅ All specialized agents loaded
======================================================================
🚀 COGNIVISTA QA BACKEND - STARTING UP
======================================================================
📍 Project: Cognivista QA
📍 API Version: /api/v1
📍 MongoDB: mongodb+srv://...
📍 Database: cognivista_qa
----------------------------------------------------------------------
🔌 Connecting to MongoDB at mongodb+srv://...
✅ MongoDB Connection Established
======================================================================
✅ BACKEND READY - Waiting for requests...
======================================================================
```

### When You Analyze a Call
```
======================================================================
🎬 STARTING ANALYSIS PIPELINE
📞 Call ID: call_abc123
📝 Transcript length: 1500 chars
======================================================================
🚀 Launching all agents in parallel...
⏳ Awaiting 5 agent results...
✅ Agent [sentiment] completed successfully
✅ Agent [sop_compliance] completed successfully
✅ Agent [risk_analysis] completed successfully
✅ Agent [qa_score] completed successfully
✅ Agent [coaching] completed successfully
------------------------------------------------------
📊 AGENT RESULTS SUMMARY:
   ✅ sentiment: OK
   ✅ sop_compliance: OK
   ✅ risk_analysis: OK
   ✅ qa_score: OK
   ✅ coaching: OK
------------------------------------------------------
📈 COMPUTED METRICS:
   🎭 Sentiment Score: 75
   📋 SOP Score: 100
   📊 QA Score: 88
   ⚠️ Risk Detected: False (low)
======================================================================
✅ ANALYSIS COMPLETE FOR call_abc123
======================================================================
```

---

## Environment Configuration

The `.env` file in the backend directory should contain:

```env
MONGODB_URL=mongodb+srv://...
DATABASE_NAME=cognivista_qa
AWS_BEARER_TOKEN_BEDROCK=your_bedrock_api_key
AWS_DEFAULT_REGION=us-east-1
```

---

## How the Agents Work

1. **SentimentAgent**: Analyzes emotional tone and trajectory throughout the call
2. **SOPComplianceAgent**: Checks if the agent followed standard procedures
3. **RiskDetectionAgent**: Identifies churn, legal, and compliance risks
4. **QAScoringAgent**: Provides an overall quality score (0-100)
5. **CoachingAgent**: Generates personalized coaching feedback

All agents run **in parallel** for maximum speed, then results are combined.

---

## Testing the System

1. Open the frontend at http://localhost:5173
2. Click "Enter Console" or go to "/console"
3. Click "Start Call" to begin a simulated call
4. Click "Next Line" to progress through the simulation
5. When done, click "End Call" to trigger analysis
6. View the full analysis report on the results page

---

## Troubleshooting

### "Analysis Not Found"
- Wait a few seconds - analysis runs in background
- Check backend terminal for errors
- Ensure MongoDB is accessible

### "Bedrock API Error"
- Verify AWS_BEARER_TOKEN_BEDROCK is set correctly
- Check if the token hasn't expired
- The system will fall back to intelligent simulation if Bedrock fails

### "Module not found"
```powershell
pip install -r requirements.txt
```

### "MongoDB Connection Failed"
- Ensure your MongoDB Atlas cluster is running
- Check if IP whitelist includes your current IP
