from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
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
    h.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")
    h.end_headers()
    h.wfile.write(body)


def _fetch_pollinations(prompt: str, model: str, system: str | None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system.strip()})
    messages.append({"role": "user", "content": prompt.strip()})

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


def _run(h, prompt, model, system=None):
    ip = _get_ip(h)
    if _is_rate_limited(ip):
        _respond(h, 429, {"error": "Rate limit exceeded. Try again shortly."})
        return
    if not prompt or not prompt.strip():
        _respond(h, 400, {"error": "Missing required parameter: q, query, or prompt"})
        return
    if len(prompt) > MAX_PROMPT_LENGTH:
        _respond(h, 400, {"error": f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters"})
        return
    if not model or model not in VALID_MODELS:
        model = DEFAULT_MODEL

    try:
        t0   = time.time()
        text = _fetch_pollinations(prompt, model, system)
        _respond(h, 200, {
            "response":     text,
            "model":        model,
            "elapsed_ms":   round((time.time() - t0) * 1000),
            "prompt_chars": len(prompt),
        })
    except Exception as e:
        _respond(h, 502, {"error": f"Upstream request failed: {e}"})


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        prompt = (params.get("q") or params.get("query") or [None])[0]
        model  = (params.get("model") or [DEFAULT_MODEL])[0]
        system = (params.get("system") or [None])[0]
        _run(self, prompt, model, system)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            _respond(self, 400, {"error": "Invalid JSON body"})
            return
        prompt = body.get("q") or body.get("query") or body.get("prompt")
        model  = body.get("model") or DEFAULT_MODEL
        system = body.get("system")
        _run(self, prompt, model, system)