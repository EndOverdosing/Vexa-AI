from http.server import BaseHTTPRequestHandler
import json, time

ENDPOINTS = [
    {
        "method":      "GET / POST",
        "path":        "/query",
        "description": "Send a prompt to an AI model and get a response",
        "params": {
            "q":      "Your prompt (GET) — also accepted as 'query'",
            "model":  "(optional) Model ID. Defaults to 'openai'. See /models.",
            "system": "(optional) System prompt prepended before your message",
        },
        "body_fields": {
            "q / query / prompt": "string (required)",
            "model":              "string (optional)",
            "system":             "string (optional) — system/persona instructions",
        },
        "example_response": {
            "success":      True,
            "response":     "Hello! How can I help you today?",
            "model":        "openai",
            "elapsed_ms":   820,
            "prompt_chars": 87,
        },
    },
    {
        "method":      "POST",
        "path":        "/chat",
        "description": "Multi-turn conversation using an OpenAI-style messages array.",
        "body_fields": {
            "messages": "array (required) — [{role: 'system'|'user'|'assistant', content: string}]",
            "model":    "string (optional)",
        },
        "example_request": {
            "model": "openai-large",
            "messages": [
                {"role": "system",    "content": "You are a helpful assistant."},
                {"role": "user",      "content": "What is the speed of light?"},
                {"role": "assistant", "content": "The speed of light is approximately 299,792,458 m/s."},
                {"role": "user",      "content": "How long does it take to reach the Moon?"},
            ],
        },
        "example_response": {
            "success": True,
            "message": {"role": "assistant", "content": "At the speed of light, it takes about 1.28 seconds to reach the Moon."},
            "model":        "openai-large",
            "elapsed_ms":   980,
            "prompt_chars": 312,
        },
    },
    {
        "method":      "GET",
        "path":        "/models",
        "description": "List all available text models (from Pollinations.AI) and image models (from Stable Horde)",
        "example_response": {
            "success": True,
            "default": "openai",
            "models": {
                "openai":       {"label": "GPT-4o",         "provider": "OpenAI"},
                "openai-large": {"label": "GPT-4o Large",   "provider": "OpenAI"},
                "llama":        {"label": "Llama (fastest)", "provider": "Meta"},
                "mistral":      {"label": "Mistral",         "provider": "Mistral AI"},
            },
            "image_models": [
                {"name": "Deliberate", "count": 42, "queued": 5},
            ],
        },
    },
    {
        "method":      "GET / POST",
        "path":        "/image",
        "description": "Generate images via Stable Horde. Returns base64-encoded webp. Takes 10–120s.",
        "params": {
            "q / prompt":      "Image description (required)",
            "negative_prompt": "(optional) Things to exclude from the image",
            "model":           "(optional) Stable Horde model name. Default: Deliberate. See /models → image_models.",
            "resolution":      "(optional) 512x512 | 512x768 | 768x512 | 768x768. Default: 512x512",
            "num":             "(optional) Number of images 1–4. Default: 1",
            "cfg_scale":       "(optional) Guidance scale 1–20. Default: 7.",
            "steps":           "(optional) Inference steps 1–50. Default: 20.",
        },
        "example_response": {
            "success":         True,
            "prompt":          "a sunset over mountains",
            "negative_prompt": "blurry, watermark",
            "model":           "Deliberate",
            "resolution":      "512x512",
            "cfg_scale":       7,
            "steps":           20,
            "elapsed_ms":      34200,
            "images": [
                {"url": "https://...webp", "b64": "<base64>", "seed": "149576367", "worker": "Caustic"},
            ],
        },
    },
    {
        "method":      "GET",
        "path":        "/health",
        "description": "Live check of all services: Pollinations.AI text API, model list, and Stable Horde image pipeline",
        "example_response": {
            "success":   True,
            "status":    "ok",
            "timestamp": 1740888000,
            "total_ms":  890,
            "checks": {
                "pollinations": {"reachable": True, "status_code": 200, "latency_ms": 820},
                "models":       {"reachable": True, "model_count": 12, "latency_ms": 210},
                "image":        {"reachable": True, "model_count": 84, "job_submitted": True, "is_possible": True, "queue_position": 12, "estimated_wait_s": 45, "latency_ms": 620},
            },
        },
    },
]

ERROR_RESPONSES = [
    {"status": 400, "body": {"success": False, "error": "Missing required parameter: q, query, or prompt"}},
    {"status": 400, "body": {"success": False, "error": "Missing or empty 'messages' array"}},
    {"status": 400, "body": {"success": False, "error": "messages[0].role must be 'system', 'user', or 'assistant'"}},
    {"status": 400, "body": {"success": False, "error": "Prompt exceeds maximum length of 16000 characters"}},
    {"status": 429, "body": {"success": False, "error": "Rate limit exceeded. Try again shortly."}},
    {"status": 502, "body": {"success": False, "error": "Upstream request failed"}},
    {"status": 502, "body": {"success": False, "error": "No workers available for this model. Check /models for valid image_models."}},
    {"status": 500, "body": {"success": False, "error": "Internal server error"}},
]


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        body = json.dumps({
            "name":        "Vexa AI",
            "description": "Free text and image generation API powered by Pollinations.AI and Stable Horde. No key required.",
            "base_url":    "https://vexa-ai.vercel.app",
            "timestamp":   int(time.time()),
            "text_provider": "Pollinations.AI (https://pollinations.ai)",
            "image_provider": "Stable Horde (https://stablehorde.net)",
            "rate_limits": {
                "/query": "20 requests / IP / 60s",
                "/chat":  "20 requests / IP / 60s",
                "/image": "10 requests / IP / 60s",
            },
            "endpoints": ENDPOINTS,
            "errors":     ERROR_RESPONSES,
        }, ensure_ascii=False, indent=2).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)