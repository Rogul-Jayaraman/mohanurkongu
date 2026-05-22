# Login API

## 1. Context

- Feature: Authentication
- UI Screen: Login Page
- Trigger: Click Login button
- Component: LoginForm

## 2. API Definition

- Method: POST
- Endpoint: /api/auth/login
- Auth: None (Public)

## 3. Request Contract

### Body
| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

## 4. Response Contract

### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "plan": "FREE"
    }
  }
}
```

### Error (401 Unauthorized)
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Invalid email or password"
}
```

## 5. UI Mapping
| UI Field | API Field |
|---|---|
| Email Input | email |
| Password Input | password |
| Success Redirect | /dashboard |
| Error Message | message |
