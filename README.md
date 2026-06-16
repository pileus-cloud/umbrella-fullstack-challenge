# Umbrella FinOps — Fullstack Challenge

A working starter application for the Umbrella FinOps fullstack interview challenge.
See **[CHALLENGE.md](./CHALLENGE.md)** for requirements.

---

## Prerequisites

- Node.js 22+
- PostgreSQL 17+ running locally

---

## Quick Start

### 1. Create the database

```bash
createdb umbrella_challenge
```

### 2. API setup

```bash
cd api
cp .env.example .env       # Review and adjust DATABASE_URL if needed
npm install
npm run migrate            # Creates tables and seed data
npm run dev                # Starts on http://localhost:3001
```

### 3. Frontend setup

```bash
cd web
npm install
npm run dev                # Starts on http://localhost:5173
```

Open http://localhost:5173, paste a token from `sample-data/sample-tokens.md`, and select a customer org.

---

## Verify the starter is working

```bash
# Health check (no auth)
curl http://localhost:3001/health

# List accessible orgs (auth required, no customer org header needed)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LWFkbWluLW1zcCIsIm9yZ0lkIjoibXNwX3N1bW1pdF9maW5vcHMiLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NzQ0NzA2MzYsImV4cCI6MTgwNjAwNjYzNn0.qEDQSbynLGB_1vtaTMeRW7s85npuzIwh01tlp_FyP2g"

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/organizations

# Expect:
# { "items": [ { "id": "cust_northwind_health", ... }, ... ] }

# Missing token → 401
curl http://localhost:3001/api/v1/organizations

# Missing grant → 403
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Customer-Organization-Id: cust_unknown_corp" \
     http://localhost:3001/api/v1/usage-cost-records
```

---

## Sample tokens

See **[sample-data/sample-tokens.md](./sample-data/sample-tokens.md)** for pre-generated JWTs.

| Token | Org | Role | Can access |
|-------|-----|------|-----------|
| `MSP_ADMIN` | `msp_summit_finops` | admin | All 3 customer orgs |
| `CUSTOMER_VIEWER` | `cust_northwind_health` | viewer | Own org only |
| `CUSTOMER_ADMIN` | `cust_contoso_retail_eu` | admin | Own org only |

---

## After implementing the bulk endpoint — seed sample records

```bash
cd api
export MSP_ADMIN_TOKEN="<token from sample-tokens.md>"
npm run seed:records
```

Expected output:
```
Seed results:
  ✓ cust_northwind_health: ingested=2, deduplicated=0
  ✓ cust_contoso_retail_eu: ingested=2, deduplicated=0
  ✓ cust_tailspin_broadcasting: ingested=2, deduplicated=0
  ✗ cust_unknown_corp: 403: No customer_access_grants row ...
```

The trap record (`cust_unknown_corp`) should always fail with 403.

---

## What's pre-built

| Component | Location | Description |
|-----------|----------|-------------|
| Auth middleware | `api/src/middlewares/authenticator.ts` | JWT validation, populates `res.locals.cloudOptions` |
| Grant checker | `api/src/middlewares/grantChecker.ts` | Verifies `customer_access_grants`, sets `customerOrgId` |
| Router wrapper | `api/src/middlewares/routerWrapper.ts` | Async error handling + role checks |
| Custom errors | `api/src/middlewares/errors.ts` | `BadRequestParamsError`, `ForbiddenError`, etc. |
| Base model | `api/src/utils/Model.ts` | Provides `this.customerOrgId` and `this.pool` |
| Organizations module | `api/src/organizations/` | Full reference implementation (router → controller → service → model) |
| API client | `web/src/api/client.ts` | Axios with auto-injected auth + org headers |
| Org switcher | `web/src/components/OrgSwitcher.tsx` | Calls `/organizations`, stores selected org |

## What you implement

Add files under:
- `api/src/` — your backend modules (usage-cost-records, governance-tag-rules, allocation)
- `web/src/pages/` — your frontend view (Allocation Overview)

The implemented API routers are mounted in `api/src/app/routes.ts`.

See **[CHALLENGE.md](./CHALLENGE.md)** for full requirements and optional bonus items.

---

## Architecture overview

```
Request
  └── authenticator.ts     — validates JWT, sets res.locals.cloudOptions
       └── grantChecker.ts — verifies grant, sets cloudOptions.customerOrgId
            └── routerWrapper.ts — role check + async error handling
                 └── controller → service → model (your code)
                                              └── Model base class
                                                  MUST scope all queries to this.customerOrgId
```

### The cloudOptions pattern

Every controller, service, and model receives `res.locals.cloudOptions`:

```typescript
interface CloudOptions {
  operatorOrgId: string;  // from JWT
  customerOrgId: string;  // from X-Customer-Organization-Id header (verified)
  userSub: string;
  roles: string[];
  pool: Pool;             // PostgreSQL connection pool
  requestId: string;
}
```

### Model pattern

Extend `Model` and use `this.customerOrgId` in every query:

```typescript
// api/src/governance-tags/my-feature.model.ts
import { Model, CloudOptions } from '../utils/Model';

export class MyFeatureModel extends Model {
  constructor(cloudOptions: CloudOptions) {
    super(cloudOptions);
  }

  async getRecords() {
    // ✅ Correct — scoped to customer org
    return this.query(
      'SELECT * FROM usage_cost_records WHERE organization_id = $1',
      [this.customerOrgId]
    );
    // ❌ Wrong — missing org scope, tenant isolation violation
    // return this.query('SELECT * FROM usage_cost_records');
  }
}
```

### Router pattern

```typescript
// api/src/governance-tags/my-feature.router.ts
import { createRouter } from '../middlewares/routerWrapper';
import * as controller from './my-feature.controller';

const { router, get, post, patch } = createRouter();

get('/', controller.list);
post('/', controller.create, { roles: ['admin'] });
patch('/:id', controller.update, { roles: ['admin'] });

export default router;
```

---

## Environment variables

```env
PORT=3001
DATABASE_URL=postgresql://localhost/umbrella_challenge
JWT_SECRET=super-secret-challenge-key-change-in-prod
```

---

## External API

[frankfurter.dev](https://api.frankfurter.dev) — free, no API key, historical exchange rates (v2).

```bash
# Get EUR→USD rate for a specific date
curl "https://api.frankfurter.dev/v2/rate/EUR/USD/2026-03-03"
# {"date":"2026-03-03","base":"EUR","quote":"USD","rate":1.1656}
```

The `rate` field is the multiplier: `amount_in_USD = amount_in_EUR * rate`.
Cache results in the `exchange_rate_cache` table (already in the schema).

---

## Implemented Challenge Features

- `POST /api/v1/usage-cost-records/bulk` ingests records for the verified customer org, applies the highest-priority enabled matching governance rule, and treats duplicate `(externalId, organizationId)` records as deduplicated.
- `GET /api/v1/usage-cost-records` lists records with pagination, date filters, and governance tag filters.
- `GET|POST|PATCH /api/v1/governance-tag-rules` plus `POST /:id/disable` manages rules inside the active customer org.
- `GET /api/v1/allocation/summary` groups totals by governance tag, converts by each record's historical usage date when `baseCurrency` is supplied, caches external exchange rates, and returns warnings with original-currency fallback if conversion fails.
- `web/src/pages/AllocationOverview.tsx` renders the allocation summary for the currently selected org.
- `web/src/pages/RulesManagement.tsx` renders a governance rules management view; admins can create/edit/disable rules, viewers get a read-only list.

### Design Notes

- All customer-scoped model queries include `organization_id = $1` or write `organization_id` from `this.customerOrgId`; routers are mounted after `grantChecker`.
- Rule matching is done once per bulk request against enabled `exact` and `contains` rules ordered by `priority DESC, updated_at DESC`; ingested records store an `explainability` JSON object.
- Historical currency conversion uses cached rates first. If frankfurter.dev cannot provide a requested uncached rate, that record's amount is left in its original currency and the response includes a `warnings` array.
- AI tool used: OpenAI Codex.
- Manual verification focused on grant enforcement, the trap org, idempotent ingestion, priority matching, explainability, graceful FX fallback, date-scoped listing, and converted allocation totals.

### Sample Requests

```bash
cd api
set -a; source .env; set +a

# Seed sample records; the trap org should remain 403.
npm run seed:records

# List records for Northwind.
curl -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_northwind_health" \
     "http://localhost:3001/api/v1/usage-cost-records?from=2026-03-01&to=2026-03-31&page=1&pageSize=10"

# List rules for the selected customer org.
curl -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_northwind_health" \
     "http://localhost:3001/api/v1/governance-tag-rules"

# Create a contains rule.
curl -X POST "http://localhost:3001/api/v1/governance-tag-rules" \
     -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_tailspin_broadcasting" \
     -H "Content-Type: application/json" \
     -d '{"name":"Tag production","matchType":"contains","fieldName":"nativeTags","pattern":"production","targetTagKey":"Lifecycle","targetTagValue":"Production"}'

# Allocation summary with historical conversion to USD.
curl -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_contoso_retail_eu" \
     "http://localhost:3001/api/v1/allocation/summary?from=2026-03-01&to=2026-03-31&baseCurrency=USD"

# Graceful FX fallback example: returns 200 with warnings.
curl -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_northwind_health" \
     "http://localhost:3001/api/v1/allocation/summary?from=2026-03-01&to=2026-03-31&baseCurrency=ZZZ"

# Tenant isolation check: must return 403.
curl -H "Authorization: Bearer $MSP_ADMIN_TOKEN" \
     -H "X-Customer-Organization-Id: cust_unknown_corp" \
     "http://localhost:3001/api/v1/usage-cost-records"
```

Open http://localhost:5173 and use the navigation tabs to switch between Allocation and Governance Rules.
