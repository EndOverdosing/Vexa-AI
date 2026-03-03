# Vexa AI

Free REST API for text and image generation. No account, no API key, no setup.

- **Text** — Multiple AI models via [Pollinations.AI](https://pollinations.ai)
- **Images** — Community GPU cluster via [Stable Horde](https://stablehorde.net)

```
BASE_URL = https://vexa-ai.vercel.app
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API index, self-documenting |
| `GET` | `/models` | All text + image models |
| `GET POST` | `/query` | Single prompt → response |
| `POST` | `/chat` | Multi-turn conversation (OpenAI-style messages array) |
| `GET POST` | `/image` | Generate images |
| `GET` | `/health` | Live status of all upstream services |

---

## Quick Start

```bash
# Ask a question
curl "https://vexa-ai.vercel.app/query?q=What+is+a+black+hole"

# Ask with a system prompt
curl "https://vexa-ai.vercel.app/query?q=Hello&system=You+are+a+pirate"

# Multi-turn chat
curl -X POST https://vexa-ai.vercel.app/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Generate an image
curl "https://vexa-ai.vercel.app/image?q=a+red+fox+in+a+neon+city"

# Generate with negative prompt and custom settings
curl "https://vexa-ai.vercel.app/image?q=a+portrait&negative_prompt=blurry,watermark&cfg_scale=10&steps=30"

# List all models
curl "https://vexa-ai.vercel.app/models"

# Check system health
curl "https://vexa-ai.vercel.app/health"
```

---

## Docs

- [Models →](./MODELS.md)
- [Query →](./QUERY.md)
- [Chat →](./CHAT.md)
- [Image →](./IMAGE.md)
- [Health →](./HEALTH.md)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/query` | 20 requests / IP / 60s |
| `/chat` | 20 requests / IP / 60s |
| `/image` | 10 requests / IP / 60s |

Rate limiting is in-memory per serverless instance and resets on cold starts.

---

## Errors

All errors follow the same shape:

```json
{ "success": false, "error": "description of what went wrong" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid parameters |
| `429` | Rate limit exceeded |
| `502` | Upstream service failed |
| `500` | Internal server error |

---

## Deploy Your Own

```bash
git clone https://github.com/your-username/vexa-ai
npm i -g vercel
vercel
```

Requires Python 3.9+. Dependencies: `requests` only.

```
api/
├── index.py     # GET /
├── query.py     # GET POST /query
├── chat.py      # POST /chat
├── models.py    # GET /models
├── health.py    # GET /health
└── image.py     # GET POST /image
requirements.txt
vercel.json
```

## Run Locally

```bash
pip install requests
vercel dev
# → http://localhost:3000
```