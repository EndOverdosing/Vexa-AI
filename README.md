![Vexa Banner](/images/banner.png)

# Vexa AI

Free REST API for text and image generation. No account, no API key, no setup.

- **Text** — AI models via [Toolbaz](https://toolbaz.com) (GPT, Gemini, DeepSeek, Claude, Grok, Llama, and more)
- **Images** — Community GPU cluster via [Stable Horde](https://aihorde.net)

```
BASE_URL = https://vexa-ai.vercel.app
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API index, self-documenting |
| `GET` | `/models` | All text + image models (live-scraped, zero hardcoding) |
| `GET POST` | `/query` | Single prompt → response |
| `POST` | `/chat` | Multi-turn conversation (OpenAI-style messages array) |
| `GET POST` | `/image` | Generate images |
| `GET` | `/health` | Live status of Toolbaz and Stable Horde |

---

## Quick Start

```bash
# Ask a question
curl "https://vexa-ai.vercel.app/query?q=What+is+a+black+hole"

# With a specific model
curl "https://vexa-ai.vercel.app/query?q=Hello&model=gemini-2.5-pro"

# Multi-turn chat
curl -X POST https://vexa-ai.vercel.app/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Generate an image
curl "https://vexa-ai.vercel.app/image?q=a+red+fox+in+a+neon+city"

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

In-memory per serverless instance, resets on cold starts.

---

## Errors

```json
{ "success": false, "error": "description" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid parameters |
| `429` | Rate limit exceeded |
| `502` | Upstream service failed |
| `500` | Internal server error |

---

## Project Structure

```
api/
├── index.py    # GET /
├── query.py    # GET POST /query
├── chat.py     # POST /chat
├── models.py   # GET /models
├── health.py   # GET /health
└── image.py    # GET POST /image
requirements.txt
vercel.json
```

## Deploy

```bash
git clone https://github.com/your-username/vexa-ai
npm i -g vercel
vercel
```

## Run Locally

```bash
pip install requests
vercel dev
# → http://localhost:3000
```

Requires Python 3.9+. Only dependency: `requests`.