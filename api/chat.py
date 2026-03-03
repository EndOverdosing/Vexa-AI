from http.server import BaseHTTPRequestHandler
import json, time, collections
import requests as req

POLLINATIONS_URL = "https://text.pollinations.ai/openai"
DEFAULT_MODEL    = "openai"
VALID_MODELS     = {"openai", "openai-large", "mistral", "llama", "claude-hybridspace", "deepseek", "deepseek-r1"}

MAX_PROMPT_LENGTH = 16000
MAX_REQUESTS      = 20
RATE_WINDOW       = 60

_rate_store: dict = {}

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    if ip not in _rate_store:
        _rate_store[ip] = collections.deque()
    dq = _rate_store[ip]
    while dq and now - dq[0] > RATE_WINDOW:
        dq.popleft()
    if len(dq) >= MAX_REQUESTS:
        return True
    dq.append(now)
    return False


def _get_ip(h) -> str:
    forwarded = h.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real = h.headers.get("x-real-ip", "")
    if real:
        return real
    return h.client_address[0] if h.client_address else "unknown"


def _respond(h, status: int, data: dict):
    body = json.dumps({"success": status < 400, **data}, ensure_ascii=False).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json")
    h.send_header("Content-Length", str(len(body)))
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")
    h.end_headers()
    h.wfile.write(body)


def _fetch_pollinations(messages: list, model: str) -> str:
    r = req.post(
        POLLINATIONS_URL,
        json={
            "model": model,
            "messages": messages,
            "stream": False,
        },
        headers={"User-Agent": UA, "Content-Type": "application/json"},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"].strip()


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        _respond(self, 405, {
            "error": "GET not supported on /chat",
            "reason": "This endpoint requires a POST request with a JSON body containing a 'messages' array.",
            "frontend_only": True,
            "how_to_use": {
                "method": "POST",
                "url": "https://vexa-ai.vercel.app/chat",
                "headers": {"Content-Type": "application/json"},
                "body": {
                    "model": "openai",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": "Your message here"}
                    ]
                }
            },
            "docs": "https://vexa-ai.vercel.app"
        })

    def do_POST(self):
        ip = _get_ip(self)
        if _is_rate_limited(ip):
            _respond(self, 429, {"error": "Rate limit exceeded. Try again shortly."})
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            _respond(self, 400, {"error": "Invalid JSON body"})
            return

        messages = body.get("messages")
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            _respond(self, 400, {"error": "Missing or empty 'messages' array"})
            return

        for i, msg in enumerate(messages):
            if not isinstance(msg, dict):
                _respond(self, 400, {"error": f"messages[{i}] must be an object"})
                return
            if msg.get("role") not in ("system", "user", "assistant"):
                _respond(self, 400, {"error": f"messages[{i}].role must be 'system', 'user', or 'assistant'"})
                return
            if not isinstance(msg.get("content", ""), str):
                _respond(self, 400, {"error": f"messages[{i}].content must be a string"})
                return

        model = body.get("model") or DEFAULT_MODEL
        if model not in VALID_MODELS:
            model = DEFAULT_MODEL

        total_chars = sum(len(m.get("content", "")) for m in messages)
        if total_chars > MAX_PROMPT_LENGTH:
            _respond(self, 400, {"error": f"Conversation exceeds maximum length of {MAX_PROMPT_LENGTH} characters"})
            return

        try:
            t0   = time.time()
            text = _fetch_pollinations(messages, model)
            _respond(self, 200, {
                "message": {
                    "role":    "assistant",
                    "content": text,
                },
                "model":        model,
                "elapsed_ms":   round((time.time() - t0) * 1000),
                "prompt_chars": total_chars,
            })
        except Exception as e:
            _respond(self, 502, {"error": f"Upstream request failed: {e}"})