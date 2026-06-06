import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "edr.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create processes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_name TEXT,
        pid INTEGER,
        parent_pid INTEGER,
        parent_name TEXT,
        path TEXT,
        user TEXT,
        timestamp TEXT,
        risk_level TEXT
    )
    """)
    
    # Create services table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT,
        status TEXT,
        startup_type TEXT,
        path TEXT,
        risk_level TEXT
    )
    """)
    
    # Create alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT,
        description TEXT,
        severity TEXT,
        timestamp TEXT,
        status TEXT
    )
    """)
    
    # Add indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_processes_timestamp ON processes(timestamp)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)")
    
    conn.commit()
    conn.close()

def save_processes(processes_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    # We clear the active processes and insert the new snapshot
    cursor.execute("DELETE FROM processes")
    
    for p in processes_list:
        cursor.execute("""
        INSERT INTO processes (process_name, pid, parent_pid, parent_name, path, user, timestamp, risk_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.get('process_name'),
            p.get('pid'),
            p.get('parent_pid'),
            p.get('parent_name'),
            p.get('path'),
            p.get('user'),
            p.get('timestamp') or datetime.now().isoformat(),
            p.get('risk_level', 'LOW')
        ))
    conn.commit()
    conn.close()

def save_services(services_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Replace services with latest state
    cursor.execute("DELETE FROM services")
    for s in services_list:
        cursor.execute("""
        INSERT INTO services (service_name, status, startup_type, path, risk_level)
        VALUES (?, ?, ?, ?, ?)
        """, (
            s.get('service_name'),
            s.get('status'),
            s.get('startup_type'),
            s.get('path'),
            s.get('risk_level', 'LOW')
        ))
    conn.commit()
    conn.close()

def insert_alert(alert_type, description, severity, status="Active"):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO alerts (alert_type, description, severity, timestamp, status)
    VALUES (?, ?, ?, ?, ?)
    """, (alert_type, description, severity, timestamp, status))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": alert_id,
        "alert_type": alert_type,
        "description": description,
        "severity": severity,
        "timestamp": timestamp,
        "status": status
    }

def get_processes():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM processes ORDER BY process_name ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_services():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services ORDER BY service_name ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_alerts(severity_filter=None, status_filter=None, search=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    
    if severity_filter and severity_filter != "ALL":
        query += " AND severity = ?"
        params.append(severity_filter)
        
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)
        
    if search:
        query += " AND (alert_type LIKE ? OR description LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")
        
    query += " ORDER BY timestamp DESC"
    
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def update_alert_status(alert_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (status, alert_id))
    conn.commit()
    conn.close()

def clear_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM processes")
    cursor.execute("DELETE FROM services")
    cursor.execute("DELETE FROM alerts")
    conn.commit()
    conn.close()

init_db()
