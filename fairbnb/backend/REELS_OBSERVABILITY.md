# FairBnB Reels — Production Observability & Monitoring Guide

## Overview
This document outlines the observability architecture, structured log formats, operational metrics, diagnostic health endpoints, and alert signals for FairBnB Reels.

---

## 1. Request Correlation (`X-Request-ID`)
All HTTP requests to the backend pass through `LoggingInterceptor`, which assigns or forwards a request correlation ID (`X-Request-ID` header).
- Header Name: `X-Request-ID`
- Format: `req_[hex]` (e.g. `req_a1b2c3d4e5f6`)
- Response: Every backend HTTP response includes the `X-Request-ID` header.

---

## 2. Structured Log Formats (JSON)

### HTTP Request Latency Log (`http.request.completed`)
```json
{
  "event": "http.request.completed",
  "requestId": "req_a1b2c3d4e5f6",
  "method": "GET",
  "url": "/reels?limit=10",
  "statusCode": 200,
  "durationMs": 18,
  "latencyBucket": "<50ms",
  "timestamp": "2026-09-20T23:35:00.000Z"
}
```

### Latency Buckets
- `<50ms`: Fast feed response
- `50-100ms`: Acceptable load
- `100-250ms`: Moderate DB/Network latency
- `250-500ms`: Elevated load warning
- `500ms+`: Slow feed query investigation required

### Rate Limit Exceeded Log (`reel.ratelimit.exceeded`)
```json
{
  "event": "reel.ratelimit.exceeded",
  "requestId": "req_f6e5d4c3b2a1",
  "routePrefix": "likeReel",
  "identifierType": "userId",
  "limit": 30,
  "windowSeconds": 60,
  "retryAfter": 45,
  "timestamp": "2026-09-20T23:35:05.000Z"
}
```

### Analytics Buffer Flush Log (`analytics.buffer.flushed`)
```json
{
  "event": "analytics.buffer.flushed",
  "bufferLength": 45,
  "flushedCount": 45,
  "durationMs": 12,
  "timestamp": "2026-09-20T23:35:10.000Z"
}
```

---

## 3. Health & Readiness Endpoint (`GET /health`)
- Endpoint: `GET /health`
- Purpose: Non-destructive readiness check for load balancers and container orchestrators.
- Response Structure:
```json
{
  "status": "ok",
  "service": "fairbnb-backend",
  "timestamp": "2026-09-20T23:35:15.000Z",
  "reels": {
    "database": "connected",
    "cloudinaryConfigured": true
  }
}
```

---

## 4. Operational Alert Conditions (Conceptual)
1. **Webhook Processing Failure Spike**: Sudden increase in Cloudinary webhook rejection or FAILED status transitions.
2. **Elevated Feed Latency**: `p95` feed latency exceeding `250ms`.
3. **Analytics Buffer Backpressure**: Event buffer accumulating continuously without flushing.
4. **Rate Limit Spike**: High concentration of 429 Too Many Requests responses.

---

## 5. Security & Secret Safety Rules
- `CLOUDINARY_API_SECRET` must **NEVER** be logged, returned in API payloads, or exposed to the client.
- JWT tokens, passwords, and authorization header values are stripped from diagnostic logs.
