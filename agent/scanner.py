import psutil
import logging
from datetime import datetime
import wmi

def get_active_processes():
    """
    Retrieves all running processes, their PIDs, PPIDs, parent names, paths, owners, and start times.
    """
    processes = []
    
    # Pre-cache process names by PID for parent name lookup
    pid_to_name = {}
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            pid_to_name[proc.info['pid']] = proc.info['name']
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    for proc in psutil.process_iter():
        try:
            # Using as_dict is cleaner but manual is more selective and less resource intensive
            info = proc.as_dict(attrs=['pid', 'ppid', 'name', 'exe', 'username', 'create_time'])
            
            pid = info.get('pid')
            ppid = info.get('ppid')
            name = info.get('name') or "Unknown"
            exe = info.get('exe') or ""
            user = info.get('username') or "N/A"
            create_time = info.get('create_time')
            
            # Parent process name lookup
            parent_name = pid_to_name.get(ppid, "Unknown") if ppid else "System"
            
            # Format time
            timestamp_str = ""
            if create_time:
                timestamp_str = datetime.fromtimestamp(create_time).isoformat()
            else:
                timestamp_str = datetime.now().isoformat()
                
            processes.append({
                "pid": pid,
                "process_name": name,
                "parent_pid": ppid,
                "parent_name": parent_name,
                "path": exe,
                "user": user,
                "timestamp": timestamp_str,
                "risk_level": "LOW" # Default, backend updates this
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    return processes

def get_services():
    """
    Enumerates Windows services using psutil or WMI.
    Skips individual services that raise WinError 2 (QueryServiceConfig2W)
    due to missing or corrupt service executable paths.
    """
    services = []

    try:
        for svc in psutil.win_service_iter():
            try:
                svc_info = svc.as_dict()
                name = svc_info.get('name', '')
                binpath = svc_info.get('binpath', '')
                status = svc_info.get('status', '')
                start_type = svc_info.get('start_type', '')

                services.append({
                    "service_name": name,
                    "status": status,
                    "startup_type": start_type,
                    "path": binpath,
                    "risk_level": "LOW"
                })
            except Exception:
                # Skip services with broken/missing config entries
                # (e.g. WinError 2 from QueryServiceConfig2W on corrupt services)
                pass

    except AttributeError:
        # psutil doesn't support win_service_iter on this platform — fall back to WMI
        try:
            c = wmi.WMI()
            for svc in c.Win32_Service():
                try:
                    services.append({
                        "service_name": svc.Name or "",
                        "status": svc.State or "",
                        "startup_type": svc.StartMode or "",
                        "path": svc.PathName or "",
                        "risk_level": "LOW"
                    })
                except Exception:
                    pass
        except Exception as e:
            logging.error(f"WMI services enumeration failed: {e}")

    return services
