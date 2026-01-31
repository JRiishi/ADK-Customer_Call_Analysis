import requests
import time
import os

API_URL = "http://localhost:8000/api/v1/analysis"

def test_end_to_end():
    print("🚀 Starting End-to-End Test")
    
    # 1. Create dummy file
    filename = "test_call.mp3"
    with open(filename, "wb") as f:
        f.write(b"dummy audio content")
    
    try:
        # 2. Upload
        print("📤 Uploading audio...")
        files = {'file': (filename, open(filename, 'rb'), 'audio/mpeg')}
        data = {'agent_id': 'agent_test_01'}
        
        res = requests.post(f"{API_URL}/upload", files=files, data=data)
        
        if res.status_code != 200:
            print(f"❌ Upload failed: {res.text}")
            return
            
        call_id = res.json()['call_id']
        print(f"✅ Upload success. Call ID: {call_id}")
        
        # 3. Poll for results
        print("⏳ Polling for analysis results...")
        for _ in range(20):
            res = requests.get(f"{API_URL}/{call_id}")
            if res.status_code == 200:
                data = res.json()
                status = data.get("status")
                print(f"   Status: {status}")
                
                if status == "completed":
                    print("✅ Analysis Completed!")
                    print("------------------------------------------------")
                    print(f"Sentiment: {data.get('scores', {}).get('sentiment')}")
                    print(f"SOP Score: {data.get('scores', {}).get('sop')}")
                    print(f"QA Score: {data.get('scores', {}).get('qa')}")
                    print("------------------------------------------------")
                    return
                elif status == "failed":
                    print(f"❌ Analysis Failed: {data.get('error')}")
                    return
            else:
                print(f"⚠️ Fetch failed: {res.status_code}")
                
            time.sleep(2)
            
        print("❌ Timeout waiting for analysis.")
            
    finally:
        # Cleanup
        try:
            if os.path.exists(filename):
                os.remove(filename)
        except Exception:
            pass

if __name__ == "__main__":
    test_end_to_end()
