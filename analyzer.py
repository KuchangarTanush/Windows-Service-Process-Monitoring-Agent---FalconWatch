import json
import logging
import os

class Analyzer:
    def __init__(self, rules_path='rules.json'):
        self.rules = self._load_rules(rules_path)
        self.suspicious_parents = self.rules.get('suspicious_parents', {})
        self.high_risk_paths = [path.replace('\\\\', '\\') for path in self.rules.get('high_risk_paths', [])]
        self.blacklisted_processes = self.rules.get('blacklisted_processes', [])

    def _load_rules(self, path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Failed to load rules from {path}: {e}")
            return {}

    def analyze_processes(self, processes):
        """
        Analyzes the process list for anomalies based on rules.
        Returns a list of alerts.
        """
        alerts = []
        for pid, proc_info in processes.items():
            name = proc_info.get('name', '').lower() if proc_info.get('name') else ''
            exe_path = proc_info.get('exe', '')
            ppid = proc_info.get('ppid')
            
            # 1. Check blacklist
            if name in self.blacklisted_processes:
                alerts.append({
                    'type': 'BLACKLISTED_PROCESS',
                    'severity': 'HIGH',
                    'message': f"Blacklisted process detected: {name} (PID: {pid})",
                    'details': proc_info
                })
            
            # 2. Check high risk paths
            if exe_path:
                for risk_path in self.high_risk_paths:
                    if risk_path.lower() in exe_path.lower():
                        alerts.append({
                            'type': 'HIGH_RISK_PATH_EXECUTION',
                            'severity': 'MEDIUM',
                            'message': f"Process executing from high-risk path: {exe_path} (PID: {pid})",
                            'details': proc_info
                        })
                        
            # 3. Check parent-child relationships
            if ppid and ppid in processes:
                parent_info = processes[ppid]
                parent_name = parent_info.get('name', '').lower() if parent_info.get('name') else ''
                
                # if parent is in suspicious parents list and child is a target
                if parent_name in self.suspicious_parents:
                    suspicious_children = self.suspicious_parents[parent_name]
                    if name in suspicious_children:
                        alerts.append({
                            'type': 'SUSPICIOUS_PARENT_CHILD',
                            'severity': 'HIGH',
                            'message': f"Suspicious lineage: {parent_name} spawned {name} (PID: {pid})",
                            'details': {
                                'parent': parent_info,
                                'child': proc_info
                            }
                        })
                        
        return alerts

    def analyze_services(self, current_services, baseline_services=None):
        """
        Audits startup services. If baseline is provided, detects newly added services.
        Otherwise, flags general suspicious patterns (e.g. Temp directory execution).
        """
        alerts = []
        
        # Check for services running from high-risk paths
        for svc in current_services:
            binpath = svc.get('binpath', '')
            if binpath:
                for risk_path in self.high_risk_paths:
                    if risk_path.lower() in binpath.lower():
                        alerts.append({
                            'type': 'SUSPICIOUS_SERVICE_PATH',
                            'severity': 'HIGH',
                            'message': f"Service '{svc.get('name')}' executing from high-risk path: {binpath}",
                            'details': svc
                        })

        # Check for newly added services if baseline exists
        if baseline_services is not None:
            baseline_names = {s.get('name') for s in baseline_services}
            for svc in current_services:
                if svc.get('name') not in baseline_names:
                    alerts.append({
                        'type': 'NEW_SERVICE_DETECTED',
                        'severity': 'INFO',
                        'message': f"New service registered: {svc.get('name')} ({svc.get('display_name')})",
                        'details': svc
                    })

        return alerts
