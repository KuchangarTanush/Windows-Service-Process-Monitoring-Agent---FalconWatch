import os
from .database import get_db_connection, insert_alert

# Office Apps and Command Shell lists
OFFICE_APPS = {"winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe"}
SHELLS = {"cmd.exe", "powershell.exe", "wscript.exe", "cscript.exe", "mshta.exe", "pwsh.exe"}

# Blacklisted processes
BLACKLISTED_PROCESSES = {
    "mimikatz.exe", "psexec.exe", "nc.exe", "ncat.exe", "cobaltstrike.exe",
    "cain.exe", "netcat.exe", "procdump.exe", "rufus.exe"
}

# High-risk directories
HIGH_RISK_SUBSTRINGS = [
    "appdata\\local\\temp",
    "windows\\temp",
    "users\\public",
    "\\temp\\"
]

def analyze_packet(processes, services):
    """
    Analyzes processes and services. Generates alerts and returns them.
    Also updates risk levels of items in place.
    """
    alerts = []
    
    # 1. Map PID to Process Item for parent lookups
    proc_map = {p.pid: p for p in processes}
    
    # Track existing services to check for new ones
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT service_name FROM services")
    existing_services = {row['service_name'].lower() for row in cursor.fetchall()}
    conn.close()
    
    # Heuristics for Processes
    for p in processes:
        p_name_lower = p.process_name.lower()
        p_path_lower = p.path.lower() if p.path else ""
        
        # Rule 4: Suspicious process name
        if p_name_lower in BLACKLISTED_PROCESSES:
            p.risk_level = "HIGH"
            alert = insert_alert(
                alert_type="Suspicious Process Name",
                description=f"Blacklisted security tool detected running: {p.process_name} (PID: {p.pid})",
                severity="HIGH"
            )
            alerts.append(alert)
            
        # Rule 1: Office app spawning command shell
        if p.parent_pid and p.parent_pid in proc_map:
            parent = proc_map[p.parent_pid]
            parent_name_lower = parent.process_name.lower()
            if parent_name_lower in OFFICE_APPS and p_name_lower in SHELLS:
                p.risk_level = "CRITICAL"
                alert = insert_alert(
                    alert_type="Office App Spawns Command Shell",
                    description=f"Office application '{parent.process_name}' (PID: {parent.pid}) spawned terminal shell '{p.process_name}' (PID: {p.pid})",
                    severity="CRITICAL"
                )
                alerts.append(alert)
                
        # Rule 2: Execution from high-risk paths
        if p_path_lower:
            for substring in HIGH_RISK_SUBSTRINGS:
                if substring in p_path_lower:
                    # Upgrade risk if not already critical
                    if p.risk_level != "CRITICAL":
                        p.risk_level = "MEDIUM"
                    alert = insert_alert(
                        alert_type="High Risk Execution Path",
                        description=f"Process '{p.process_name}' (PID: {p.pid}) is executing from high-risk directory: {p.path}",
                        severity="MEDIUM"
                    )
                    alerts.append(alert)
                    break # Only alert once per path
                    
    # Heuristics for Services
    for s in services:
        s_name_lower = s.service_name.lower()
        s_path_lower = s.path.lower() if s.path else ""
        
        # Check if service path is high risk
        if s_path_lower:
            for substring in HIGH_RISK_SUBSTRINGS:
                if substring in s_path_lower:
                    s.risk_level = "HIGH"
                    alert = insert_alert(
                        alert_type="Suspicious Service Binary Path",
                        description=f"Service '{s.service_name}' binary path points to high-risk location: {s.path}",
                        severity="HIGH"
                    )
                    alerts.append(alert)
                    break
                    
        # Rule 3: New Startup Service (if database already contains services, i.e., post-baseline)
        if existing_services and s_name_lower not in existing_services:
            s.risk_level = "HIGH"
            alert = insert_alert(
                alert_type="New Startup Service Registered",
                description=f"A new Windows service was registered: '{s.service_name}' ({s.status}) running '{s.path}'",
                severity="HIGH"
            )
            alerts.append(alert)
            
    return alerts
