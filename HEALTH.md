# Health

Live status check for all services your site actually uses.

```
GET https://vexa-ai.vercel.app/health
```

Checks the full Toolbaz auth flow (page reachability + token exchange) and the Stable Horde image pipeline (worker list + a real submitted-then-cancelled job).

---

## Response

```json
{
  "success": true,
  "status": "ok",
  "timestamp": 1740888000,
  "total_ms": 680,
  "checks": {
    "page": {
      "reachable": true,
      "status_code": 200,
      "latency_ms": 107
    },
    "token": {
      "reachable": true,
      "token_received": true,
      "status_code": 200,
      "latency_ms": 57
    },
    "image": {
      "reachable": true,
      "worker_count": 42,
      "model_count": 87,
      "top_models": ["Deliberate", "Dreamshaper", "Realistic Vision", "AbsoluteReality", "epiCRealism"],
      "job_submitted": true,
      "job_id": "abc123",
      "is_possible": true,
      "queue_position": 2,
      "estimated_wait_s": 14,
      "latency_ms": 516,
      "debug": { "..." : "..." }
    }
  }
}
```

`status` is `"ok"` when all three checks pass. Otherwise `"degraded"`.

---

## Checks

| Check | What it tests |
|-------|--------------|
| `page` | HTTP GET to the Toolbaz page — confirms the site is up |
| `token` | POST to the token endpoint with a real fingerprint — confirms auth works end-to-end for `/chat` |
| `image` | Fetches the Stable Horde worker list, submits a minimal generation job, checks queueability, then immediately cancels |

---

## Fields

| Field | Description |
|-------|-------------|
| `status` | `"ok"` if all checks pass, `"degraded"` otherwise |
| `timestamp` | Unix timestamp of the check |
| `total_ms` | Wall time for all checks combined |
| `checks.page.reachable` | Whether the Toolbaz page returned HTTP 200 |
| `checks.page.status_code` | Raw HTTP status from the page request |
| `checks.token.reachable` | Whether the token endpoint responded with HTTP 200 |
| `checks.token.token_received` | Whether a non-empty token was returned — the key signal for chat health |
| `checks.image.reachable` | Whether the Stable Horde workers endpoint was reachable |
| `checks.image.worker_count` | Number of online workers right now |
| `checks.image.model_count` | Number of distinct models across online workers |
| `checks.image.top_models` | Top 5 models by worker count |
| `checks.image.job_submitted` | Whether the test job was successfully queued |
| `checks.image.is_possible` | Whether any worker can handle the test job |
| `checks.image.queue_position` | Queue depth at time of check |
| `checks.image.estimated_wait_s` | Estimated seconds until processing begins |
| `checks.image.debug` | Raw diagnostic data from job submission and status check |