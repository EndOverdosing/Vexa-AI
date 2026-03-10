# Models

```
GET https://vexa-ai.vercel.app/models
```

Returns all available text models scraped live from Toolbaz, and live image models from Stable Horde. Cached for 5 minutes per serverless instance.

---

## Response

```json
{
  "success": true,
  "default": "toolbaz-v4.5-fast",
  "models": {
    "toolbaz-v4.5-fast": { "label": "ToolBaz-v4.5-Fast", "provider": "ToolBaz",  "speed": 250, "quality": 90 },
    "gemini-2.5-pro":    { "label": "Gemini-2.5-Pro",    "provider": "Google",   "speed": 50,  "quality": 84 },
    "deepseek-v3.1":     { "label": "Deepseek-V3.1",     "provider": "DeepSeek", "speed": 295, "quality": 80 }
  },
  "image_models": [
    { "name": "Deliberate",  "count": 4 },
    { "name": "Dreamshaper", "count": 3 }
  ]
}
```

---

## Text Models

Text models are **scraped live from Toolbaz** on every cache miss — there is no hardcoded list. Each model includes a display label, provider, speed in words per second, and a quality score sourced directly from the Toolbaz UI.

Use `GET /models` to discover what's currently available. The model list changes as Toolbaz adds or removes models.

### Text model fields

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Display name from Toolbaz |
| `provider` | string | Company behind the model (Google, OpenAI, Anthropic, etc.) |
| `speed` | number | Processing speed in words per second |
| `quality` | number | Quality score (0–100) as shown on Toolbaz |

### Default model

`toolbaz-v4.5-fast` — used when no `model` param is specified. Falls back to first available model if not present in the scraped list.

---

## Image Models

Fetched live from Stable Horde workers endpoint, filtered to online workers only, ranked by worker count descending. Top 30 returned.

If the workers endpoint fails, falls back to the Stable Horde model reference API.

Pass the exact `name` to `/image?model=` or the `model` POST body field.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Exact model name to pass to `/image` |
| `count` | number | Active workers right now (0 if sourced from fallback reference) |

---

## Caching

Both lists cached for **5 minutes** per serverless instance.

If upstream is unreachable, falls back to last successful cache or empty defaults:

```json
{ "success": true, "default": "toolbaz-v4.5-fast", "models": {}, "image_models": [] }
```