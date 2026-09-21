# Phase 8 — Gaming rooms, bookings, queue, session timer

## APIs

| Module | Endpoints |
|--------|-----------|
| Rooms | `GET/POST /gaming/rooms`, `PATCH/DELETE /gaming/rooms/:id` |
| Devices | `GET/POST /gaming/devices`, `PATCH/DELETE /gaming/devices/:id` |
| Availability | `GET /gaming/availability?roomId&date` — 09:00–21:00 slots |
| Reservations | `POST /reservations`, list/cancel (own), start/extend/complete (manage) |
| Queue | `GET/POST /gaming/queue`, notify, seat, leave |

## Session flow

1. Employee books slot → `CONFIRMED` + QR  
2. Supervisor **Start** → `ACTIVE` + `GamingSession` timer  
3. **Extend** (+N min) or **Complete** → `COMPLETED`  
4. Walk-ins: join queue → Notify → Seat (auto-creates & starts booking)

## Socket.io `/gaming`

- `reservation.updated`
- `queue.updated`

## Frontend

- **Gaming portal:** Rooms (+ devices), Reservations (live timers), Queue  
- **Employee:** slot picker, my bookings, join queue, active session timer  

## Seed

- Rooms: `ROOM-PS5`, `ROOM-PC`  
- Devices: PS5×2, PC×2, VR×1  
- Sample booking `GB-SEED-001` (tomorrow 10:00)  

## Try it

1. `gaming@smartoffice.local` → Reservations → Start `GB-SEED-001`  
2. `employee@smartoffice.local` → Gaming → book a free slot / join queue  
