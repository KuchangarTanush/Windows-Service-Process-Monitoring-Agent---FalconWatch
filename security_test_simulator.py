import time
import requests
import sys

BACKEND_API_URL = "http://127.0.0.1:8001/api/simulate"

def trigger_process_simulation():
    print("[*] Simulating Process Chain Activity...")
    payload = {
        "type": "process_detection",
        "parent": "winword.exe",
        "child": "powershell.exe",
        "severity": "HIGH"
    }
    try:
        res = requests.post(BACKEND_API_URL, json=payload)
        if res.status_code == 200:
            print("    [SUCCESS] Process event generated successfully: winword.exe -> powershell.exe (HIGH)")
        else:
            print(f"    [FAIL] Failed to generate process event: Status {res.status_code}")
    except Exception as e:
        print(f"    [FAIL] Error: EDR Backend is offline ({e})")

def trigger_file_simulation():
    print("[*] Simulating Suspicious File Creation...")
    payload = {
        "type": "file_detection",
        "filename": "security_test_sample.txt",
        "path": "C:\\Users\\Public\\Test\\security_test_sample.txt",
        "severity": "MEDIUM"
    }
    try:
        res = requests.post(BACKEND_API_URL, json=payload)
        if res.status_code == 200:
            print("    [SUCCESS] File activity event generated successfully: security_test_sample.txt (MEDIUM)")
        else:
            print(f"    [FAIL] Failed to generate file event: Status {res.status_code}")
    except Exception as e:
        print(f"    [FAIL] Error: EDR Backend is offline ({e})")

def trigger_persistence_simulation():
    print("[*] Simulating Persistence Registry Modification...")
    payload = {
        "type": "persistence_detection",
        "service": "DemoUpdateService",
        "path": "C:\\Demo\\TestService.exe",
        "severity": "HIGH"
    }
    try:
        res = requests.post(BACKEND_API_URL, json=payload)
        if res.status_code == 200:
            print("    [SUCCESS] Persistence service event generated successfully: DemoUpdateService (HIGH)")
        else:
            print(f"    [FAIL] Failed to generate persistence event: Status {res.status_code}")
    except Exception as e:
        print(f"    [FAIL] Error: EDR Backend is offline ({e})")

def main():
    print("=========================================================")
    print("      FalconWatch EDR - Benign Security Simulator         ")
    print("=========================================================")
    print("[!] Gearing up simulation. Initiating sequential threats...\n")
    
    trigger_process_simulation()
    time.sleep(1.5)
    
    trigger_file_simulation()
    time.sleep(1.5)
    
    trigger_persistence_simulation()
    
    print("\n[SUCCESS] Simulation cycle complete. Check EDR dashboard for real-time alerts!")
    print("=========================================================")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSimulator halted.")
        sys.exit(0)
