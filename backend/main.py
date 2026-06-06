import asyncio
import json
import csv
from io import StringIO
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Dict, Set, Optional

from .database import (
    get_processes, get_services, get_alerts, update_alert_status,
    save_processes, save_services, insert_alert, clear_db
)
from .models import UserLogin, AgentPacket, ProcessItem, ServiceItem
from .detector import analyze_packet

app = FastAPI(title="Windows Service & Process Monitoring Agent EDR Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection Pools
client_websockets: Set[WebSocket] = set()
agent_websockets: Set[WebSocket] = set()

# Simulated agent connection status tracker
last_agent_event_time = None

def get_risk_score(alerts):
    active_alerts = [a for a in alerts if a.get('status') == 'Active']
    score = 0
    for a in active_alerts:
        sev = a.get('severity', 'LOW').upper()
        if sev == 'CRITICAL':
            score += 35
        elif sev == 'HIGH':
            score += 20
        elif sev == 'MEDIUM':
            score += 10
        else:
            score += 2
    return min(100, score)

async def broadcast_to_clients(data: dict):
    if not client_websockets:
        return
    disconnected = set()
    for ws in client_websockets:
        try:
            await ws.send_json(data)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        client_websockets.remove(ws)

# Authentication Endpoint
@app.post("/api/login")
async def login(credentials: UserLogin):
    if credentials.username == "admin" and credentials.password == "admin123":
        return {"status": "success", "token": "EDR-SUPER-SECRET-TOKEN", "user": "Security Admin"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid security credentials. Access denied."
    )

# Get Data Endpoints
@app.get("/api/processes")
async def api_get_processes():
    return get_processes()

@app.get("/api/services")
async def api_get_services():
    return get_services()

@app.get("/api/alerts")
async def api_get_alerts(severity: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
    return get_alerts(severity_filter=severity, status_filter=status, search=search)

# Action Endpoints
@app.post("/api/alerts/{alert_id}/resolve")
async def api_resolve_alert(alert_id: int):
    update_alert_status(alert_id, "Resolved")
    # Broadcast updated alert status to clients
    await trigger_client_broadcast()
    return {"status": "success", "message": f"Alert {alert_id} marked as resolved"}

@app.post("/api/processes/{pid}/terminate")
async def api_terminate_process(pid: int):
    if not agent_websockets:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No endpoint agents are currently online to execute termination."
        )
    
    # Send kill request to all connected agents
    killed = False
    for ws in agent_websockets:
        try:
            await ws.send_json({"action": "terminate_process", "pid": pid})
            killed = True
        except Exception:
            pass
            
    if killed:
        return {"status": "success", "message": f"Termination command sent for PID {pid}"}
    raise HTTPException(status_code=500, detail="Failed to deliver command to EDR Agent.")

# Reports Summary Endpoint
@app.get("/api/reports/summary")
async def api_get_report_summary():
    procs = get_processes()
    svcs = get_services()
    alerts = get_alerts()
    
    total_scans = len(procs) > 0 # A simple placeholder
    threats_count = len([a for a in alerts if a['status'] == 'Active'])
    
    return {
        "total_scans": 1 if total_scans else 0,
        "processes_checked": len(procs),
        "services_analyzed": len(svcs),
        "threats_detected": len(alerts),
        "active_threats": threats_count
    }

# Export CSV Endpoint
@app.get("/api/reports/export-csv")
async def api_export_csv():
    alerts = get_alerts()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Alert Type", "Description", "Severity", "Timestamp", "Status"])
    
    for a in alerts:
        writer.writerow([a['id'], a['alert_type'], a['description'], a['severity'], a['timestamp'], a['status']])
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="edr_alerts_report.csv"'
    }
    return StreamingResponse(output, media_type="text/csv", headers=headers)

# Trigger Simulation Endpoints
@app.post("/api/simulate")
async def api_simulate_attack(payload: dict):
    sim_type = payload.get("type")
    
    if sim_type == "process_detection":
        parent = payload.get("parent", "winword.exe")
        child = payload.get("child", "powershell.exe")
        severity = payload.get("severity", "HIGH")
        desc = f"Simulated Suspicious Process: {parent} spawned {child}"
        alert = insert_alert(
            alert_type="Simulated Suspicious Process Chain",
            description=desc,
            severity=severity
        )
    elif sim_type == "file_detection":
        filename = payload.get("filename", "security_test_sample.txt")
        path = payload.get("path", "C:\\Users\\Public\\Test\\")
        severity = payload.get("severity", "MEDIUM")
        desc = f"Simulated File Activity: Suspicious file creation '{filename}' at {path}"
        alert = insert_alert(
            alert_type="Simulated Suspicious File Creation",
            description=desc,
            severity=severity
        )
    elif sim_type == "persistence_detection":
        service = payload.get("service", "DemoUpdateService")
        path = payload.get("path", "C:\\Demo\\TestService.exe")
        severity = payload.get("severity", "HIGH")
        desc = f"Simulated Persistence Attempt: Rogue service '{service}' created running {path}"
        alert = insert_alert(
            alert_type="Simulated Persistence Attempt",
            description=desc,
            severity=severity
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown simulation type")
        
    await trigger_client_broadcast()
    return {"status": "success", "alert": alert}

@app.post("/api/clear-db")
async def api_clear_db():
    clear_db()
    await trigger_client_broadcast()
    return {"status": "success", "message": "Database successfully cleared"}

# Broadcast triggers
async def trigger_client_broadcast():
    procs = get_processes()
    svcs = get_services()
    alerts = get_alerts()
    risk = get_risk_score(alerts)
    
    status_str = "Connected" if agent_websockets else "Disconnected"
    
    data = {
        "agent_status": status_str,
        "last_event_time": last_agent_event_time,
        "processes": procs,
        "services": svcs,
        "alerts": alerts,
        "stats": {
            "total_processes": len(procs),
            "running_services": len([s for s in svcs if s['status'].lower() in ('running', 'start_pending')]),
            "threats_found": len([a for a in alerts if a['status'] == 'Active']),
            "risk_score": risk
        }
    }
    await broadcast_to_clients(data)

# WebSocket - Agent Connection
@app.websocket("/ws/agent")
async def ws_agent_endpoint(websocket: WebSocket):
    global last_agent_event_time
    await websocket.accept()
    agent_websockets.add(websocket)
    print("EDR Endpoint Agent connected.")
    try:
        while True:
            data = await websocket.receive_json()
            last_agent_event_time = datetime.now().isoformat()
            
            # Extract packets
            processes_data = [ProcessItem(**p) for p in data.get("processes", [])]
            services_data = [ServiceItem(**s) for s in data.get("services", [])]
            
            # Analyze
            analyze_packet(processes_data, services_data)
            
            # Save to Database
            save_processes([p.dict() for p in processes_data])
            save_services([s.dict() for s in services_data])
            
            # Broadcast to UI
            await trigger_client_broadcast()
            
    except WebSocketDisconnect:
        print("EDR Endpoint Agent disconnected.")
    except Exception as e:
        print(f"Error in agent WebSocket connection: {e}")
    finally:
        agent_websockets.remove(websocket)
        await trigger_client_broadcast()

# WebSocket - Frontend Connection
@app.websocket("/ws/client")
async def ws_client_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_websockets.add(websocket)
    
    # Send initial data dump
    try:
        procs = get_processes()
        svcs = get_services()
        alerts = get_alerts()
        risk = get_risk_score(alerts)
        
        status_str = "Connected" if agent_websockets else "Disconnected"
        
        await websocket.send_json({
            "agent_status": status_str,
            "last_event_time": last_agent_event_time,
            "processes": procs,
            "services": svcs,
            "alerts": alerts,
            "stats": {
                "total_processes": len(procs),
                "running_services": len([s for s in svcs if s['status'].lower() in ('running', 'start_pending')]),
                "threats_found": len([a for a in alerts if a['status'] == 'Active']),
                "risk_score": risk
            }
        })
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error in client WebSocket: {e}")
    finally:
        client_websockets.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8001, reload=True)
