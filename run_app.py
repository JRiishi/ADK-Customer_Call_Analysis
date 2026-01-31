import subprocess
import time
import os
import sys
import webbrowser

def run_command(command, cwd=None, new_window=True):
    """Run a command in a new terminal window."""
    if os.name == 'nt':  # Windows
        if new_window:
            subprocess.Popen(f'start cmd /k "{command}"', shell=True, cwd=cwd)
        else:
            subprocess.Popen(command, shell=True, cwd=cwd)
    else:  # Linux/Mac (Simple fallback)
        subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    print("🚀 Starting Cognivista QA System...")
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # 1. Start Backend
    print("🔹 Launching Backend (FastAPI)...")
    run_command("venv\\Scripts\\activate && uvicorn app.main:app --reload --port 8000", cwd=backend_dir)
    
    # 2. Wait a moment
    time.sleep(2)

    # 3. Start Frontend
    print("🔹 Launching Frontend (Vite)...")
    run_command("npm run dev", cwd=frontend_dir)
    
    # 4. Open Browser
    print("🔹 Opening Application...")
    time.sleep(3)
    webbrowser.open("http://localhost:5173")

    print("\n✅ System is running!")
    print("   - Backend: http://localhost:8000/docs")
    print("   - Frontend: http://localhost:5173")
    print("\nPress Ctrl+C to exit this script (servers will keep running in their windows).")

if __name__ == "__main__":
    main()
