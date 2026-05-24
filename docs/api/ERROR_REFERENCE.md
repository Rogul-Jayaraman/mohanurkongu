# Error Reference

## Error Response Shape

All API errors follow a consistent shape:

```json
{
  "error": "string"
}
```

## Error Codes by Endpoint

### POST /auth/send-otp
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Validation error"` | Missing/invalid email or type |
| 400 | `"Email is required"` | No email provided |
| 429 | Too Many Requests | Rate limit exceeded (10/15m) |

### POST /auth/verify-otp
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Invalid OTP"` | OTP doesn't match |
| 400 | `"OTP expired"` | Verification record expired |
| 400 | `"Too many attempts"` | Max 5 attempts exceeded |
| 429 | Too Many Requests | Rate limit exceeded (10/15m) |

### POST /auth/signup
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Validation error"` | Missing/invalid fields |
| 400 | `"Invalid or expired token"` | Bad verification token |
| 409 | `"Email already registered"` | Duplicate email |
| 429 | Too Many Requests | Rate limit exceeded (10/15m) |

### POST /auth/login
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Validation error"` | Missing/invalid fields |
| 401 | `"Invalid email or password"` | Wrong credentials |
| 401 | `"Account is not a valid USER account"` | Portal role mismatch |
| 429 | Too Many Requests | Rate limit exceeded (10/15m) |
| **BUG-MED-004**: portal check only applies when portal is present in request. |

### POST /auth/refresh
| HTTP | error | Cause |
|---|---|---|
| 401 | `"Invalid refresh token"` | Bad/expired/revoked token |
| 429 | Missing rate limiter (BUG-HIGH-003) |

### POST /auth/logout
| HTTP | error | Cause |
|---|---|---|
| 401 | `"Invalid refresh token"` | Bad token |
| 429 | Missing rate limiter (BUG-HIGH-003) |

### POST /auth/logout-all
| HTTP | error | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | No valid auth |
| 429 | Too Many Requests | Rate limit exceeded (5/15m) |

### POST /auth/forgot-password
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Email is required"` | No email |
| 400 | `"Account not found"` | Email not registered |
| 429 | Too Many Requests | Rate limit exceeded (5/15m) |

### POST /auth/verify-password-otp
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Invalid OTP"` | Wrong OTP |
| 400 | `"OTP expired"` | Expired |
| 400 | `"Too many attempts"` | Max 5 exceeded |
| 429 | Too Many Requests | Rate limit exceeded (10/15m) |

### POST /auth/reset-password
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Validation error"` | Missing/invalid fields |
| 400 | `"Passwords do not match"` | password !== confirmPassword |
| 400 | `"Invalid or expired token"` | Bad reset token |
| 429 | Missing rate limiter |

### POST /auth/change-password
| HTTP | error | Cause |
|---|---|---|
| 400 | `"Current password is incorrect"` | Wrong current password |
| 400 | `"Validation error"` | Missing/invalid fields |
| 401 | `"Unauthorized"` | No valid auth |
| 429 | Too Many Requests | Rate limit exceeded (5/15m) |

### GET /auth/me
| HTTP | error | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | No valid access token |

### Global Errors
| HTTP | error | Cause |
|---|---|---|
| 500 | `"Internal Server Error"` | Unhandled exception |
| 413 | Payload Too Large | Request body exceeds limit |
| 404 | Route not found | Undefined endpoint |

## Rate Limit Response

```json
{
  "error": "Too many requests, please try again later."
}
```

Headers sent:
- `Retry-After: <seconds>`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
