# Browse Profiles List API

# 1. Context

- Feature: Profile Browsing
- UI Screen: Browse Profiles, Search Results, Shortlist, Dashboard
- Component: ProfileCard, ProfileGrid
- Trigger: Page Load, Search, Scroll (Pagination)

Rule:
- API must map to exact UI state

# 2. API Definition

- Type: List
- Method: GET
- Endpoint: /api/profiles/browse

Rule:
- One API = one type only
- Must follow versioning

# 3. Ownership

- Level: Page
- Reason: The Browse Profiles page manages the grid and filters.

# 4. Request Contract

## Query Params

| Field | Type | Required | Description |
|---|---|---|---|
| page | number | No | Page number for pagination |
| limit | number | No | Records per page (default 20) |
| gender | string | No | Filter by gender |
| search | string | No | Name or RegNo search |
| ... | ... | ... | Filter specific parameters |

## Body

None

# 5. Response Contract

## Standard Envelope

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Data Shape (MINIMUM_PROFILE_SELECT)

| Field | Type | Description |
|---|---|---|
| id | string | UUID of the profile |
| regNo | string | Registration number |
| fullnameEn | string | Name in English |
| fullnameTa | string | Name in Tamil |
| age | number | Calculated age |
| education | string | Highest education |
| community | string | Community name |
| profession | string | Primary occupation |
| jobDetail | string | Secondary occupation/detail |
| currentDistrictEn | string | Current residential district |
| currentCityEn | string | Current residential city |
| profilePhoto | string | Cloudinary URL |
| isOwner | boolean | Derived: If profile belongs to requester |
| isShortlisted | boolean | Derived: If requester has shortlisted this |

# 6. UI Mapping

| UI Field | API Field |
|---|---|
| Name | fullnameEn / fullnameTa |
| Age | age |
| Education | education |
| Community | community |
| Job | profession |
| Location | currentLocation (derived from district/city) |
| Shortlist Icon | isShortlisted |

# 7. Example Request & Response

## Request

`GET /api/profiles/browse?page=1&limit=1`

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "regNo": "...",
      "fullnameEn": "...",
      "age": 25,
      "education": "BE",
      "community": "Kongu Vellalar",
      "profession": "Software Engineer",
      "isShortlisted": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "total": 1000,
    "totalPages": 1000
  }
}
```
