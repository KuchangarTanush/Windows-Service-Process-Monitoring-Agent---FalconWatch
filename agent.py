import time
import sys
import logging
from scanner import get_active_processes, get_services
from analyzer import Analyzer
from reporter import Reporter

def main():
    print("Starting Windows Service & Process Monitoring Agent...")
    
    # Initialize components
    analyzer = Analyzer(rules_path='rules.json')
    reporter = Reporter(log_dir='logs')
    
    # Establish baseline for services
    print("Establishing service baseline...")
    baseline_services = get_services()
    
    scan_interval = 10 # seconds
    
    try:
        while True:
            reporter.logger.info("Starting scan cycle...")
            
            # 1. Enumerate
            processes = get_active_processes()
            current_services = get_services()
            
            # 2. Analyze
            process_alerts = analyzer.analyze_processes(processes)
            service_alerts = analyzer.analyze_services(current_services, baseline_services=baseline_services)
            
            # Combine alerts
            all_alerts = process_alerts + service_alerts
            
            # 3. Report
            if all_alerts:
                reporter.logger.info(f"Scan complete. Found {len(all_alerts)} anomalies.")
                reporter.log_alerts(all_alerts)
            else:
                reporter.logger.info("Scan complete. No anomalies detected.")
                
            # Update baseline for next cycle to detect *newly* added services after startup
            baseline_services = current_services
            
            reporter.logger.info(f"Sleeping for {scan_interval} seconds...")
            time.sleep(scan_interval)
            
    except KeyboardInterrupt:
        print("\nMonitoring Agent stopped by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()
