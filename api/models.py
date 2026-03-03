from http.server import BaseHTTPRequestHandler
import json, time
import requests as req

POLLINATIONS_MODELS_URL = "https://text.pollinations.ai/models"
HORDE_API = "https://stablehorde.net/api/v2"
CACHE_TTL = 300
UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

FALLBACK_MODELS = {
    "openai":             {"label": "GPT-4o",          "provider": "OpenAI"},
    "openai-large":       {"label": "GPT-4o Large",    "provider": "OpenAI"},
    "openai-reasoning":   {"label": "o1 Reasoning",    "provider": "OpenAI"},
    "mistral":            {"label": "Mistral",          "provider": "Mistral AI"},
    "llama":              {"label": "Llama (fastest)",  "provider": "Meta"},
    "deepseek":           {"label": "DeepSeek",         "provider": "DeepSeek"},
    "deepseek-r1":        {"label": "DeepSeek R1",      "provider": "DeepSeek"},
    "claude-hybridspace": {"label": "Claude Hybrid",   "provider": "Anthropic"},
    "searchgpt":          {"label": "SearchGPT",        "provider": "OpenAI"},
}

_cache: dict = {"models": {}, "default": "openai", "image_models": [], "ts": 0}


def _get_text_models() -> tuple[dict, str]:
    try:
        r = req.get(POLLINATIONS_MODELS_URL, headers={"User-Agent": UA}, timeout=10)
        r.raise_for_status()
        data = r.json()
        models = {}
        default = "openai"
        for m in data:
            mid = m.get("name") or m.get("id", "")
            if not mid:
                continue
            models[mid] = {
                "label":    m.get("description") or m.get("name") or mid,
                "provider": m.get("provider", ""),
            }
        if models:
            return models, default
    except Exception:
        pass
    return FALLBACK_MODELS, "openai"


def _get_image_models() -> list:
    try:
        r = req.get(f"{HORDE_API}/status/models?type=image", headers={"User-Agent": UA}, timeout=10)
        models = sorted(r.json(), key=lambda m: m.get("count", 0), reverse=True)
        return [{"name": m["name"], "count": m.get("count", 0), "queued": m.get("queued", 0)} for m in models[:20]]
    except Exception:
        return []


def _get_models() -> tuple[dict, str, list]:
    now = time.time()
    if _cache["models"] and now - _cache["ts"] < CACHE_TTL:
        return _cache["models"], _cache["default"], _cache["image_models"]
    text_models, default = _get_text_models()
    image_models = _get_image_models()
    _cache.update({"models": text_models, "default": default, "image_models": image_models, "ts": now})
    return text_models, default, image_models


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        models, default, image_models = _get_models()
        body = json.dumps({
            "success":      True,
            "default":      default,
            "models":       models,
            "image_models": image_models,
        }, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)