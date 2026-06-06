import psutil
import logging
import wmi

def get_active_processes():
    """
    Retrieves all running processes, their PIDs, PPIDs, executables, and paths.
    Returns a dictionary of process info keyed by PID.
    """
    processes = {}
    for proc in psutil.process_iter(['pid', 'ppid', 'name', 'exe']):
        try:
            processes[proc.info['pid']] = proc.info
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return processes

def get_services():
    """
    Enumerates Windows services using psutil or WMI.
    Returns a list of service dictionaries.
    """
    services = []
    try:
        for svc in psutil.win_service_iter():
            try:
                svc_info = svc.as_dict()
                # Safely extract fields, providing defaults if missing
                services.append({
                    "name": svc_info.get("name", ""),
                    "display_name": svc_info.get("display_name", ""),
                    "binpath": svc_info.get("binpath", ""),
                    "status": svc_info.get("status", ""),
                    "start_type": svc_info.get("start_type", "")
                })
            except (psutil.AccessDenied, psutil.NoSuchProcess, OSError) as e:
                logging.warning(f"Skipping service due to access error: {e}")
                continue
    except Exception as e:
        logging.warning(f"psutil.win_service_iter failed: {e}, trying WMI.")
        try:
            c = wmi.WMI()
            for svc in c.Win32_Service():
                services.append({
                    "name": svc.Name,
                    "display_name": svc.DisplayName,
                    "binpath": svc.PathName,
                    "status": svc.State,
                    "start_type": svc.StartMode
                })
        except Exception as e:
            logging.error(f"Failed to enumerate services via WMI: {e}")
    return services
