# Cognivista QA

**Enterprise Intelligent Call-Center Overlay Platform**

Cognivista QA sits on top of existing call-center software to provide real-time agent assistance and deep post-call intelligence using a Multi-Agent AI architecture.

## 🏗️ Architecture
- **Frontend**: Vite + React (Cinematic Dark UI)
- **Backend**: FastAPI (Python 3.10+)
- **Database**: MongoDB Atlas
- **AI Engine**: ADK Agents (Gemini/Bedrock)

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB URI (in `.env`)

### Setup

1. **Backend**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # Configure your keys
   uvicorn app.main:app --reload
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🧩 Features
- **Agent Console**: Live transcription and AI nudges.
- **Post-Call QA**: Automated scoring and sentiment analysis.
- **Supervisor Dashboard**: Org-wide risk and performance metrics.

## 📁 Structure
- `backend/app`: Core API and Orchestrator.
- `backend/legacy_src`: Original Agent implementations (preserved).
- `frontend/src`: React application source.
