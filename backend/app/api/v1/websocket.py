import json
import logging
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("agrosmart.websocket")
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        # Map device_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, device_id: str, websocket: WebSocket):
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = []
        self.active_connections[device_id].append(websocket)
        logger.info(f"WebSocket client connected to device {device_id}")

    def disconnect(self, device_id: str, websocket: WebSocket):
        if device_id in self.active_connections:
            if websocket in self.active_connections[device_id]:
                self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]
        logger.info(f"WebSocket client disconnected from device {device_id}")

    async def broadcast(self, device_id: str, message: dict):
        if device_id in self.active_connections:
            text = json.dumps(message)
            disconnected = []
            for connection in self.active_connections[device_id]:
                try:
                    await connection.send_text(text)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(device_id, conn)


manager = ConnectionManager()


@router.websocket("/ws/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await manager.connect(device_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming ping
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(device_id, websocket)
