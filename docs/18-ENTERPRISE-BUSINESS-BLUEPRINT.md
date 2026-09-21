# Enterprise Business Blueprint — Smart Office (500+ employees)

## 1. Product vision

**Smart Office** is the company’s internal operating system for:

1. **Café & catering** — employees order; baristas fulfil; inventory stays accurate  
2. **Workplace amenities** — gaming rooms / devices with fair booking  
3. **People ops touchpoints** — HR manages employees, balances, access  
4. **Governance** — admin controls users, roles, settings, audit, analytics  

**Target scale**

| Dimension | Target |
|-----------|--------|
| Employees | 500–2,000 (architecture ready for 10k+) |
| Concurrent users | 200–500 peak (lunch rush) |
| Baristas on shift | 3–12 |
| Inventory staff | 2–5 |
| HR staff | 2–8 |
| Gaming supervisors | 1–4 |
| Locations | 1 HQ first; multi-site ready later |

**North-star outcomes**

- Lunch rush: average wait &lt; 8 minutes; queue visible to all baristas  
- Stockouts from recipe drinks &lt; 2% of orders  
- 80%+ of café orders placed digitally (not at the counter)  
- Full audit trail for stock, orders, and user access  

---

## 2. Personas & staffing model (multi-person roles)

Every operational role is **multi-seat** (many people, same role, same shift tools).

| Persona | How many | Primary job | Portal |
|---------|----------|-------------|--------|
| Employee | 500+ | Order drinks, track status, book gaming, redeem rewards | Employee |
| Guest | Variable | Limited ordering | Employee (restricted) |
| Barista | 3–12 / shift | Shared live queue, prepare, handoff | Barista |
| Inventory Manager | 2–5 | Stock, POs, waste, recipes | Inventory |
| HR | 2–8 | Users/employees, free drinks & balances | Admin (+ HR screens) |
| Gaming Supervisor | 1–4 | Rooms, sessions, waiting list | Gaming |
| Admin | 1–3 | Catalog, settings, reports | Admin |
| Super Admin | 1–2 | Full access, RBAC, audit | Admin |

**Critical rule:** tools must support **collaboration**, not a single-user dashboard.

- Barista queue is shared; claiming/locking an order prevents double-prep  
- Inventory adjustments are attributable to the person who did them  
- HR changes are audited  
- Gaming check-in is conflict-safe under concurrent supervisors  

---

## 3. End-to-end business processes (must all work)

### P1 — Café order (core)

```
Browse menu → Add to cart → Place order → Barista accepts
→ Prepare (auto stock deduct via recipe) → Ready → Collect → Complete → Rate → Points
```

**SLA:** employee sees status within seconds; barista sees new ticket immediately.

### P2 — Inventory loop

```
Recipe defined → Order prepared → Stock OUT
Low / expiry alert → Purchase order → Receive → Stock IN
Waste event → Stock OUT + reason
```

### P3 — Rewards & HR

```
HR creates employee → Assign role → Seed free drinks / points policy
Order complete → Earn points → Redeem free drink at checkout
HR adjusts balance when needed (audited)
```

### P4 — Gaming

```
Browse rooms/devices → Book slot or join waitlist
→ Notify → Start session → Timer → Extend / Complete
```

### P5 — Governance

```
Invite/create user → Assign role(s) → Login
Every sensitive action → Audit log
Admin reviews KPIs & reports (D/W/M)
```

---

## 4. What exists today vs enterprise gaps

### Already in the product (MVP → strong foundation)

| Domain | Status |
|--------|--------|
| 5 portals + RBAC | ✅ |
| Auth JWT + refresh | ✅ |
| Menu / categories / recipes | ✅ |
| Orders lifecycle + barista queue UI | ✅ |
| Inventory + purchases + waste | ✅ |
| Gaming rooms/bookings/queue | ✅ |
| Rewards / free drinks | ✅ |
| Admin reports / audit / settings | ✅ |
| AR/EN + dark/light | ✅ |
| Deployed web + API (Vercel + Neon) | ✅ |

### Gaps for a real 500+ company (priority order)

| # | Gap | Why it matters at 500+ | Priority |
|---|-----|------------------------|----------|
| 1 | **True realtime** (Redis-backed sockets or SSE polling everywhere) | Many baristas + lunch rush | P0 |
| 2 | **Order claim / lock** on barista queue | Prevent two baristas making the same drink | P0 |
| 3 | **Shift & station model** (barista A on Station 1) | Multi-barista ops | P0 |
| 4 | **Departments / cost centers** on orders | Finance & HR reporting | P1 |
| 5 | **Notifications** (in-app + optional email/push: “Ready for pickup”) | Employees don’t stare at Orders page | P1 |
| 6 | **Capacity controls** (max open orders, prep ETA, peak throttling) | Protect café quality | P1 |
| 7 | **HR workflows** (bulk invite, deactivate leavers, org chart) | 500 users can’t be hand-seeded | P1 |
| 8 | **Multi-branch / multi-café** | Growth path | P2 |
| 9 | **Mobile-first PWA** | Employees order from phone in queue | P1 |
| 10 | **Hardening** (CI, staging, backups, uptime, rate limits per role) | Production trust | P0 |
| 11 | **UX polish** empty states, guided tours, skeleton loaders, denser ops UI for barista | Daily use quality | P0 |
| 12 | **Payments / wallet** (optional) | If café is not fully subsidized | P2 |

---

## 5. Recommended operating model (how the company uses it)

### Daily — Café

1. Inventory opens: check low-stock alerts  
2. Baristas log in → shared queue  
3. Employees order from desk/phone before / during break  
4. Screen or barista marks Ready → employee collects  
5. End of day: waste entry + prep-time report  

### Weekly — HR / Admin

1. Onboard new joiners (bulk)  
2. Review abuse (excessive free drinks / cancellations)  
3. Adjust menu / featured items  
4. Review gaming utilization  

### Monthly — Leadership

1. Orders volume, peak hours, avg prep  
2. Top items, waste cost, stockouts  
3. Gaming occupancy  

---

## 6. UX principles for “company-grade” UI

1. **One job per screen** — Barista = queue only; no clutter  
2. **Status always visible** — employee orders show big status + ETA  
3. **Optimistic + safe** — cart is instant; place order confirms with server truth  
4. **Multi-user safe** — claim badges, “Locked by Layla”, undo windows  
5. **Mobile employee / desktop ops** — employee portal phone-first; barista tablet/desktop  
6. **Bilingual by default** — AR/EN never second-class  
7. **Empty → action** — never a blank table without “what to do next”  
8. **Accessibility** — contrast, focus, large tap targets for café floor  

---

## 7. Delivery roadmap (next phases after current MVP)

### Phase A — Production reliability (2–3 weeks)

- Staging environment + DB backups  
- Replace fragile serverless sockets with polling where needed **or** dedicated API host (Railway/Render) + Redis  
- Order claim/lock + barista station  
- E2E critical paths in CI  
- Performance: lunch-rush load test (500 concurrent reads, 50 order writes/min)  

### Phase B — Scale UX (3–4 weeks)

- Employee PWA (installable, offline cart draft)  
- Push / in-app “Order ready”  
- Better barista kanban (sound, filters by station, prep timer)  
- HR bulk user import (CSV) + deactivate  
- Department tagging on orders  

### Phase C — Enterprise depth (4–6 weeks)

- Multi-café / multi-floor  
- Advanced reports (export Excel/PDF)  
- Policy engine (max orders/day, blacklist items, guest limits)  
- Optional SSO (Google/Microsoft)  

---

## 8. Success checklist before calling it “company ready”

- [ ] 10 baristas can work the same queue without duplicate prep  
- [ ] 500 employees can place orders in a 30-minute peak without timeouts  
- [ ] Stock never goes silently negative  
- [ ] HR can onboard 50 users in &lt; 10 minutes  
- [ ] Employee always knows: *Pending → Preparing → Ready* without refreshing manually  
- [ ] Audit can answer: who changed stock / who cancelled / who approved  
- [ ] AR + EN both cover every user-facing string  
- [ ] Runbook: backup, restore, incident, deploy  

---

## 9. Positioning statement (for stakeholders)

> **Smart Office** replaces paper lists, WhatsApp café orders, and spreadsheet inventory with one secure system: employees self-serve, baristas run a live shared queue, inventory stays recipe-accurate, HR controls access and perks, and leadership sees what the workplace amenities actually cost and deliver — built for companies of 500+ people with multiple staff in every operational role.
