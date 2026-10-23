// dashboard-live.js — Real-time polling untuk dashboard Stateline MEDIA
const LIVE_URL = "/api/ai-live?secret=mB80vr1NQ0dQBwa14UT9EQ";

function fmtNum(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toString();
}

function animateCount(el) {
  const target = parseInt(el.dataset.target || 0);
  const dur = 1200, steps = 40;
  let cur = 0;
  const inc = target / steps;
  const iv = setInterval(() => {
    cur += inc;
    if (cur >= target) { cur = target; clearInterval(iv); }
    if (el.id === 'st-rate') el.textContent = Math.round(cur) + '%';
    else if (el.id === 'st-tok') el.textContent = fmtNum(Math.round(cur));
    else el.textContent = Math.round(cur).toLocaleString('id-ID');
  }, dur / steps);
}
document.querySelectorAll('[data-target]').forEach(animateCount);

const cv = document.getElementById('livechart');
const ctx = cv.getContext('2d');
function drawChart(data) {
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  if (!data.length) return;
  const max = Math.max.apply(null, data.map(d => d[1]).concat([1]));
  const bw = W / data.length;
  ctx.strokeStyle = '#1e2536'; ctx.lineWidth = 1;
  for (let g = 1; g < 4; g++) {
    ctx.beginPath(); ctx.moveTo(0, H*g/4); ctx.lineTo(W, H*g/4); ctx.stroke();
  }
  data.forEach((d, i) => {
    const h = (d[1] / max) * (H - 12);
    const grad = ctx.createLinearGradient(0, H-h, 0, H);
    grad.addColorStop(0, '#4ade80'); grad.addColorStop(1, '#166534');
    ctx.fillStyle = d[1] > 0 ? grad : '#1e2536';
    ctx.fillRect(i * bw + 1, H - h, Math.max(bw - 2, 1), h);
  });
}

function drawHeatmap(data) {
  const el = document.getElementById('heatmap');
  if (!el || !data) return;
  const max = Math.max.apply(null, data.map(d => d[1]).concat([1]));
  el.innerHTML = data.map(pair => {
    const h = pair[0], v = pair[1];
    const intensity = v / max;
    const bg = intensity === 0 ? '#1e2536' : 'rgba(34,197,94,' + (0.2 + intensity * 0.8).toFixed(2) + ')';
    return '<div class="hcell" style="background:' + bg + '" title="' + h + ':00 - ' + v + ' req"></div>';
  }).join('');
}

function drawTrend(data) {
  const el = document.getElementById('trendbar');
  if (!el || !data) return;
  const max = Math.max.apply(null, data.map(d => d[1]).concat([1]));
  el.innerHTML = data.map(pair => {
    const day = pair[0], v = pair[1];
    const h = Math.max((v / max) * 100, 3);
    return '<div class="tbar" style="height:' + h.toFixed(0) + '%" title="' + day + ': ' + v + '"><span>' + day + '</span></div>';
  }).join('');
}

function drawTasks(tasks) {
  const el = document.getElementById('tasklist');
  if (!el || !tasks) return;
  const total = Object.values(tasks).reduce((a,b) => a+b, 0) || 1;
  el.innerHTML = Object.entries(tasks).sort((a,b) => b[1]-a[1]).map(entry => {
    const t = entry[0], v = entry[1];
    const pct = (v/total*100).toFixed(0);
    return '<div class="taskrow"><span>📝 ' + t + '</span><span><b>' + v.toLocaleString('id-ID') + '</b> <span style="color:#8b93a7">(' + pct + '%)</span></span></div>';
  }).join('');
}

function drawModels(modelDetails) {
  const el = document.getElementById('modeldetails');
  if (!el || !modelDetails) return;
  let html = '';
  for (const p of Object.keys(modelDetails)) {
    const info = modelDetails[p];
    const models = info.models || [];
    const used = models.filter(m => m.requests > 0).length;
    let rows = '';
    for (const m of models) {
      const dot = m.requests === 0 ? '#555' : m.fail_rate > 50 ? '#ef4444' : m.fail_rate > 10 ? '#f59e0b' : '#22c55e';
      const badge = m.requests === 0
        ? '<span class="mbadge unused">belum dipakai</span>'
        : '<span class="mbadge active">' + m.requests + ' req</span>';
      const lat = m.avg_latency_ms ? ' • ' + m.avg_latency_ms + 'ms' : '';
      const fail = m.requests > 0 ? ' <span style="color:' + dot + '">(' + m.fail_rate + '%)</span>' : '';
      const note = m.note ? '<span class="mnote">' + m.note + '</span>' : '';
      const sid = m.id.length > 32 ? m.id.slice(0, 29) + '...' : m.id;
      rows += '<div class="mrow"><div class="mname" title="' + m.id + '">' + sid + note + '</div><div class="mstats">' + badge + fail + '<div style="color:#8b93a7">' + lat + '</div></div></div>';
    }
    html += '<div class="mcard" onclick="this.classList.toggle(\'open\')"><h3><span class="arrow">▶</span> ' + info.label + ' <span style="color:#8b93a7;font-weight:400">(' + used + '/' + models.length + ')</span></h3><div class="mlist">' + (rows || '<div style="color:#555">-</div>') + '</div></div>';
  }
  el.innerHTML = html;
}

function drawPaperclip(pc) {
  const el = document.getElementById('paperclip');
  if (!el || !pc || !pc.agents) return;
  const num = n => (n || 0).toLocaleString('id-ID');
  const cost = c => (c > 0 ? '$' + (c / 100).toFixed(2) : '—');
  const th = 'style="text-align:right;padding:6px 4px;border-bottom:1px solid #2a3a5a;color:#8b93a7;font-weight:600"';
  const thL = 'style="text-align:left;padding:6px 4px;border-bottom:1px solid #2a3a5a;color:#8b93a7;font-weight:600"';
  const td = 'style="text-align:right;padding:6px 4px;border-bottom:1px solid #1a2030"';
  const tdL = 'style="text-align:left;padding:6px 4px;border-bottom:1px solid #1a2030"';
  let html = '<table style="width:100%;border-collapse:collapse;font-size:.82em">';
  html += '<tr><th ' + thL + '>Agen</th><th ' + th + '>Run<br>hari ini</th><th ' + th + '>Token masuk</th><th ' + th + '>Token keluar</th><th ' + th + '>Biaya<br>hari ini</th><th ' + th + '>Run<br>7 hari</th><th ' + th + '>Token<br>7 hari</th><th ' + th + '>Biaya<br>7 hari</th></tr>';
  for (const a of pc.agents) {
    const t = a.today || {}, s = a.d7 || {};
    const role = a.role ? ' <span style="color:#8b93a7;font-size:.85em">(' + a.role + ')</span>' : '';
    html += '<tr><td ' + tdL + '><b>' + a.name + '</b>' + role + '</td>'
      + '<td ' + td + '>' + num(t.runs) + '</td>'
      + '<td ' + td + '>' + num(t.tokens_in) + '</td>'
      + '<td ' + td + '>' + num(t.tokens_out) + '</td>'
      + '<td ' + td + '>' + cost(t.cost_cents) + '</td>'
      + '<td ' + td + '>' + num(s.runs) + '</td>'
      + '<td ' + td + '>' + num((s.tokens_in || 0) + (s.tokens_out || 0)) + '</td>'
      + '<td ' + td + '>' + cost(s.cost_cents) + '</td></tr>';
  }
  const tt = (pc.totals && pc.totals.today) || {}, ts = (pc.totals && pc.totals.d7) || {};
  const b = 'style="font-weight:700"';
  html += '<tr><td ' + tdL + ' ' + b + '>TOTAL</td>'
    + '<td ' + td + ' ' + b + '>' + num(tt.runs) + '</td>'
    + '<td ' + td + ' ' + b + '>' + num(tt.tokens_in) + '</td>'
    + '<td ' + td + ' ' + b + '>' + num(tt.tokens_out) + '</td>'
    + '<td ' + td + ' ' + b + '>' + cost(tt.cost_cents) + '</td>'
    + '<td ' + td + ' ' + b + '>' + num(ts.runs) + '</td>'
    + '<td ' + td + ' ' + b + '>' + num((ts.tokens_in || 0) + (ts.tokens_out || 0)) + '</td>'
    + '<td ' + td + ' ' + b + '>' + cost(ts.cost_cents) + '</td></tr>';
  html += '</table>';
  if (!pc.cost_recorded) {
    html += '<div style="font-size:.72em;color:#8b93a7;margin-top:8px">Biaya USD belum tercatat di Paperclip untuk provider ini (cost_cents = 0) — gunakan token sebagai acuan biaya.</div>';
  }
  if (pc.stale) {
    html += '<div style="font-size:.72em;color:#f59e0b;margin-top:4px">⚠️ data terakhir yang tersimpan (box Paperclip belum terjangkau saat snapshot)</div>';
  }
  el.innerHTML = html;
}

async function pollLive() {
  const badge = document.getElementById('livebadge');
  try {
    const r = await fetch(LIVE_URL + '&t=' + Date.now());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    badge.innerHTML = '<span class="live-dot"></span><span style="color:#22c55e">LIVE</span>';
    document.getElementById('livepanel').style.display = 'block';
    const total1h = j.chart_1h.reduce((a, d) => a + d[1], 0);
    document.getElementById('livetotal').textContent = total1h.toLocaleString('id-ID');
    document.getElementById('livetime').textContent = 'update ' + j.generated_human;
    const ut = document.getElementById('updatetime');
    if (ut) ut.textContent = 'live update ' + j.generated_human;
    drawChart(j.chart_1h);
    drawHeatmap(j.heatmap_24h);
    drawTrend(j.trend_7d);
    drawTasks(j.tasks_24h);
    drawModels(j.model_details);
    drawPaperclip(j.paperclip);
    // Update stat cards dari live data
    const sr = document.getElementById('st-req');
    if (sr) sr.textContent = j.total_24h.toLocaleString('id-ID');
    // Success rate dari providers
    let ok = 0, tot = 0;
    for (const p of Object.values(j.providers_24h || {})) { ok += p.ok || 0; tot += p.requests || 0; }
    const srel = document.getElementById('st-rate');
    if (srel && tot) srel.textContent = Math.round(ok/tot*100) + '%';
    document.getElementById('st-cost').textContent = 'Rp ' + j.est_cost_rp.toLocaleString('id-ID');
    const tr = document.getElementById('st-trend');
    if (tr) {
      const pct = j.trend_pct;
      tr.innerHTML = pct >= 0
        ? '<span class="ok">▲ +' + pct + '%</span> vs kemarin'
        : '<span class="bad">▼ ' + pct + '%</span> vs kemarin';
    }
    const dead = Object.entries(j.health || {}).filter(kv => kv[1] === 'dead');
    document.getElementById('livehealth').innerHTML = dead.length
      ? dead.map(kv => '<span style="color:#ef4444">🔴 ' + kv[0] + ' mati</span>').join(' ')
      : '<span style="color:#22c55e">✅ semua provider sehat</span>';
  } catch(e) {
    badge.innerHTML = '<span style="color:#f59e0b">● offline</span>';
    badge.title = 'Error: ' + e.message;
  }
}
pollLive();
setInterval(pollLive, 15000);
