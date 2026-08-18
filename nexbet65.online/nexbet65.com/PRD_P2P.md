# Product Requirements Document: Zero-Verification P2P Agent Matching Platform

**Version:** 1.1
**Date:** August 12, 2026
**Status:** Draft
**Classification:** Internal / Confidential

---

## 1. Executive Summary

### 1.1 Product Vision
A lightweight, real-time P2P deposit matching engine enabling players to fund accounts via human agents without KYC, OTP, or MFS API integrations. Trust is enforced exclusively through float collateral, behavioral analytics, and automated risk controls.

### 1.2 Target Users
| Role | Description | Key Need |
| :--- | :--- | :--- |
| **Player** | End-user depositing funds | See instant payment instructions; get credited fast |
| **Agent** | P2P liquidity provider (no KYC) | Receive transaction requests; manage float; earn commission |
| **Admin** | Platform operator | Monitor system health; resolve disputes; manage risk |

### 1.3 Success Metrics (90-Day Targets)
| Metric | Target | Measurement |
| :--- | :--- | :--- |
| Avg Deposit Completion Time | <8 minutes | Timestamp delta: instruction shown → player credited |
| Agent Success Rate | >80% rolling 7-day | Confirmed txns / assigned txns |
| Fraud Loss Rate | <10% of GGR | Write-offs / gross gaming revenue |
| Active Agents (Daily) | 50+ concurrent | Unique agents with ≥1 txn in 24hr window |
| Player Credit SLA Compliance | >95% within 10 min | Auto-tracked per transaction |

### 1.4 Non-Goals (v1.0)
- No KYC/identity verification for agents
- No SMS/WhatsApp/email OTP
- No MFS/bank API integration
- No withdrawal processing via agents (deposit-only)
- No multi-tier agent hierarchy

---

## 2. System Architecture

```
┌──────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│   PLAYER APP │◀────▶│   MATCHING ENGINE   │◀────▶│  AGENT DASHBOARD │
│              │ WS   │                     │ WS   │                  │
│ • Deposit UI │      │ • Active Agent DB   │      │ • Float Balance  │
│ • Instr View │      │ • Float Ledger      │      │ • Txn Queue      │
│ • Proof Subm │      │ • Risk Engine       │      │ • Confirm/Reject │
└──────────────┘      │ • Settlement Logic  │      │ • Wallet Mgmt    │
                      └─────────┬───────────┘      └──────────────────┘
                                │
                      ┌─────────▼───────────┐
                      │    ADMIN PANEL      │
                      │ • Live Monitoring   │
                      │ • Dispute Queue     │
                      │ • Risk Config       │
                      │ • Audit Logs        │
                      └─────────────────────┘
```

**Tech Stack:** Node.js/Go + PostgreSQL + Redis + WebSocket + React/Next.js + FingerprintJS

---

## 3. Agent Flows

### 3.1 Registration Flow
```
Generate Agent Code → Set Password → Display Recovery Key (once) → 
Capture Device Fingerprint → Bind Wallet → Show Float Deposit Instructions → 
Wait for Confirmation → ACTIVATE → Redirect to Dashboard
```

### 3.2 Login & Session Management
```
Enter Code + Password → Validate → Check Device Fingerprint → 
Check Concurrent Sessions → Check IP Geo → Issue Session Token (7-day TTL)
```

### 3.3 Transaction Processing
```
Receive Request (WS) → Display in Queue with Timer → 
Confirm/Deny → Platform Validates → Credit Player / Reassign → Update Dashboard
```

### 3.4 Float Top-Up
```
Click "Top Up" → View Instructions + Reference Code → Send Funds Externally → 
Platform Confirms → Float Credited → Real-time Balance Update
```

### 3.5 Wallet Management
```
View Bound Wallets → Add New (24hr cooldown) → Remove (24hr cooldown) → 
Change Primary (72hr age requirement + 24hr cooldown + risk flag)
```

---

## 4. Admin Flows

### 4.1 Live Monitoring
Real-time system health, transaction feed, agent status map.

### 4.2 Dispute Resolution
Review evidence → Determine outcome → Execute resolution → Notify parties → Log decision.

### 4.3 Risk Configuration
Configure thresholds → Test against historical data → Deploy with version control → Alert admins.

### 4.4 Agent Management
Search/filter → View profile + history → Suspend/adjust/reset/ban.

---

## 5. Wireframe Descriptions

### 5.1 Agent Dashboard

#### 5.1.1 Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                          │
│ [Logo] AGT-X7K9 ● ACTIVE │ 💰 ZMW 5,000.00 │ ⚙️ │ 👤 Logout    │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│  LEFT PANEL (40%)          │  RIGHT PANEL (60%)                 │
│  Incoming Requests         │  Transaction History               │
│  (Priority Queue)          │  (Sortable Table)                  │
│                            │                                    │
│                            │                                    │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│ BOTTOM BAR                                                       │
│ Today: ZMW 12,400 vol │ 94% success │ 38s avg │ 3 pending      │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Top Bar Components
| Element | Behavior | Notes |
| :--- | :--- | :--- |
| Agent Code Badge | Static display | Monospace font, high contrast |
| Status Indicator | Green dot = ACTIVE, Yellow = PROBATION, Red = SUSPENDED | Pulsing animation when new request arrives |
| Float Balance | Updates in real-time via WebSocket | Flash green on increase, red on decrease; 2-decimal precision |
| Settings Icon | Opens wallet management + profile modal | Gear icon |
| Logout Button | Terminates session immediately | Requires confirmation dialog |

#### 5.1.3 Left Panel: Incoming Requests Queue
Each request card displays:

```
┌─────────────────────────────────────┐
│ 🔔 DEP-X7K9M2            ⏱ 07:32   │ ← Countdown timer (red <2min)
│                                     │
│ Amount: ZMW 500.00                  │ ← Large bold font
│ Player: PLR-****89                  │ ← Masked ID
│ Wallet: MTN +26097***XX             │ ← Partially masked
│ Ref: TXN-20260812-00451            │ ← Copyable on tap
│                                     │
│ [✓ CONFIRM]        [✗ DENY]        │ ← Full-width buttons
└─────────────────────────────────────┘
```

**Interaction Details:**
- Cards sorted by urgency (least time remaining first)
- New cards slide in from top with audio/haptic notification
- Max 5 visible cards; overflow scrolls
- Timer turns orange at 5 min, red at 2 min, pulses at 30 sec
- CONFIRM button opens inline confirmation form:
  ```
  Transaction ID: [auto-filled, editable]
  Confirmed Amount: [auto-filled, editable]
  Note: [optional text field]
  [Submit Confirmation]
  ```
- DENY button opens reason selector:
  ```
  ○ Wrong amount received
  ○ No payment received
  ○ Suspected fraud
  ○ Other: [text field]
  [Submit Denial]
  ```
- Both actions disabled after timer expires; card auto-removes with "EXPIRED" toast

#### 5.1.4 Right Panel: Transaction History Table
| Column | Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- |
| Time | HH:MM:SS | ✅ | Date range picker |
| Type | Icon + label (DEP/TOPUP/COMM) | ✅ | Multi-select dropdown |
| Amount | ZMW X,XXX.XX | ✅ | Min/max range |
| Status | Color-coded badge | ✅ | Multi-select |
| Details | Expandable row on click | ❌ | Search by ref/txn ID |

**Status Badges:**
- ✅ CONFIRMED (green)
- ❌ DENIED (red)
- ⏳ PENDING (yellow)
- ⚠️ DISPUTED (orange)
- 🚫 EXPIRED (grey)

**Expandable Row Detail:**
```
Transaction ID: TXN-20260812-00451
Player: PLR-8834
Assigned: 14:28:01 | Completed: 14:28:46 (45s)
Requested: ZMW 500.00 | Confirmed: ZMW 500.00
Risk Score: 12/100
Player Proof: [View Screenshot]
Notes: —
```

#### 5.1.5 Bottom Bar Metrics
| Metric | Update Frequency | Visual Treatment |
| :--- | :--- | :--- |
| Today's Volume | Real-time | Currency formatted |
| Success Rate | Rolling 50-txn | Progress bar + percentage; green >80%, yellow 70-80%, red <70% |
| Avg Response Time | Rolling 50-txn | Seconds; green <60s, yellow 60-120s, red >120s |
| Pending Count | Real-time | Badge number; pulses when >0 |

#### 5.1.6 Modals & Overlays

**Wallet Management Modal:**
```
┌─────────────────────────────────────────┐
│ Wallet Management                    ✕  │
├─────────────────────────────────────────┤
│ PRIMARY WALLET                          │
│ MTN MoMo: +26097XXXXXXX                │
│ Holder: John D.                         │
│ Bound: Aug 10, 2026                     │
│                                         │
│ SECONDARY WALLETS                       │
│ Airtel Money: +26096XXXXXXX  [Remove]   │
│ Bound: Aug 11, 2026 | Usable: Aug 12   │
│                                         │
│ [+ ADD NEW WALLET]                      │
│                                         │
│ ⚠️ Changes subject to 24hr cooldown     │
└─────────────────────────────────────────┘
```

**Float Top-Up Modal:**
```
┌─────────────────────────────────────────┐
│ Top Up Float                         ✕  │
├─────────────────────────────────────────┤
│ Send funds to:                          │
│ Bank: Stanbic                           │
│ Account: 9081234567                     │
│ Reference: TOP-AGT-X7K9-8842           │ ← Copy button
│                                         │
│ Min: ZMW 500 | Max: ZMW 10,000         │
│ Est. Activation: <30 min                │
│                                         │
│ Recent Deposits:                        │
│ Aug 12, 10:30 | ZMW 2,000 | ✅ Done    │
│ Aug 11, 14:15 | ZMW 1,500 | ✅ Done    │
└─────────────────────────────────────────┘
```

**Recovery Key Warning Modal (Registration Only):**
```
┌─────────────────────────────────────────┐
│ ⚠️ SAVE YOUR RECOVERY KEY              │
├─────────────────────────────────────────┤
│ YOUR KEY: xk9m-2pqr-7wbn-4jfs          │ ← Copy / Download .txt
│                                         │
│ This key is shown ONLY ONCE.            │
│ Losing it means PERMANENT account loss. │
│ No support can recover it.              │
│                                         │
│ ☐ I have saved this key securely        │ ← Must check to proceed
│                                         │
│ [CONTINUE]                              │ ← Disabled until checked
└─────────────────────────────────────────┘
```

---

### 5.2 Admin Dashboard

#### 5.2.1 Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ NAV SIDEBAR │ MAIN CONTENT AREA                                  │
│             │                                                    │
│ 📊 Overview │  [Content changes based on nav selection]          │
│ ⚡ Live Feed│                                                    │
│ 👥 Agents   │                                                    │
│ ⚖️ Disputes │                                                    │
│ 🛡️ Risk     │                                                    │
│ 📋 Audit    │                                                    │
│ ⚙️ Settings │                                                    │
│             │                                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Overview Page
```
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM HEALTH (Auto-refresh 5s)                                  │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Active Agents│ Pending Req  │ Avg Wait     │ Fraud Flags (24h) │
│     47       │     12       │   2m 15s     │        3          │
│ ▲ +3 vs 1hr  │ ▼ -2 vs 1hr │              │                   │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│ FLOAT OVERVIEW                                                   │
│ Total Float: ZMW 285,000 | Utilized: 68% | Idle: ZMW 91,200    │
│ [████████████████░░░░░░░░] 68%                                  │
├─────────────────────────────────────────────────────────────────┤
│ AGENT STATUS DISTRIBUTION                                        │
│ Active: 47 │ Probation: 8 │ Suspended: 5 │ Offline: 23 │ Banned: 2│
│ [Stacked horizontal bar chart]                                   │
├─────────────────────────────────────────────────────────────────┤
│ VOLUME TREND (Last 24h)                                          │
│ [Line chart: hourly txns + volume overlay]                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Live Transaction Feed
```
┌─────────────────────────────────────────────────────────────────┐
│ LIVE FEED (Auto-scroll, pause on hover)                          │
│ Filter: [All ▼] [Last 1h ▼] [Risk ≥ ▼] Search: [________]     │
├─────────────────────────────────────────────────────────────────┤
│ Time       │ Agent   │ Type │ Amount    │ Status    │ Duration  │
│ 14:32:01   │ AGT-X7K9│ DEP  │ ZMW 500   │ ✅ Conf   │ 45s       │
│ 14:31:48   │ AGT-M3N2│ DEP  │ ZMW 200   │ ⏳ Pend   │ 3m 12s    │
│ 14:31:30   │ AGT-P5Q8│ DEP  │ ZMW 1,000 │ ❌ Denied │ —         │
│ 14:31:15   │ AGT-R2T6│ DEP  │ ZMW 300   │ 🚩 Flag   │ Velocity  │
│ 14:30:58   │ AGT-X7K9│ DEP  │ ZMW 150   │ ✅ Conf   │ 22s       │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Row Interactions:**
- Click any row → slide-out detail panel with full transaction data, player proof, agent confirmation, risk score breakdown
- 🚩 Flagged rows highlighted in light red; expandable to show triggered rules
- Export button for CSV/JSON download

#### 5.2.4 Agents Management Page
```
┌─────────────────────────────────────────────────────────────────┐
│ AGENTS                                                           │
│ Search: [code/wallet/name] │ Status: [All ▼] │ Sort: [Active ▼]│
│ [+ EXPORT] [+ BULK ACTION ▼]                                    │
├─────────────────────────────────────────────────────────────────┤
│ Code     │ Wallet       │ Float    │ Success │ Vol(24h)│ Status │
│ AGT-X7K9 │ +26097***XX  │ 5,000    │ 94%     │ 12,400  │ 🟢 Act │
│ AGT-M3N2 │ +26096***YY  │ 2,200    │ 87%     │ 4,800   │ 🟢 Act │
│ AGT-P5Q8 │ +26095***ZZ  │ 0        │ 62%     │ 0       │ 🔴 Sus │
│ AGT-R2T6 │ +26094***WW  │ 3,100    │ 91%     │ 8,200   │ 🟡 Pro │
└─────────────────────────────────────────────────────────────────┘
```

**Agent Detail Slide-Out (on row click):**
```
┌─────────────────────────────────────────────┐
│ AGT-X7K9                          [CLOSE]  │
├─────────────────────────────────────────────┤
│ Registered: Aug 10, 2026 14:30             │
│ Device FP: fp_8f3a2b1c                     │
│ IP: 197.221.XXX.XXX (Zambia)              │
│                                             │
│ WALLETS                                     │
│ Primary: MTN +26097XXXXXXX (John D.)       │
│ Secondary: Airtel +26096XXXXXXX            │
│                                             │
│ PERFORMANCE                                 │
│ Success Rate: 94% (last 50 txns)           │
│ Avg Response: 38s                          │
│ Volume (24h): ZMW 12,400                   │
│ Disputes: 1 (resolved: player correct)     │
│                                             │
│ FLOAT LEDGER (Last 10)                      │
│ Aug 12 14:28 | DEP_OUT | -500 | Bal: 4,500│
│ Aug 12 14:15 | COMM     | +10  | Bal: 5,000│
│ Aug 12 10:30 | DEPOSIT  |+2,000| Bal: 4,990│
│ [View Full Ledger]                          │
│                                             │
│ ACTIONS                                     │
│ [Suspend] [Adjust Float] [Force Logout]     │
│ [Reset Password] [Ban + Seize Float]        │
└─────────────────────────────────────────────┘
```

#### 5.2.5 Disputes Queue
```
┌─────────────────────────────────────────────────────────────────┐
│ DISPUTES QUEUE                                                   │
│ Open: 8 │ Resolved Today: 23 │ Avg Resolution: 4h 12m          │
├─────────────────────────────────────────────────────────────────┤
│ ID      │ Txn Ref         │ Type          │ Filed    │ Priority│
│ DSP-041 │ TXN-20260812-38 │ Amount Mismat │ 2h ago   │ HIGH    │
│ DSP-040 │ TXN-20260812-22 │ No Payment    │ 5h ago   │ MED     │
│ DSP-039 │ TXN-20260811-91 │ Fraud Suspect │ 1d ago   │ HIGH    │
└─────────────────────────────────────────────────────────────────┘
```

**Dispute Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ DISPUTE DSP-041                                                  │
├──────────────────────────────┬──────────────────────────────────┤
│ TRANSACTION DETAILS        │ EVIDENCE                           │
│ Ref: TXN-20260812-0038     │ Player Proof: [Screenshot]         │
│ Agent: AGT-M3N2            │ Agent Note: "Received ZMW 450"     │
│ Requested: ZMW 500         │ Risk Score: 34/100                 │
│ Agent Confirmed: ZMW 450   │ Agent History: 87% success,        │
│ Player Claims: Sent 500    │   2 prior disputes (1 upheld)      │
│ Assigned: 14:28:01         │                                    │
│ Completed: 14:29:15        │                                    │
├──────────────────────────────┴──────────────────────────────────┤
│ RESOLUTION                                                       │
│ ○ Player Correct → Refund ZMW 50 from agent float; strike      │
│ ○ Agent Correct → Deny refund; notify player                   │
│ ○ Insufficient Evidence → Split 50/50; flag both               │
│ ○ Fraud Confirmed → Seize agent float; ban; full refund        │
│                                                                  │
│ Notes: [_____________________________________________]           │
│ [SUBMIT RESOLUTION]                                              │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.6 Risk Configuration Page
```
┌─────────────────────────────────────────────────────────────────┐
│ RISK RULES                                                       │
│ Last Updated: Aug 12, 09:00 by admin@platform                  │
│ [+ ADD RULE] [TEST AGAINST HISTORY] [ROLLBACK ▼]               │
├─────────────────────────────────────────────────────────────────┤
│ Rule Name          │ Trigger              │ Action    │ Status  │
│ New Agent Probation│ Age < 72h            │ Cap 5/hr  │ ✅ ON   │
│ Velocity Spike     │ >5 txns/10min        │ Pause 5m  │ ✅ ON   │
│ Amount Anomaly     │ >3σ from personal avg│ Flag      │ ✅ ON   │
│ Wallet Rotation    │ Change + high vol    │ Freeze 24h│ ✅ ON   │
│ Success Decay      │ <75% over 50 txns    │ Suspend   │ ✅ ON   │
│ Off-Hours Cap      │ 1AM-6AM local        │ 50% limit │ ✅ ON   │
│ Geo Mismatch       │ IP ≠ wallet country  │ Reduce cap│ ⚠️ OFF  │
└─────────────────────────────────────────────────────────────────┘
```

**Rule Editor Modal:**
```
┌─────────────────────────────────────────┐
│ EDIT RULE: Velocity Spike               │
├─────────────────────────────────────────┤
│ Trigger:                                │
│ Transactions > [5] in [10] minutes      │
│                                         │
│ Action:                                 │
│ [Pause ▼] for [5] minutes              │
│                                         │
│ Scope:                                  │
│ ○ All Agents  ● Exclude Platinum       │
│                                         │
│ Test Results (Last 30 Days):            │
│ Would have triggered: 47 times          │
│ True positives: 41 (87%)               │
│ False positives: 6 (13%)               │
│                                         │
│ [SAVE] [CANCEL]                         │
└─────────────────────────────────────────┘
```

#### 5.2.7 Audit Log Page
```
┌─────────────────────────────────────────────────────────────────┐
│ AUDIT LOG                                                        │
│ Filter: [Actor ▼] [Action ▼] [Date Range] Search: [________]  │
│ [EXPORT CSV]                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Timestamp           │ Actor      │ Action           │ Target    │
│ 2026-08-12 14:30:01 │ admin@plat │ Agent.Suspend    │ AGT-P5Q8  │
│ 2026-08-12 14:28:46 │ SYSTEM     │ Txn.Confirm      │ TXN-..045 │
│ 2026-08-12 14:15:00 │ SYSTEM     │ Float.Credit     │ AGT-X7K9  │
│ 2026-08-12 10:00:00 │ admin@plat │ Risk.RuleUpdate  │ VelSpike  │
│ 2026-08-12 09:30:00 │ AGT-X7K9   │ Wallet.Add       │ +26096..  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Models

```sql
CREATE TABLE agents (
    agent_code          VARCHAR(8) PRIMARY KEY,
    password_hash       VARCHAR(255) NOT NULL,
    recovery_key_hash   VARCHAR(255) NOT NULL,
    device_fingerprint  VARCHAR(64) NOT NULL,
    status              ENUM('ACTIVE','PROBATION','SUSPENDED','BANNED') DEFAULT 'PROBATION',
    float_balance       DECIMAL(18,2) DEFAULT 0,
    currency            VARCHAR(3) DEFAULT 'ZMW',
    success_rate        DECIMAL(5,4) DEFAULT 1.0,
    avg_response_sec    INT DEFAULT 0,
    total_txns          INT DEFAULT 0,
    registered_at       TIMESTAMPTZ DEFAULT NOW(),
    last_active_at      TIMESTAMPTZ
);

CREATE TABLE agent_wallets (
    id                  SERIAL PRIMARY KEY,
    agent_code          VARCHAR(8) REFERENCES agents(agent_code),
    wallet_type         VARCHAR(20) NOT NULL,
    wallet_number       VARCHAR(50) NOT NULL,
    holder_name         VARCHAR(100) NOT NULL,
    is_primary          BOOLEAN DEFAULT FALSE,
    bound_at            TIMESTAMPTZ DEFAULT NOW(),
    usable_after        TIMESTAMPTZ NOT NULL,
    UNIQUE(agent_code, wallet_number)
);

CREATE TABLE float_ledger (
    id                  BIGSERIAL PRIMARY KEY,
    agent_code          VARCHAR(8) REFERENCES agents(agent_code),
    txn_type            ENUM('DEPOSIT','PLAYER_DEPOSIT','COMMISSION','ADJUSTMENT','FORFEITURE'),
    amount              DECIMAL(18,2) NOT NULL,
    balance_after       DECIMAL(18,2) NOT NULL,
    reference_id        VARCHAR(64),
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id                  VARCHAR(16) PRIMARY KEY,
    player_id           VARCHAR(32) NOT NULL,
    agent_code          VARCHAR(8) REFERENCES agents(agent_code),
    type                ENUM('DEPOSIT') NOT NULL,
    requested_amount    DECIMAL(18,2) NOT NULL,
    confirmed_amount    DECIMAL(18,2),
    status              ENUM('PENDING','CONFIRMED','DENIED','EXPIRED','DISPUTED','RESOLVED'),
    risk_score          SMALLINT,
    player_proof        JSONB,
    agent_confirmation  JSONB,
    assigned_at         TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL
);

CREATE TABLE agent_sessions (
    session_token       VARCHAR(512) PRIMARY KEY,
    agent_code          VARCHAR(8) REFERENCES agents(agent_code),
    device_fingerprint  VARCHAR(64) NOT NULL,
    ip_address          INET,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    last_activity_at    TIMESTAMPTZ
);

CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    actor               VARCHAR(64) NOT NULL,
    action              VARCHAR(64) NOT NULL,
    target_type         VARCHAR(32),
    target_id           VARCHAR(64),
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/agent/register` | None | Create agent account |
| POST | `/api/agent/login` | None | Authenticate + issue session |
| POST | `/api/agent/recover` | None | Password reset via recovery key |
| GET | `/api/agent/dashboard` | Session | Initial dashboard state |
| WS | `/ws/agent` | Session | Real-time updates |
| POST | `/api/agent/wallets` | Session | Bind new wallet |
| DELETE | `/api/agent/wallets/:id` | Session | Remove wallet |
| PUT | `/api/agent/wallets/:id/primary` | Session | Set primary wallet |
| POST | `/api/agent/float/topup` | Session | Initiate float deposit |
| POST | `/api/agent/txn/:id/confirm` | Session | Confirm transaction |
| POST | `/api/agent/txn/:id/deny` | Session | Deny transaction |
| GET | `/api/player/deposit/instructions` | Player | Fetch matched agent wallet |
| POST | `/api/player/deposit/submit-proof` | Player | Submit payment proof |
| GET | `/api/admin/overview` | Admin | System health metrics |
| GET | `/api/admin/feed` | Admin | Live transaction stream |
| GET | `/api/admin/agents` | Admin | Agent list + filters |
| GET | `/api/admin/agents/:code` | Admin | Agent detail + history |
| POST | `/api/admin/agents/:code/suspend` | Admin | Suspend agent |
| POST | `/api/admin/agents/:code/ban` | Admin | Ban + seize float |
| POST | `/api/admin/agents/:code/adjust-float` | Admin | Manual float adjustment |
| GET | `/api/admin/disputes` | Admin | Dispute queue |
| POST | `/api/admin/disputes/:id/resolve` | Admin | Resolve dispute |
| GET | `/api/admin/risk/rules` | Admin | List risk rules |
| PUT | `/api/admin/risk/rules/:id` | Admin | Update risk rule |
| POST | `/api/admin/risk/test` | Admin | Simulate rule change |
| GET | `/api/admin/audit` | Admin | Audit log query |

---

## 8. Non-Functional Requirements

| Category | Requirement | Target |
| :--- | :--- | :--- |
| Latency | WebSocket message delivery | <300ms p95 |
| Latency | Dashboard initial load | <2s on 3G |
| Availability | Matching engine uptime | 99.5% |
| Concurrency | Simultaneous agent connections | 500+ |
| Security | Password storage | bcrypt (cost=12) |
| Security | Session tokens | JWT + HMAC-SHA256 |
| Security | Rate limiting | Per-IP + per-agent + global |
| Data | Ledger immutability | Append-only; no UPDATE/DELETE |
| Data | Backup frequency | Hourly incremental, daily full |
| Compliance | Audit log retention | 2 years minimum |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Agent fraud/theft | High | Critical | Float collateral; auto-suspend; forfeiture clause |
| Sybil attack | Medium | High | Device fingerprint; registration rate limit; probation |
| Credential theft | Medium | High | Device binding; single session; recovery key only reset |
| Player-agent collusion | Medium | Medium | Pairing frequency limits; round-trip detection |
| Regulatory action | High | Critical | Treat as temporary; build migration path |
| Float insolvency | Low | High | Caps; utilization monitoring; auto-pause |
| Recovery key loss | High | Medium | Clear UX warnings; 30-day float return policy |

---

## 10. Open Questions

| # | Question | Owner | Due Date |
| :--- | :--- | :--- | :--- |
| 1 | Minimum viable float amount for target market? | Product | Aug 15 |
| 2 | Device fingerprinting library selection? | Engineering | Aug 15 |
| 3 | Multi-currency support in v1.0? | Product | Aug 18 |
| 4 | Legal opinion on float forfeiture enforceability? | Legal | Aug 20 |
| 5 | Commission structure finalization? | Finance | Aug 18 |
| 6 | Admin RBAC roles beyond super-admin? | Product | Aug 22 |

---

## 11. Appendix

### A. Glossary
| Term | Definition |
| :--- | :--- |
| Float | Pre-deposited collateral held by platform |
| Probation | Initial 72-hour reduced-cap period for new agents |
| Recovery Key | One-time token for account recovery; replaces email/phone |
| Device Fingerprint | Hardware/software signature binding sessions to devices |
| Matching Engine | Algorithm assigning player requests to optimal agents |

### B. Revision History
| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-08-12 | Product Team | Initial draft |
| 1.1 | 2026-08-12 | Product Team | Added detailed wireframe descriptions for agent and admin dashboards |