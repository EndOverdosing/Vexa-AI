# Query

Send a single prompt to any available Toolbaz AI model and get a text response.

```
GET  https://vexa-ai.vercel.app/query
POST https://vexa-ai.vercel.app/query
```

---

## GET

```bash
curl "https://vexa-ai.vercel.app/query?q=What+is+a+black+hole"
curl "https://vexa-ai.vercel.app/query?q=Hello&model=gemini-2.5-pro"
```

### Parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` / `query` | yes | — | Your prompt |
| `model` | no | `toolbaz-v4.5-fast` | Model ID. See [`/models`](./MODELS.md). |

---

## POST

```bash
curl -X POST https://vexa-ai.vercel.app/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing", "model": "deepseek-v3.1"}'
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `q` / `query` / `prompt` | yes | Your prompt |
| `model` | no | Model ID |

---

## Response

```json
{
  "success": true,
  "response": "A black hole is a region of spacetime...",
  "model": "toolbaz-v4.5-fast",
  "elapsed_ms": 1243
}
```

---

## Examples

### JavaScript

```js
const res = await fetch('https://vexa-ai.vercel.app/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello!', model: 'gpt-5' })
});
const data = await res.json();
console.log(data.response);
```

### Python

```python
import requests
r = requests.post('https://vexa-ai.vercel.app/query', json={
    'prompt': 'What is a neural network?',
    'model': 'deepseek-v3.1',
})
print(r.json()['response'])
```

---

## Limits

| Limit | Value |
|-------|-------|
| Max prompt length | 4,000 characters |
| Rate limit | 20 requests / IP / 60s |
| Upstream timeout | 55s |
| Retries | 3 with exponential backoff |

---

## Errors

| Status | Error |
|--------|-------|
| `400` | `Missing required parameter: q, query, or prompt` |
| `400` | `Prompt exceeds maximum length of 4000 characters` |
| `400` | `Unknown model 'xyz'` + `valid_models` array |
| `429` | `Rate limit exceeded. Try again shortly.` |
| `502` | `Upstream request failed` |
| `500` | `Internal server error` |