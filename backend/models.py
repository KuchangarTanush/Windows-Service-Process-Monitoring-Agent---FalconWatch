from pydantic import BaseModel
from typing import List, Optional

class UserLogin(BaseModel):
    username: str
    password: str

class ProcessItem(BaseModel):
    pid: int
    process_name: str
    parent_pid: Optional[int] = None
    parent_name: Optional[str] = None
    path: Optional[str] = None
    user: Optional[str] = None
    timestamp: Optional[str] = None
    risk_level: Optional[str] = "LOW"

class ServiceItem(BaseModel):
    service_name: str
    status: str
    startup_type: str
    path: Optional[str] = None
    risk_level: Optional[str] = "LOW"

class AlertItem(BaseModel):
    id: Optional[int] = None
    alert_type: str
    description: str
    severity: str
    timestamp: Optional[str] = None
    status: Optional[str] = "Active"

class AgentPacket(BaseModel):
    processes: List[ProcessItem]
    services: List[ServiceItem]
