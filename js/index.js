const BASE = 'https://vexa-ai.vercel.app';
let modelsCache = null;
let chatHistory = [];
let currentMode = 'query';

function go(path) {
  history.pushState({}, '', path);
  render(path);
}
window.addEventListener('popstate', () => render(location.pathname));
window.addEventListener('DOMContentLoaded', () => render(location.pathname));

function render(path) {
  const app = document.getElementById('app');
  const map = {
    '/': pageHome,
    '/endpoints': pageEndpoints,
    '/models': pageModels,
    '/playground': pagePlayground,
    '/limits': pageLimits,
  };
  const fn = map[path] || pageHome;
  const wrap = document.createElement('div');
  wrap.className = 'page';
  wrap.innerHTML = fn();
  app.innerHTML = '';
  app.appendChild(wrap);
  setActive(path);
  window.scrollTo(0, 0);
  if (path === '/models') loadModels();
  if (path === '/playground') initPlayground();
  if (path === '/') loadTerminalGreeting();
}

function setActive(path) {
  document.querySelectorAll('[data-path]').forEach(a => {
    a.classList.toggle('active', a.dataset.path === path);
  });
}
function toggleMenu() { document.getElementById('mm').classList.toggle('open'); }
function closeMenu() { document.getElementById('mm').classList.remove('open'); }
document.addEventListener('click', e => {
  const mm = document.getElementById('mm');
  if (!document.querySelector('nav').contains(e.target) && !mm.contains(e.target)) mm.classList.remove('open');
});

function md(text) {
  if (!text) return '';
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let t = text;
  const blocks = [];

  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const i = blocks.length;
    blocks.push(`<pre><code>${e(code.trim())}</code></pre>`);
    return `\x00B${i}\x00`;
  });

  t = t.replace(/`([^`\n]+)`/g, (_, c) => `<code>${e(c)}</code>`);

  t = t.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  t = t.replace(/^#{6} (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^#{4,5} (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  t = t.replace(/^[-*]{3,}$/gm, '<hr>');

  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__(.+?)__/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  t = t.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  t = t.replace(/((?:^\|.+\|\n?)+)/gm, blk => {
    const rows = blk.trim().split('\n');
    if (rows.length < 2) return blk;
    const parseR = r => r.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
    const isSep = r => /^\|[\s\-|:]+\|$/.test(r.trim());
    let th = '', tb = '', hd = false;
    rows.forEach(r => {
      if (isSep(r)) { hd = true; return; }
      const cells = parseR(r);
      if (!hd) th = '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
      else tb += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    });
    return `<table>${th}<tbody>${tb}</tbody></table>`;
  });

  t = t.replace(/(^[-*+] .+\n?)+/gm, m => '<ul>' + m.trim().split('\n').map(l => `<li>${l.replace(/^[-*+] /, '')}</li>`).join('') + '</ul>');
  t = t.replace(/(^\d+\. .+\n?)+/gm, m => '<ol>' + m.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('') + '</ol>');

  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const BLK = /^<(h[1-6]|ul|ol|pre|table|blockquote|hr)/;
  const lines = t.split('\n'), out = []; let buf = [];
  for (const ln of lines) {
    if (ln.startsWith('\x00B') || BLK.test(ln)) {
      if (buf.length) { out.push(`<p>${buf.join(' ')}</p>`); buf = []; }
      out.push(ln);
    } else if (!ln.trim()) {
      if (buf.length) { out.push(`<p>${buf.join(' ')}</p>`); buf = []; }
    } else buf.push(ln);
  }
  if (buf.length) out.push(`<p>${buf.join(' ')}</p>`);
  t = out.join('\n');
  blocks.forEach((b, i) => { t = t.replace(`\x00B${i}\x00`, b); });
  return t;
}

function pageHome() {
  return `
<div class="ticker-wrap">
  <div class="ticker-inner">
    ${Array(4).fill(['FREE REST API', 'NO AUTH REQUIRED', 'TEXT GENERATION', 'IMAGE SYNTHESIS', 'MULTI-TURN CHAT', '15+ MODELS', 'STABLE HORDE', 'TOOLBAZ', 'OPEN ACCESS', 'ZERO SETUP'].map(t => `<span class="ticker-item">${t}</span>`).join('')).join('')}
  </div>
</div>
<div class="hero">
  <div class="hero-left">
    <div class="hero-stripe"></div>
    <div class="hero-eyebrow">Free REST API · No Auth Required</div>
    <h1 class="hero-h1">
      <span class="r">AI</span><br>
      <span class="y">API</span><br>
      <span class="b">NOW.</span>
    </h1>
    <p class="hero-body">Text generation, multi-turn chat, and image synthesis — no account, no API key, no setup. Powered by Toolbaz and Stable Horde.</p>
    <div class="hero-cta">
      <button class="btn btn-primary" onclick="go('/playground')">Try Playground →</button>
      <button class="btn btn-secondary" onclick="go('/endpoints')">View Docs</button>
      <button class="btn btn-secondary" onclick="window.open('https://github.com/endoverdosing/Vexa-AI', '_blank')">View Github</button>
    </div>
    <div class="hero-badge">
      <div class="badge-item"><div class="badge-val">5</div><div class="badge-label">Endpoints</div></div>
      <div class="badge-divider"></div>
      <div class="badge-item"><div class="badge-val">15+</div><div class="badge-label">Text Models</div></div>
      <div class="badge-divider"></div>
      <div class="badge-item"><div class="badge-val">0</div><div class="badge-label">Auth Required</div></div>
    </div>
  </div>
  <div class="hero-right">
    <div class="hero-grid-bg"></div>
    <div class="shape s-circle"></div>
    <div class="shape s-rect"></div>
    <div class="shape s-tri"></div>
    <div class="shape s-line"></div>
    <div class="shape s-dot-grid">${Array(25).fill('<div class="s-dot"></div>').join('')}</div>
    <div class="terminal-card">
      <div class="tc-header">
        <div class="tc-dot"></div><div class="tc-dot"></div><div class="tc-dot"></div>
        <span class="tc-name">vexa-ai — bash</span>
      </div>
      <div class="tc-body">
        <div><span class="cc"># Random greeting</span></div>
        <div><span class="cp">$</span><span class="cy">curl </span><span class="cb">"vexa-ai.vercel.app/query?q=<span id="terminal-prompt">Hello there!</span>"</span></div>
        <div>&nbsp;</div>
        <div id="terminal-response">
          <div><span class="ck">{</span></div>
          <div>&nbsp;&nbsp;<span class="ck">"success"</span>: <span class="cv">true</span>,</div>
          <div>&nbsp;&nbsp;<span class="ck">"response"</span>: <span class="cg">"<span id="terminal-text">Loading...</span>"</span>,</div>
          <div>&nbsp;&nbsp;<span class="ck">"model"</span>: <span class="cg">"<span id="terminal-model">toolbaz-v4.5-fast</span>"</span>,</div>
          <div>&nbsp;&nbsp;<span class="ck">"elapsed_ms"</span>: <span class="cv"><span id="terminal-time">0</span></span></div>
          <div><span class="ck">}</span></div>
        </div>
        <div>&nbsp;</div>
        <div><span class="cp">$</span><span class="cursor"></span></div>
      </div>
    </div>
  </div>
</div>
<section class="section">
  <div class="sec-head">
    <div class="sec-num" style="background:var(--red)">→</div>
    <div class="sec-title">AT A GLANCE</div>
  </div>
  <div class="overview-strip">
    ${[
      ['5', 'Endpoints', 'query, chat, image, models, health', 'var(--red)'],
      ['15+', 'Text Models', 'OpenAI, Mistral, Llama, DeepSeek…', 'var(--yellow)'],
      ['20+', 'Image Models', 'Stable Horde community GPU cluster', 'var(--blue)'],
      ['0', 'Auth Required', 'No keys. No accounts. No setup.', '#333'],
    ].map(([n, l, d, c]) => `
    <div class="ov-card">
      <div class="ov-accent" style="background:${c}"></div>
      <div class="ov-num">${n}</div>
      <div class="ov-label">${l}</div>
      <div class="ov-sub">${d}</div>
    </div>`).join('')}
  </div>
</section>`;
}

function pageEndpoints() {
  return `
<section class="section">
  <div class="sec-head">
    <div class="sec-num">01</div>
    <div class="sec-title">ENDPOINTS<span class="sec-subtitle">BASE: vexa-ai.vercel.app</span></div>
  </div>
  <div class="ep-grid">
    ${[
      { cls: 'ep-c1', m: 'GET / POST', mc: 'm-both', p: '/query', d: 'Send a single prompt to any text model. Pass <code>?q=</code> in a GET or a JSON body in a POST.', t: 'Text · Single-turn' },
      { cls: 'ep-c2', m: 'POST', mc: 'm-post', p: '/chat', d: 'Multi-turn conversation with OpenAI-style messages array. Pass full history each request.', t: 'Text · Multi-turn' },
      { cls: 'ep-c3', m: 'GET / POST', mc: 'm-both', p: '/image', d: 'Generate images via Stable Horde community GPUs. Supports negative prompts, cfg_scale, steps.', t: 'Image · Stable Diffusion' },
      { cls: 'ep-c4', m: 'GET', mc: 'm-get', p: '/models', d: 'Returns all text models and top 30 image models from Stable Horde. Cached 5 min per instance.', t: 'Meta · Model List' },
      { cls: 'ep-c5', m: 'GET', mc: 'm-get', p: '/health', d: 'Live status of Toolbaz and Stable Horde. Tests auth token exchange and image job queueing.', t: 'Meta · Status' },
    ].map(c => `
    <div class="ep-card ${c.cls}">
      <div class="ep-method ${c.mc}">${c.m}</div>
      <div class="ep-path">${c.p}</div>
      <div class="ep-desc">${c.d}</div>
      <div class="ep-tag">${c.t}</div>
    </div>`).join('')}
    <div class="ep-card ep-base">
      <div class="ep-base-word">BASE</div>
      <div class="ep-base-url">vexa-ai.vercel.app</div>
      <div style="font-size:.78rem;color:#aaa">No auth. No keys. Ever.</div>
      <button class="btn btn-yellow" onclick="go('/playground')" style="margin-top:.5rem">Try it →</button>
    </div>
  </div>
</section>
<section class="section">
  <div class="sec-head">
    <div class="sec-num">02</div>
    <div class="sec-title">ERROR REFERENCE</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border-top:var(--border)">
    <div style="padding:2.5rem;border-right:var(--border)">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.08em;margin-bottom:1.2rem">ERROR SHAPE</div>
      <div style="background:var(--black);border:var(--border);padding:1.5rem;font-family:'Space Mono',monospace;font-size:.72rem;line-height:2;color:#888;border-left:4px solid var(--red)">
        <span style="color:#e88">{</span><br>
        &nbsp;&nbsp;<span style="color:#e88">"success"</span>: <span style="color:#8bc34a">false</span>,<br>
        &nbsp;&nbsp;<span style="color:#e88">"error"</span>: <span style="color:#8bc34a">"description here"</span><br>
        <span style="color:#e88">}</span>
      </div>
    </div>
    <div style="padding:2.5rem">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.08em;margin-bottom:1.2rem">STATUS CODES</div>
      <table class="err-table">
        <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
        <tbody>
          ${[
      ['200', 'c-200', 'Request succeeded'],
      ['400', 'c-400', 'Bad request — missing/invalid params'],
      ['429', 'c-429', 'Rate limit exceeded'],
      ['502', 'c-502', 'Upstream service unreachable'],
      ['500', 'c-500', 'Internal server error'],
    ].map(([code, cls, msg]) => `<tr><td><span class="code-chip ${cls}">${code}</span></td><td>${msg}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>
<section class="section" style="border-bottom:none">
  <div class="sec-head">
    <div class="sec-num">03</div>
    <div class="sec-title">RATE SUMMARY</div>
  </div>
  <div style="border-top:var(--border);display:flex;align-items:center;gap:0;flex-wrap:wrap">
    ${[
      ['/query', '20 req / IP / 60s', false],
      ['/chat', '20 req / IP / 60s', true],
      ['/image', '10 req / IP / 60s', false],
    ].map(([ep, lim, inv]) => `
    <div style="flex:1;padding:2rem 2.5rem;${inv ? 'background:var(--black);color:var(--off-white)' : ''};border-right:var(--border);min-width:200px">
      <div style="font-family:'Space Mono',monospace;font-size:.7rem;color:${inv ? 'var(--yellow)' : 'var(--red)'};margin-bottom:.5rem;letter-spacing:.08em">${ep}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:.04em">${lim}</div>
    </div>`).join('')}
    <div style="padding:2rem 2.5rem">
      <button class="btn btn-primary" onclick="go('/limits')">Full Details →</button>
    </div>
  </div>
</section>`;
}

function pageModels() {
  return `
<section class="section">
  <div class="sec-head">
    <div class="sec-num">02</div>
    <div class="sec-title">MODELS<span class="sec-subtitle">LIVE FROM API</span></div>
  </div>
  <div class="models-wrap">
    <div class="models-panel">
      <div class="panel-head"><span class="ph-bar" style="background:var(--blue)"></span>TEXT MODELS</div>
      <div class="models-list" id="text-list"><div class="ml">Fetching…</div></div>
    </div>
    <div class="models-panel">
      <div class="panel-head"><span class="ph-bar" style="background:var(--red)"></span>IMAGE MODELS</div>
      <div class="models-list" id="img-list"><div class="ml">Fetching…</div></div>
    </div>
  </div>
</section>
<section class="section" style="border-bottom:none">
  <div class="sec-head">
    <div class="sec-num">→</div>
    <div class="sec-title">DEFAULTS</div>
  </div>
  <div style="border-top:var(--border);padding:2rem 2.5rem;display:flex;align-items:center;gap:2.5rem;flex-wrap:wrap">
    <div style="font-family:'Space Mono',monospace;font-size:.72rem;color:#888">Text default</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em" id="def-model">toolbaz-v4.5-fast</div>
    <div style="width:2px;height:32px;background:var(--light-gray)"></div>
    <div style="font-family:'Space Mono',monospace;font-size:.72rem;color:#888">Image default</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em">Deliberate</div>
    <button class="btn btn-secondary" onclick="go('/playground')" style="margin-left:auto">Test in Playground →</button>
  </div>
</section>`;

}

async function loadModels() {
  try {
    if (!modelsCache) {
      const r = await fetch(`${BASE}/models`);
      modelsCache = await r.json();
    }
    const d = modelsCache;
    const tl = document.getElementById('text-list');
    const il = document.getElementById('img-list');
    const dm = document.getElementById('def-model');
    if (!tl || !il) return;
    if (dm) dm.textContent = d.default || 'toolbaz-v4.5-fast';
    tl.innerHTML = '';
    Object.entries(d.models).forEach(([id, info]) => {
      const row = document.createElement('div');
      row.className = 'model-row';
      row.innerHTML = `<span class="model-id">${id}${id === d.default ? ' <span style="color:var(--red);font-size:.58rem;margin-left:.3rem">default</span>' : ''}</span><span class="model-provider">${info.provider}</span>`;
      tl.appendChild(row);
    });
    il.innerHTML = '';
    if (d.image_models && d.image_models.length) {
      d.image_models.forEach(m => {
        const row = document.createElement('div');
        row.className = 'img-model-row';
        const wc = m.count || 0;
        row.innerHTML = `<span class="model-id">${m.name}</span><span class="wc-badge${wc === 0 ? ' zero' : ''}">${wc}w</span><span class="model-provider">${m.queued > 0 ? 'q:' + m.queued : 'ready'}</span>`;
        il.appendChild(row);
      });
    } else {
      il.innerHTML = '<div class="ml">No image models available</div>';
    }
  } catch (err) {
    ['text-list', 'img-list'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="ml" style="color:var(--red)">Error: ${err.message}</div>`;
    });
  }
}

function pagePlayground() {
  return `
<section class="section" style="border-bottom:none">
  <div class="sec-head">
    <div class="sec-num">03</div>
    <div class="sec-title">PLAYGROUND</div>
  </div>
  <div class="playground-wrap">
    <div class="pg-controls">
      <div class="mode-tabs">
        <button class="m-tab active" id="tab-query" onclick="setMode('query')">Query</button>
        <button class="m-tab" id="tab-chat" onclick="setMode('chat')">Chat</button>
        <button class="m-tab" id="tab-image" onclick="setMode('image')">Image</button>
      </div>

      <div id="ctrl-query" style="display:flex;flex-direction:column;gap:1.2rem">
        <div class="f-group">
          <label class="f-label">Prompt</label>
          <textarea class="f-textarea" id="q-prompt">Explain Bauhaus design principles. Use markdown with headers, bullet points, and a code example.</textarea>
        </div>
        <div class="f-group">
          <label class="f-label">System Prompt (optional)</label>
          <input type="text" class="f-input" id="q-system" placeholder="You are a helpful assistant.">
        </div>
        <div class="f-group">
          <label class="f-label">Model</label>
          <select class="f-select" id="q-model"><option value="toolbaz-v4.5-fast">toolbaz-v4.5-fast (loading…)</option></select>
        </div>
        <button class="btn btn-primary" onclick="runQuery()" style="width:100%;justify-content:center">Run Query →</button>
      </div>

      <div id="ctrl-chat" style="display:none;flex-direction:column;gap:1.2rem">
        <div class="f-group">
          <label class="f-label">System Prompt</label>
          <input type="text" class="f-input" id="c-system" value="You are a concise assistant. Format your answers in markdown.">
        </div>
        <div class="f-group">
          <label class="f-label">Model</label>
          <select class="f-select" id="c-model"><option value="toolbaz-v4.5-fast">toolbaz-v4.5-fast (loading…)</option></select>
        </div>
        <button class="btn btn-secondary" onclick="clearChat()" style="width:100%;justify-content:center;font-size:.65rem">Clear Conversation</button>
        <div class="chat-row">
          <input type="text" class="f-input" id="c-input" placeholder="Type a message…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();runChat()}">
          <button class="btn btn-primary" onclick="runChat()">Send</button>
        </div>
      </div>

      <div id="ctrl-image" style="display:none;flex-direction:column;gap:1.2rem">
        <div class="f-group">
          <label class="f-label">Prompt</label>
          <textarea class="f-textarea" id="i-prompt">Bauhaus geometric composition, primary colors, bold architectural forms, clean lines, dramatic lighting</textarea>
        </div>
        <div class="f-group">
          <label class="f-label">Negative Prompt</label>
          <input type="text" class="f-input" id="i-neg" value="blurry, watermark, text, low quality, deformed">
        </div>
        <div class="f-2col">
          <div class="f-group">
            <label class="f-label">Resolution</label>
            <select class="f-select" id="i-res">
              <option value="512x512">512×512</option>
              <option value="512x768">512×768</option>
              <option value="768x512">768×512</option>
              <option value="768x768">768×768</option>
            </select>
          </div>
          <div class="f-group">
            <label class="f-label">Model</label>
            <select class="f-select" id="i-model"><option value="Deliberate">Deliberate</option></select>
          </div>
        </div>
        <div class="f-2col">
          <div class="f-group">
            <label class="f-label">CFG Scale (1–20)</label>
            <input type="number" class="f-input" id="i-cfg" value="7" min="1" max="20">
          </div>
          <div class="f-group">
            <label class="f-label">Steps (1–50)</label>
            <input type="number" class="f-input" id="i-steps" value="20" min="1" max="50">
          </div>
        </div>
        <button class="btn btn-red" onclick="runImage()" style="width:100%;justify-content:center">Generate Image →</button>
      </div>
    </div>

    <div class="pg-output">
      <div class="pg-out-header">
        <span class="pg-out-title">OUTPUT</span>
        <span class="pg-out-mode" id="out-mode">QUERY MODE</span>
      </div>
      <div class="loading-bar" id="lbar"></div>
      <div class="err-box" id="ebox"></div>
      <div class="pg-out-body" id="out-body">
        <div id="chat-hist" class="chat-history" style="display:none"></div>
        <div class="md" id="out-md"><div class="out-placeholder"><div class="ph-icon">◈</div><span>Send a request to see the response here.</span></div></div>
        <img class="out-img" id="out-img" alt="Generated image">
      </div>
      <div class="pg-out-meta">
        <div class="meta-pair"><span class="meta-k">Model</span><span class="meta-v" id="m-model">—</span></div>
        <div class="meta-pair"><span class="meta-k">Elapsed</span><span class="meta-v" id="m-elapsed">—</span></div>
        <div class="meta-pair"><span class="meta-k">Status</span><span class="meta-v" id="m-status">—</span></div>
      </div>
    </div>
  </div>
</section>`;

}

async function initPlayground() {
  try {
    if (!modelsCache) {
      const r = await fetch(`${BASE}/models`);
      modelsCache = await r.json();
    }
    const d = modelsCache;
    ['q-model', 'c-model'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '';
      Object.entries(d.models).forEach(([k]) => {
        const o = document.createElement('option');
        o.value = k; o.textContent = k + (k === d.default ? ' (default)' : '');
        sel.appendChild(o);
      });
    });
    const imgSel = document.getElementById('i-model');
    if (imgSel && d.image_models?.length) {
      imgSel.innerHTML = '';
      d.image_models.forEach(m => {
        const o = document.createElement('option');
        o.value = m.name; o.textContent = `${m.name} (${m.count || 0}w)`;
        imgSel.appendChild(o);
      });
    }
  } catch (_) { }
}

async function loadTerminalGreeting() {
  const greetings = [
    'Hello there!',
    'Hi! How are you?',
    'Greetings, friend!',
    'Welcome! How can I help?',
    'Hey! Nice to meet you!',
    'Hello! What\'s up?',
    'Hi there! How\'s it going?',
    'Greetings! How are you today?'
  ];

  const prompt = greetings[Math.floor(Math.random() * greetings.length)];
  const promptEl = document.getElementById('terminal-prompt');
  const textEl = document.getElementById('terminal-text');
  const modelEl = document.getElementById('terminal-model');
  const timeEl = document.getElementById('terminal-time');

  if (promptEl) promptEl.textContent = prompt;
  if (textEl) textEl.textContent = 'Loading...';

  try {
    const r = await fetch(`${BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await r.json();

    if (data.success && textEl && modelEl && timeEl) {
      let response = data.response;
      if (response.length > 60) {
        response = response.substring(0, 57) + '...';
      }
      textEl.textContent = response;
      modelEl.textContent = data.model;
      timeEl.textContent = data.elapsed_ms;
    } else {
      if (textEl) textEl.textContent = 'API call failed';
    }
  } catch (e) {
    if (textEl) textEl.textContent = 'Error loading greeting';
  }
}

function setMode(mode) {
  currentMode = mode;
  ['query', 'chat', 'image'].forEach(m => {
    document.getElementById(`tab-${m}`)?.classList.toggle('active', m === mode);
    const c = document.getElementById(`ctrl-${m}`);
    if (c) c.style.display = m === mode ? 'flex' : 'none';
  });
  document.getElementById('chat-hist').style.display = mode === 'chat' ? 'flex' : 'none';
  document.getElementById('out-mode').textContent = mode.toUpperCase() + ' MODE';
  if (mode !== 'chat') resetOut();
}

function resetOut() {
  document.getElementById('out-md').innerHTML = '<div class="out-placeholder"><div class="ph-icon">◈</div><span>Send a request to see the response here.</span></div>';
  document.getElementById('out-img')?.classList.remove('on');
  document.getElementById('ebox')?.classList.remove('on');
  document.getElementById('m-model').textContent = '—';
  document.getElementById('m-elapsed').textContent = '—';
  document.getElementById('m-status').textContent = '—';
}
function setLoad(on) { document.getElementById('lbar')?.classList.toggle('on', on); }
function showErr(msg) { const e = document.getElementById('ebox'); if (e) { e.textContent = '✕ ' + msg; e.classList.add('on'); } }
function setMeta(model, elapsed, status) {
  document.getElementById('m-model').textContent = model;
  document.getElementById('m-elapsed').textContent = elapsed;
  document.getElementById('m-status').textContent = status;
}

async function runQuery() {
  const prompt = document.getElementById('q-prompt')?.value.trim();
  const system = document.getElementById('q-system')?.value.trim();
  const model = document.getElementById('q-model')?.value;
  if (!prompt) return;
  setLoad(true);
  document.getElementById('ebox')?.classList.remove('on');
  document.getElementById('out-md').innerHTML = '<div class="out-placeholder"><div class="ph-icon" style="animation:pulse 1s infinite">◈</div><span>Waiting for response…</span></div>';
  setMeta('…', '…', 'pending');
  try {
    const body = { prompt, model };
    if (system) body.system = system;
    const r = await fetch(`${BASE}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    setLoad(false);
    if (!data.success) throw new Error(data.error || 'Request failed');
    document.getElementById('out-md').innerHTML = md(data.response);
    setMeta(data.model, data.elapsed_ms + 'ms', '200 OK');
  } catch (e) {
    setLoad(false); showErr(e.message); setMeta('—', '—', 'error');
  }
}

function clearChat() {
  chatHistory = [];
  document.getElementById('chat-hist').innerHTML = '';
  document.getElementById('out-md').innerHTML = '<div class="out-placeholder"><div class="ph-icon">◈</div><span>Chat cleared. Send a message.</span></div>';
  document.getElementById('ebox')?.classList.remove('on');
  setMeta('—', '—', '—');
}

function addBubble(role, content) {
  const ch = document.getElementById('chat-hist');
  if (!ch) return;
  const div = document.createElement('div');
  div.className = `bubble ${role}`;
  if (role === 'user') {
    div.textContent = content;
  } else {
    const inner = document.createElement('div');
    inner.className = 'md';
    inner.style.background = 'transparent';
    inner.innerHTML = md(content);
    div.appendChild(inner);
  }
  ch.appendChild(div);
  const ob = document.getElementById('out-body');
  if (ob) ob.scrollTop = ob.scrollHeight;
}

async function runChat() {
  const input = document.getElementById('c-input')?.value.trim();
  const system = document.getElementById('c-system')?.value.trim();
  const model = document.getElementById('c-model')?.value;
  if (!input) return;
  document.getElementById('c-input').value = '';
  const ch = document.getElementById('chat-hist');
  if (ch) ch.style.display = 'flex';
  document.getElementById('out-md').innerHTML = '';
  document.getElementById('ebox')?.classList.remove('on');
  if (chatHistory.length === 0 && system) chatHistory.push({ role: 'system', content: system });
  chatHistory.push({ role: 'user', content: input });
  addBubble('user', input);
  setLoad(true); setMeta('…', '…', 'pending');
  try {
    const r = await fetch(`${BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: chatHistory }) });
    const data = await r.json();
    setLoad(false);
    if (!data.success) throw new Error(data.error || 'Request failed');
    chatHistory.push({ role: 'assistant', content: data.message.content });
    addBubble('assistant', data.message.content);
    setMeta(data.model, data.elapsed_ms + 'ms', '200 OK');
  } catch (e) {
    setLoad(false); showErr(e.message); setMeta('—', '—', 'error');
  }
}

async function runImage() {
  const prompt = document.getElementById('i-prompt')?.value.trim();
  const neg = document.getElementById('i-neg')?.value.trim();
  const res = document.getElementById('i-res')?.value;
  const model = document.getElementById('i-model')?.value;
  const cfg = parseInt(document.getElementById('i-cfg')?.value);
  const steps = parseInt(document.getElementById('i-steps')?.value);
  if (!prompt) return;
  setLoad(true);
  document.getElementById('ebox')?.classList.remove('on');
  document.getElementById('out-img')?.classList.remove('on');
  document.getElementById('out-md').innerHTML = '<div class="out-placeholder"><div class="ph-icon" style="animation:pulse 1s infinite">◈</div><span>Generating image… 20–60 seconds.</span></div>';
  setMeta('…', '…', 'generating');
  try {
    const body = { prompt, model, resolution: res, cfg_scale: cfg, steps };
    if (neg) body.negative_prompt = neg;
    const r = await fetch(`${BASE}/image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    setLoad(false);
    if (!data.success) throw new Error(data.error || 'Generation failed');
    if (data.images?.[0]) {
      document.getElementById('out-img').src = `data:image/jpeg;base64,${data.images[0].b64}`;
      document.getElementById('out-img').classList.add('on');
      document.getElementById('out-md').innerHTML = md(`**Seed:** \`${data.images[0].seed}\`\n\n**Worker:** \`${data.images[0].worker}\``);
    }
    setMeta(data.model, Math.round(data.elapsed_ms / 1000) + 's', '200 OK');
  } catch (e) {
    setLoad(false); showErr(e.message); setMeta('—', '—', 'error');
  }
}

function pageLimits() {
  return `
<section class="section">
  <div class="sec-head">
    <div class="sec-num">04</div>
    <div class="sec-title">RATE LIMITS</div>
  </div>
  <div class="limits-grid">
    <div class="lim-card" data-ghost="/QUERY">
      <div class="lim-ep">/query</div>
      <div class="lim-num">20</div>
      <div class="lim-unit">requests / IP / 60s</div>
      <div class="lim-details">Max prompt: 4,000 chars<br>Timeout: 55s<br>Upstream: Toolbaz</div>
    </div>
    <div class="lim-card dark" data-ghost="/CHAT">
      <div class="lim-ep">/chat</div>
      <div class="lim-num">20</div>
      <div class="lim-unit">requests / IP / 60s</div>
      <div class="lim-details">Max conversation: 16,000 chars<br>Timeout: 30s<br>Full history per request</div>
    </div>
    <div class="lim-card" data-ghost="/IMAGE">
      <div class="lim-ep">/image</div>
      <div class="lim-num">10</div>
      <div class="lim-unit">requests / IP / 60s</div>
      <div class="lim-details">Max prompt: 1,000 chars<br>Server timeout: 120s<br>Upstream: Stable Horde</div>
    </div>
  </div>
</section>
<section class="section" style="border-bottom:none">
  <div class="sec-head">
    <div class="sec-num">→</div>
    <div class="sec-title">CONSTRAINTS</div>
  </div>
  <div class="constraints-grid">
    ${[
      ['/query', ['Prompt: 4,000 chars max', 'Rate: 20 req/IP/60s', 'Timeout: 55s · Retries: 3', 'Upstream: Toolbaz']],
      ['/chat', ['Conversation: 16,000 chars total', 'Rate: 20 req/IP/60s', 'Timeout: 30s', 'Trim old msgs if over limit']],
      ['/image', ['Prompt: 1,000 chars max', 'Negative: 500 chars max', 'Images per request: 1–4', 'Steps: 10–50 · CFG: 1–20']],
      ['/models + /health', ['Models cached: 5 min/instance', 'Multiple instances may differ', 'Image models sorted by workers', 'count=0 → 502 immediately']],
    ].map(([ep, items]) => `
    <div class="con-cell">
      <div class="con-ep">${ep}</div>
      ${items.map(it => `<div class="con-row">${it}</div>`).join('')}
    </div>`).join('')}
  </div>
</section>`;
}