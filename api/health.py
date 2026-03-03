from http.server import BaseHTTPRequestHandler
import json, time
import requests as req

POLLINATIONS_URL  = "https://text.pollinations.ai/openai"
POLLINATIONS_MODELS_URL = "https://text.pollinations.ai/models"
HORDE_API = "https://stablehorde.net/api/v2"
ANON_KEY  = "0000000000"
UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def _check_pollinations() -> dict:
    t0 = time.time()
    try:
        r = req.post(
            POLLINATIONS_URL,
            json={"model": "openai", "messages": [{"role": "user", "content": "hi"}], "stream": False},
            headers={"User-Agent": UA, "Content-Type": "application/json"},
            timeout=15,
        )
        ok = r.status_code == 200
        text = ""
        if ok:
            try:
                text = r.json()["choices"][0]["message"]["content"][:40]
            except Exception:
                pass
        return {"reachable": ok, "status_code": r.status_code, "response_preview": text, "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"reachable": False, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _check_pollinations_models() -> dict:
    t0 = time.time()
    try:
        r = req.get(POLLINATIONS_MODELS_URL, headers={"User-Agent": UA}, timeout=10)
        r.raise_for_status()
        models = r.json()
        count = len(models)
        return {"reachable": count > 0, "model_count": count, "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"reachable": False, "model_count": 0, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _check_image() -> dict:
    t0 = time.time()
    debug: dict = {}
    try:
        r = req.get(f"{HORDE_API}/status/models?type=image", headers={"User-Agent": UA}, timeout=10)
        r.raise_for_status()
        all_models = sorted(r.json(), key=lambda m: m.get("count", 0), reverse=True)
        debug["horde_models_reachable"] = True
        debug["model_count"] = len(all_models)
        debug["top_models"] = [m["name"] for m in all_models[:5]]
        debug["horde_models_latency_ms"] = round((time.time() - t0) * 1000)
    except Exception as e:
        return {"reachable": False, "model_count": 0, "error": f"Failed to reach Horde models: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t1 = time.time()
    try:
        payload = {
            "prompt": "a red circle",
            "params": {"width": 64, "height": 64, "n": 1, "steps": 1, "sampler_name": "k_euler", "cfg_scale": 1, "seed": "1"},
            "models": ["Deliberate"],
            "r2": True,
            "shared": False,
        }
        r2 = req.post(f"{HORDE_API}/generate/async", json=payload, headers={"apikey": ANON_KEY, "User-Agent": UA, "Content-Type": "application/json"}, timeout=15)
        r2.raise_for_status()
        submit_json = r2.json()
        job_id = submit_json.get("id")
        debug["job_submit_status"] = r2.status_code
        debug["job_id"] = job_id
        debug["job_submit_latency_ms"] = round((time.time() - t1) * 1000)
    except Exception as e:
        debug["job_submit_error"] = str(e)
        return {"reachable": True, "model_count": debug.get("model_count", 0), "job_submitted": False, "error": f"Job submit failed: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    if not job_id:
        return {"reachable": True, "model_count": debug.get("model_count", 0), "job_submitted": False, "error": "No job ID returned", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t2 = time.time()
    try:
        check = req.get(f"{HORDE_API}/generate/check/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=10).json()
        debug["job_check_latency_ms"] = round((time.time() - t2) * 1000)
        debug["is_possible"]    = check.get("is_possible")
        debug["queue_position"] = check.get("queue_position")
        debug["wait_time_s"]    = check.get("wait_time")
    except Exception as e:
        debug["job_check_error"] = str(e)

    try:
        req.delete(f"{HORDE_API}/generate/status/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=5)
    except Exception:
        pass

    return {
        "reachable":       True,
        "model_count":     debug.get("model_count", 0),
        "top_models":      debug.get("top_models", []),
        "job_submitted":   True,
        "job_id":          job_id,
        "is_possible":     debug.get("is_possible"),
        "queue_position":  debug.get("queue_position"),
        "estimated_wait_s": debug.get("wait_time_s"),
        "latency_ms":      round((time.time() - t0) * 1000),
        "debug":           debug,
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
        t_start     = time.time()
        pollinations = _check_pollinations()
        models       = _check_pollinations_models()
        image        = _check_image()
        overall      = pollinations["reachable"] and models["reachable"]

        body = json.dumps({
            "success":   True,
            "status":    "ok" if overall else "degraded",
            "timestamp": int(time.time()),
            "total_ms":  round((time.time() - t_start) * 1000),
            "checks": {
                "pollinations": pollinations,
                "models":       models,
                "image":        image,
            },
        }, ensure_ascii=False).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)