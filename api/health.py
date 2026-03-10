from http.server import BaseHTTPRequestHandler
import json, time, base64, random
import requests as req

TOOLBAZ_PAGE_URL  = "https://toolbaz.com/writer/chat-gpt-alternative"
TOKEN_URL         = "https://data.toolbaz.com/token.php"
HORDE_API         = "https://aihorde.net/api/v2"
ANON_KEY          = "0000000000"
UA                = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
CLIENT_AGENT      = "vexa-api:1.0:github.com/vexa-ai"

POST_HDRS = {
    "User-Agent":       UA,
    "Referer":          TOOLBAZ_PAGE_URL,
    "Origin":           "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept-Language":  "en-US,en;q=0.9",
}


def _gRS(n: int) -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.choice(chars) for _ in range(n))


def _make_client_token() -> str:
    payload = {
        "bR6wF": {"nV5kP": UA, "lQ9jX": "en-US", "sD2zR": "1920x1080", "tY4hL": "America/New_York", "pL8mC": "Win32", "cQ3vD": 24, "hK7jN": 8},
        "uT4bX": {"mM9wZ": [], "kP8jY": []},
        "tuTcS": int(time.time()),
        "tDfxy": None,
        "RtyJt": _gRS(36),
    }
    b64 = base64.b64encode(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()).decode("ascii")
    return _gRS(6) + b64


def _check_toolbaz_page() -> dict:
    t0 = time.time()
    try:
        r = req.get(TOOLBAZ_PAGE_URL, headers={"User-Agent": UA}, timeout=10)
        ok = r.status_code == 200
        return {"reachable": ok, "status_code": r.status_code, "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"reachable": False, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _check_toolbaz_token() -> dict:
    t0  = time.time()
    sid = _gRS(32)
    try:
        r = req.post(TOKEN_URL, data={"session_id": sid, "token": _make_client_token()}, headers=POST_HDRS, timeout=10)
        ok    = r.status_code == 200
        token = ""
        if ok:
            try:
                token = r.json().get("token", "")
            except Exception:
                pass
        return {
            "reachable":      ok,
            "token_received": bool(token),
            "status_code":    r.status_code,
            "latency_ms":     round((time.time() - t0) * 1000),
        }
    except Exception as e:
        return {"reachable": False, "token_received": False, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _check_image() -> dict:
    t0    = time.time()
    debug = {}
    hdrs  = {"User-Agent": UA, "Client-Agent": CLIENT_AGENT, "apikey": ANON_KEY}

    try:
        r = req.get(f"{HORDE_API}/workers?type=image", headers=hdrs, timeout=10)
        r.raise_for_status()
        all_workers = r.json()
        online = [w for w in all_workers if w.get("online")]
        counts = {}
        for w in online:
            for m in w.get("models", []):
                counts[m] = counts.get(m, 0) + 1
        top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
        debug["worker_count"]           = len(online)
        debug["model_count"]            = len(counts)
        debug["top_models"]             = [n for n, _ in top]
        debug["horde_workers_latency_ms"] = round((time.time() - t0) * 1000)
    except Exception as e:
        return {"reachable": False, "error": f"Workers fetch failed: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t1 = time.time()
    try:
        payload = {
            "prompt": "a red circle",
            "params": {"width": 64, "height": 64, "n": 1, "steps": 1, "sampler_name": "k_euler", "cfg_scale": 1, "seed": "1"},
            "models": ["Deliberate"], "r2": True, "shared": False, "slow_workers": True,
        }
        r2 = req.post(f"{HORDE_API}/generate/async", json=payload, headers={**hdrs, "Content-Type": "application/json"}, timeout=15)
        r2.raise_for_status()
        job_id = r2.json().get("id")
        debug["job_submit_status"]     = r2.status_code
        debug["job_id"]                = job_id
        debug["job_submit_latency_ms"] = round((time.time() - t1) * 1000)
    except Exception as e:
        debug["job_submit_error"] = str(e)
        return {"reachable": True, **debug, "job_submitted": False, "error": f"Job submit failed: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    if not job_id:
        return {"reachable": True, **debug, "job_submitted": False, "error": "No job ID returned", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t2 = time.time()
    try:
        check = req.get(f"{HORDE_API}/generate/check/{job_id}", headers=hdrs, timeout=10).json()
        debug["job_check_latency_ms"] = round((time.time() - t2) * 1000)
        debug["is_possible"]          = check.get("is_possible")
        debug["queue_position"]        = check.get("queue_position")
        debug["wait_time_s"]           = check.get("wait_time")
    except Exception as e:
        debug["job_check_error"] = str(e)

    try:
        req.delete(f"{HORDE_API}/generate/status/{job_id}", headers=hdrs, timeout=5)
    except Exception:
        pass

    return {
        "reachable":        True,
        "worker_count":     debug.get("worker_count", 0),
        "model_count":      debug.get("model_count", 0),
        "top_models":       debug.get("top_models", []),
        "job_submitted":    True,
        "job_id":           job_id,
        "is_possible":      debug.get("is_possible"),
        "queue_position":   debug.get("queue_position"),
        "estimated_wait_s": debug.get("wait_time_s"),
        "latency_ms":       round((time.time() - t0) * 1000),
        "debug":            debug,
    }


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        t_start = time.time()
        page    = _check_toolbaz_page()
        token   = _check_toolbaz_token()
        image   = _check_image()
        overall = page["reachable"] and token["reachable"] and token["token_received"] and image["reachable"]

        body = json.dumps({
            "success":   True,
            "status":    "ok" if overall else "degraded",
            "timestamp": int(time.time()),
            "total_ms":  round((time.time() - t_start) * 1000),
            "checks": {
                "page":  page,
                "token": token,
                "image": image,
            },
        }, ensure_ascii=False).encode()

        self.send_response(200)
        self.send_header("Content-Type",   "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)