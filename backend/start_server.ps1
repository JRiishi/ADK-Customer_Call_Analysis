# Cognivista QA - Quick Start Script
# ===================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  COGNIVISTA QA - BACKEND STARTUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
$backendPath = "c:\Users\asus\Downloads\CognivistaQA\ADK-Customer_Call_Analysis\backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: Backend path not found!" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath
Write-Host "[OK] Working directory: $backendPath" -ForegroundColor Green

# Check for virtual environment
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "[OK] Virtual environment found" -ForegroundColor Green
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "[WARN] No virtual environment found. Using global Python." -ForegroundColor Yellow
}

# Check .env file
if (Test-Path ".\.env") {
    Write-Host "[OK] .env file found" -ForegroundColor Green
    
    # Check for Bedrock token
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match "AWS_BEARER_TOKEN_BEDROCK=.+") {
        Write-Host "[OK] AWS Bedrock token configured" -ForegroundColor Green
    } else {
        Write-Host "[WARN] AWS_BEARER_TOKEN_BEDROCK not set - will use fallback mode" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] .env file not found - using defaults" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Cyan
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs at: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
