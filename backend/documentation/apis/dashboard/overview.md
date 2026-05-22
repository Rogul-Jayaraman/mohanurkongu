# 1. Context

- Feature: User Dashboard
- UI Screen: Dashboard (/dashboard)
- Component: Dashboard.tsx
- Trigger: Page Load

Rule:
- API maps to exact UI state (Featured Brides, Featured Grooms, Subscription Info)

# 2. API Definition

- Type: Aggregated
- Method: GET
- Endpoint: /api/dashboard/overview

# 3. Ownership

- Level: Page
- Reason: The dashboard page requires a consolidated view of matches and account status.

# 4. Request Contract

## Query Params
None

## Body
None

# 5. Response Contract

## Standard Envelope
```json
{
  "success": true,
  "data": {
    "brideProfiles": [],
    "groomProfiles": [],
    "stats": {}
  },
  "message": "Dashboard data fetched successfully"
}
```

## Data Shape

| Field | Type | Description |
|---|---|---|
| brideProfiles | ProfileSummary[] | List of featured female profiles |
| groomProfiles | ProfileSummary[] | List of featured male profiles |
| stats | object | Summary statistics for the dashboard |

# 6. Axios Layer Definition

- Instance: `@/lib/api`
- Method: `api.get('/dashboard/overview')`

# 7. API Function (Frontend)

```typescript
const fetchDashboardOverview = async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
};
```

# 8. TanStack Query Layer

- Query Key: `['dashboard', 'overview']`
- Stale Time: 60000ms (1 minute)

# 9. UI Mapping

| UI Field | API Field |
|---|---|
| Featured Brides | data.brideProfiles |
| Featured Grooms | data.groomProfiles |

# 10. Example Request & Response

## Request
`GET /api/dashboard/overview`

## Response
```json
{
  "success": true,
  "data": {
    "brideProfiles": [...],
    "groomProfiles": [...],
    "stats": {
      "totalProfiles": 1500,
      "matches": 45
    }
  }
}
```
