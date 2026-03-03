# Models

```
GET https://vexa-ai.vercel.app/models
```

Returns all available text models from Pollinations.AI, plus the top image models from Stable Horde. Cached for 5 minutes per serverless instance.

---

## Response

```json
{
  "success": true,
  "default": "openai",
  "models": {
    "openai": {
      "label": "GPT-4o",
      "provider": "OpenAI"
    },
    "openai-large": {
      "label": "GPT-4o Large",
      "provider": "OpenAI"
    },
    "llama": {
      "label": "Llama (fastest)",
      "provider": "Meta"
    }
  },
  "image_models": [
    { "name": "Deliberate", "count": 42, "queued": 5 },
    { "name": "AlbedoBase XL 3.1", "count": 38, "queued": 2 },
    { "name": "Dreamshaper", "count": 31, "queued": 8 }
  ]
}
```

### Text model fields

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Human-readable display name |
| `provider` | string | Company or team behind the model |

### Image model fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Exact model name — pass this to `/image?model=` or `/image` POST body |
| `count` | number | Number of active workers serving this model right now |
| `queued` | number | Jobs currently queued for this model |

---

## Text Models

Text models are fetched live from Pollinations.AI — always use `/models` for the authoritative list. Known models:

| Model ID | Provider | Notes |
|----------|----------|-------|
| `openai` | OpenAI | GPT-4o — default |
| `openai-large` | OpenAI | GPT-4o Large |
| `openai-reasoning` | OpenAI | o1 reasoning model |
| `mistral` | Mistral AI | Mistral latest |
| `llama` | Meta | Fastest option |
| `deepseek` | DeepSeek | DeepSeek latest |
| `deepseek-r1` | DeepSeek | Reasoning variant |
| `claude-hybridspace` | Anthropic | Claude hybrid |
| `searchgpt` | OpenAI | Web-search enabled |

> This table may go stale. Use `/models` for live data.

---

## Image Models

Image models are fetched live from Stable Horde, sorted by active worker count. Models with more workers have shorter queue times. `Deliberate` is used as the default.

Pass the exact `name` string to `/image?model=` or the `model` field in a POST body.

> If you pass a model name with no available workers (`count: 0`), the `/image` request fails immediately with a `502` rather than waiting in queue. Always check `count` before choosing a model.

---

## Caching

Both text and image model lists are cached for **5 minutes** per serverless instance. Vercel may spin up multiple instances so different requests may see slightly different cached states.

---

## Errors

```json
{ "success": false, "error": "Failed to fetch models" }
```

| Status | Cause |
|--------|-------|
| `502` | Pollinations.AI unreachable — falls back to hardcoded model list |