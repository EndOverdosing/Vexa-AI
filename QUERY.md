# Query

Send a single prompt to any available AI model and get a text response. Supports an optional system prompt for personas and instructions.

```
GET  https://vexa-ai.vercel.app/query
POST https://vexa-ai.vercel.app/query
```

---

## GET

```bash
curl "https://vexa-ai.vercel.app/query?q=What+is+a+black+hole"
```

### Parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` | yes | — | Your prompt. Also accepted as `query`. |
| `model` | no | `openai` | Model ID. See [`/models`](./MODELS.md). |
| `system` | no | — | System prompt prepended before your message. Sets persona or instructions. |

```bash
# With model and system prompt
curl "https://vexa-ai.vercel.app/query?q=Hello&model=llama&system=You+are+a+pirate.+Respond+only+in+pirate+speak."
```

---

## POST

```bash
curl -X POST https://vexa-ai.vercel.app/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing", "model": "openai-large"}'
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `q` / `query` / `prompt` | yes | Your prompt |
| `model` | no | Model ID |
| `system` | no | System prompt — sets persona or instructions |

```bash
# With system prompt
curl -X POST https://vexa-ai.vercel.app/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What should I have for dinner?",
    "model": "mistral",
    "system": "You are a professional chef who only recommends Italian food."
  }'
```

---

## Response

```json
{
  "success": true,
  "response": "A black hole is a region of spacetime where gravity is so strong that nothing — not even light — can escape once it crosses the event horizon.",
  "model": "openai",
  "elapsed_ms": 820,
  "prompt_chars": 87
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | `true` on success |
| `response` | string | The model's reply |
| `model` | string | Model ID that was used |
| `elapsed_ms` | number | Total round-trip time in milliseconds |
| `prompt_chars` | number | Character count of the prompt sent |

---

## System Prompt

The `system` field lets you give the model a persona or standing instructions without including them in every user message.

```bash
curl -X POST https://vexa-ai.vercel.app/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is 2 + 2?",
    "system": "You are a dramatic mathematician. Answer every question as if it is the most profound thing you have ever encountered."
  }'
```

> For multi-turn conversations with persistent system instructions, use [`/chat`](./CHAT.md) instead.

---

## Examples

### JavaScript

```js
const res = await fetch('https://vexa-ai.vercel.app/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Hello!',
    model: 'openai',
    system: 'You are a helpful assistant. Be concise.'
  })
});
const data = await res.json();
console.log(data.response);
console.log(`${data.elapsed_ms}ms — ${data.prompt_chars} chars`);
```

### Python

```python
import requests

r = requests.post('https://vexa-ai.vercel.app/query', json={
    'prompt': 'What is a neural network?',
    'model': 'deepseek',
    'system': 'Explain everything as if to a 10-year-old.'
})
d = r.json()
print(d['response'])
print(f"{d['elapsed_ms']}ms, {d['prompt_chars']} chars sent")
```

---

## Limits

| Limit | Value |
|-------|-------|
| Max prompt length | 16000 characters |
| Rate limit | 20 requests / IP / 60s |
| Timeout | 30s |

---

## Errors

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `Missing required parameter: q, query, or prompt` | No prompt provided |
| `400` | `Prompt exceeds maximum length of 16000 characters` | Prompt too long |
| `429` | `Rate limit exceeded. Try again shortly.` | Too many requests |
| `502` | `Upstream request failed` | Pollinations.AI unreachable or errored |
| `500` | `Internal server error` | Unexpected failure |