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
    "toolbaz-v4.5-fast": {
      "label": "ToolBaz-v4.5-Fast",
      "provider": "",
      "speed": 250,
      "quality": 90
    },
    "deepseek-v3.1": {
      "label": "Deepseek-V3.1",
      "provider": "",
      "speed": 295,
      "quality": 80
    },
    "gemini-3-flash": {
      "label": "Gemini-3-Flash",
      "provider": "",
      "speed": 60,
      "quality": 94
    },
    "L3-70B-Euryale-v2.1": {
      "label": "L3-Euryale-v2.1",
      "provider": "",
      "speed": 95,
      "quality": 75
    },
    "gemini-3.1-flash-lite": {
      "label": "Gemini-3.1-Flash-Lite",
      "provider": "Google",
      "speed": 120,
      "quality": 60
    },
    "gemini-2.5-pro": {
      "label": "Gemini-2.5-Pro",
      "provider": "Google",
      "speed": 50,
      "quality": 84
    },
    "gemini-2.5-flash": {
      "label": "Gemini-2.5-Flash",
      "provider": "Google",
      "speed": 110,
      "quality": 79
    },
    "deepseek-v3": {
      "label": "DeepSeek-V3",
      "provider": "DeepSeek",
      "speed": 295,
      "quality": 78
    },
    "deepseek-r1": {
      "label": "Deepseek-R1-Distill",
      "provider": "DeepSeek",
      "speed": 110,
      "quality": 70
    },
    "gpt-5.2": {
      "label": "GPT‑5.2",
      "provider": "OpenAI",
      "speed": 60,
      "quality": 92
    },
    "gpt-5": {
      "label": "GPT-5",
      "provider": "OpenAI",
      "speed": 60,
      "quality": 85
    },
    "gpt-oss-120b": {
      "label": "GPT-OSS-120B",
      "provider": "OpenAI",
      "speed": 940,
      "quality": 79
    },
    "o3-mini": {
      "label": "O3-Mini",
      "provider": "OpenAI",
      "speed": 120,
      "quality": 85
    },
    "gpt-4o-latest": {
      "label": "GPT-4o (latest)",
      "provider": "OpenAI",
      "speed": 89,
      "quality": 80
    },
    "claude-sonnet-4": {
      "label": "Claude-Sonnet-4",
      "provider": "Anthropic",
      "speed": 60,
      "quality": 90
    },
    "grok-4-fast": {
      "label": "Grok-4-Fast",
      "provider": "xAI",
      "speed": 180,
      "quality": 82
    },
    "toolbaz_v4": {
      "label": "ToolBaz-v4",
      "provider": "ToolBaz",
      "speed": 150,
      "quality": 82
    },
    "Llama-4-Maverick": {
      "label": "Llama-4-Maverick",
      "provider": "Facebook (Meta)",
      "speed": 335,
      "quality": 82
    },
    "midnight-rose": {
      "label": "Midnight-Rose",
      "provider": "Facebook (Meta)",
      "speed": 110,
      "quality": 72
    },
    "unfiltered_x": {
      "label": "Unfiltered_X (8x22b)",
      "provider": "Facebook (Meta)",
      "speed": 85,
      "quality": 76
    }
  },
  "image_models": [
    {
      "name": "stable_diffusion",
      "count": 10
    },
    {
      "name": "Deliberate",
      "count": 8
    },
    {
      "name": "ICBINP - I Can't Believe It's Not Photography",
      "count": 7
    },
    {
      "name": "AbsoluteReality",
      "count": 6
    },
    {
      "name": "Nova Anime XL",
      "count": 5
    },
    {
      "name": "AlbedoBase XL 3.1",
      "count": 5
    },
    {
      "name": "Dreamshaper",
      "count": 5
    },
    {
      "name": "AlbedoBase XL (SDXL)",
      "count": 4
    },
    {
      "name": "WAI-NSFW-illustrious-SDXL",
      "count": 4
    },
    {
      "name": "AbyssOrangeMix-AfterDark",
      "count": 4
    },
    {
      "name": "Anything Diffusion",
      "count": 4
    },
    {
      "name": "NeverEnding Dream",
      "count": 4
    },
    {
      "name": "ChilloutMix",
      "count": 4
    },
    {
      "name": "Hentai Diffusion",
      "count": 4
    },
    {
      "name": "Grapefruit Hentai",
      "count": 4
    },
    {
      "name": "Realistic Vision",
      "count": 4
    },
    {
      "name": "Sci-Fi Diffusion",
      "count": 4
    },
    {
      "name": "Analog Madness",
      "count": 4
    },
    {
      "name": "majicMIX realistic",
      "count": 4
    },
    {
      "name": "Abyss OrangeMix",
      "count": 4
    },
    {
      "name": "BB95 Furry Mix v14",
      "count": 4
    },
    {
      "name": "CyberRealistic Pony",
      "count": 3
    },
    {
      "name": "NTR MIX IL-Noob XL",
      "count": 3
    },
    {
      "name": "WAI-CUTE Pony",
      "count": 3
    },
    {
      "name": "Juggernaut XL",
      "count": 3
    },
    {
      "name": "WAI-ANI-NSFW-PONYXL",
      "count": 3
    },
    {
      "name": "AMPonyXL",
      "count": 3
    },
    {
      "name": "Flux.1-Schnell fp8 (Compact)",
      "count": 3
    },
    {
      "name": "Edge Of Realism",
      "count": 3
    },
    {
      "name": "526Mix-Animated",
      "count": 3
    }
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