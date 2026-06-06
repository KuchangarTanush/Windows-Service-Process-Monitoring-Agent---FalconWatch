import asyncio
import json
import logging
import sys
import psutil
import websockets
from scanner import get_active_processes, get_services

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BACKEND_WS_URL = "ws://127.0.0.1:8001/ws/agent"
SCAN_INTERVAL = 5  # Scan and stream every 5 seconds

async def send_telemetry(websocket):
    while True:
        try:
            logging.info("Scanning endpoint telemetry...")
            processes = get_active_processes()
            services = get_services()
            
            packet = {
                "processes": processes,
                "services": services
            }
            
            logging.info(f"Streaming {len(processes)} processes and {len(services)} services to backend...")
            await websocket.send(json.dumps(packet))
            
        except Exception as e:
            logging.error(f"Error gathering or sending telemetry: {e}")
            
        await asyncio.sleep(SCAN_INTERVAL)

async def handle_commands(websocket):
    try:
        async for message in websocket:
            try:
                command = json.loads(message)
                action = command.get("action")
                
                if action == "terminate_process":
                    pid = command.get("pid")
                    if not pid:
                        continue
                    logging.info(f"Received remediation command: TERMINATE PID {pid}")
                    try:
                        proc = psutil.Process(pid)
                        proc.terminate()
                        proc.wait(timeout=2)
                        logging.info(f"Successfully terminated process: {proc.name()} (PID: {pid})")
                    except psutil.NoSuchProcess:
                        logging.warning(f"Process PID {pid} not found (already stopped).")
                    except psutil.AccessDenied:
                        logging.error(f"Access Denied: Insufficient permissions to terminate PID {pid}.")
                    except Exception as ex:
                        logging.error(f"Error terminating PID {pid}: {ex}")
                        
            except json.JSONDecodeError:
                logging.warning("Received invalid non-JSON command from backend.")
    except websockets.exceptions.ConnectionClosed:
        logging.info("WebSocket command listener channel closed.")

async def main():
    logging.info("Starting EDR Windows Service & Process Monitoring Agent...")
    
    while True:
        try:
            logging.info(f"Connecting to EDR Backend at {BACKEND_WS_URL}...")
            async with websockets.connect(BACKEND_WS_URL) as websocket:
                logging.info("Connected successfully. Initializing stream...")
                
                # Run telemetry sending and command receiving concurrently
                await asyncio.gather(
                    send_telemetry(websocket),
                    handle_commands(websocket)
                )
        except (websockets.exceptions.ConnectionClosed, ConnectionRefusedError) as e:
            logging.warning(f"Backend offline or connection lost: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            logging.error(f"Unexpected error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Agent stopped by user.")
        sys.exit(0)
