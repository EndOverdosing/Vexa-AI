# Chat

Multi-turn conversation endpoint. Accepts an OpenAI-style `messages` array and passes it directly to Pollinations.AI — no manual prompt building needed.

```
POST https://vexa-ai.vercel.app/chat
```

---

## Request

```bash
curl -X POST https://vexa-ai.vercel.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai-large",
    "messages": [
      { "role": "system",    "content": "You are a helpful assistant. Be concise." },
      { "role": "user",      "content": "What is the speed of light?" },
      { "role": "assistant", "content": "Approximately 299,792,458 metres per second." },
      { "role": "user",      "content": "How long does it take to reach the Moon?" }
    ]
  }'
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `messages` | yes | Array of message objects. Must contain at least one message. |
| `model` | no | Model ID. Defaults to `openai`. See [`/models`](./MODELS.md). |

### Message object

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `role` | yes | `system` \| `user` \| `assistant` | Who sent this message |
| `content` | yes | string | The message text |

**Role behaviour:**
- `system` — Sets persona or standing instructions.
- `user` — A message from the human.
- `assistant` — A previous reply from the model. Include these to give the model context of what it already said.

---

## Response

```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "At the speed of light, it takes approximately 1.28 seconds to reach the Moon from Earth."
  },
  "model": "openai-large",
  "elapsed_ms": 980,
  "prompt_chars": 312
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | `true` on success |
| `message.role` | string | Always `"assistant"` |
| `message.content` | string | The model's reply |
| `model` | string | Model ID that was used |
| `elapsed_ms` | number | Total round-trip time in milliseconds |
| `prompt_chars` | number | Total character count of all messages |

---

## Examples

### Basic single turn

```js
const res = await fetch('https://vexa-ai.vercel.app/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
const data = await res.json();
console.log(data.message.content);
```

### Multi-turn conversation loop (JavaScript)

```js
const BASE = 'https://vexa-ai.vercel.app';
const model = 'openai';
const history = [
  { role: 'system', content: 'You are a helpful assistant. Be concise.' }
];

async function chat(userMessage) {
  history.push({ role: 'user', content: userMessage });

  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: history })
  });

  const data = await res.json();
  const reply = data.message.content;
  history.push({ role: 'assistant', content: reply });
  return reply;
}

console.log(await chat('What is a black hole?'));
console.log(await chat('How big can they get?'));
console.log(await chat('Have we ever observed one directly?'));
```

### Python conversation loop

```python
import requests

BASE = 'https://vexa-ai.vercel.app'
history = [
    {'role': 'system', 'content': 'You are a concise assistant.'}
]

def chat(user_message, model='openai'):
    history.append({'role': 'user', 'content': user_message})
    r = requests.post(f'{BASE}/chat', json={'model': model, 'messages': history})
    reply = r.json()['message']['content']
    history.append({'role': 'assistant', 'content': reply})
    return reply

print(chat('What is the tallest mountain?'))
print(chat('How was it formed?'))
print(chat('Has anyone climbed it in winter?'))
```

---

## vs `/query`

| | `/query` | `/chat` |
|-|----------|---------|
| Input | Single string prompt | Messages array |
| Context | You handle manually | Structured via roles |
| System prompt | `system` param | `{"role": "system"}` message |
| Multi-turn | Manual concatenation | Built-in |
| Response shape | `{ response: string }` | `{ message: { role, content } }` |

Use `/query` for one-off prompts. Use `/chat` when building a conversational interface.

---

## Limits

| Limit | Value |
|-------|-------|
| Max total conversation length | 16000 characters |
| Rate limit | 20 requests / IP / 60s |
| Timeout | 30s |

> The 16000 character limit applies across all messages combined. Trim older messages from the array if you hit this limit.

---

## Errors

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `Missing or empty 'messages' array` | No messages provided |
| `400` | `messages[N] must be an object` | Non-object entry in array |
| `400` | `messages[N].role must be 'system', 'user', or 'assistant'` | Invalid role value |
| `400` | `Conversation exceeds maximum length of 16000 characters` | History too long — trim older messages |
| `429` | `Rate limit exceeded. Try again shortly.` | Too many requests |
| `502` | `Upstream request failed` | Pollinations.AI unreachable |
| `500` | `Internal server error` | Unexpected failure |