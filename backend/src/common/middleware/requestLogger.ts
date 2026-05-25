import type { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set(['password', 'token', 'accessToken', 'refreshToken', 'currentPassword', 'newPassword', 'otp', 'secret', 'authorization']);

const R = '\x1b[0m';
const B = '\x1b[1m';

function out(s: string): void {
  try { process.stdout.write(s + '\n'); } catch { /* silent */ }
}

const C = {
  grn: '\x1b[38;2;0;200;83m',
  ylw: '\x1b[38;2;255;193;7m',
  red: '\x1b[38;2;244;67;54m',
  cyn: '\x1b[38;2;0;229;255m',
  blu: '\x1b[38;2;33;150;243m',
  mag: '\x1b[38;2;156;39;176m',
  wht: '\x1b[38;2;255;255;255m',
  gry: '\x1b[38;2;180;180;180m',
  org: '\x1b[38;2;255;152;0m',
  mut: '\x1b[38;2;140;140;140m',
};

const BG = {
  grn: '\x1b[48;2;0;200;83m',
  ylw: '\x1b[48;2;255;193;7m',
  red: '\x1b[48;2;244;67;54m',
  blu: '\x1b[48;2;33;150;243m',
  cyn: '\x1b[48;2;0;229;255m',
  mag: '\x1b[48;2;156;39;176m',
  wht: '\x1b[48;2;255;255;255m',
};

const W = 76;

const METHOD: Record<string, { badge: string; bg: string; fg: string }> = {
  GET:    { badge: ' GET ', bg: BG.grn, fg: C.grn },
  POST:   { badge: ' POST ', bg: BG.cyn, fg: C.cyn },
  PUT:    { badge: ' PUT ', bg: BG.blu, fg: C.blu },
  PATCH:  { badge: 'PATCH', bg: BG.mag, fg: C.mag },
  DELETE: { badge: 'DELTE', bg: BG.red, fg: C.red },
};

function shortId(id: string): string {
  return (id.split('-').pop() || id).slice(0, 8);
}

function maskSensitive(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  const masked: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    masked[key] = SENSITIVE_KEYS.has(key) ? '••••••••' : maskSensitive(val);
  }
  return masked;
}

function strip(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function header(content: string, color: string): void {
  const raw = strip(content);
  const gap = W - raw.length - 2;
  const L = Math.floor(gap / 2);
  const R_ = gap - L;
  out(`  ${C.wht}┌${R}${color}${'─'.repeat(L)}${R} ${content} ${color}${'─'.repeat(R_)}${R}${C.wht}┐${R}`);
}

function ln(content: string): void {
  const raw = strip(content);
  const pad = W - 2 - raw.length;
  if (pad <= 0) {
    out(`  ${C.wht}│${R}  ${raw.slice(0, W - 2)}${C.wht}│${R}`);
  } else {
    out(`  ${C.wht}│${R}  ${content}${' '.repeat(pad)}${C.wht}│${R}`);
  }
}

function footer(color: string): void {
  out(`  ${C.wht}└${R}${color}${'─'.repeat(W)}${R}${C.wht}┘${R}`);
}

function blank(): void {
  ln('');
}

function methodMeta(code: number): { bg: string; fg: string; icon: string; text: string } {
  if (code < 300) return { bg: BG.grn, fg: C.grn, icon: '✓', text: statusText(code) };
  if (code < 400) return { bg: BG.ylw, fg: C.ylw, icon: '↗', text: statusText(code) };
  if (code < 500) return { bg: BG.ylw, fg: C.ylw, icon: '⚠', text: statusText(code) };
  return { bg: BG.red, fg: C.red, icon: '✗', text: statusText(code) };
}

function statusText(code: number): string {
  const m: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable', 429: 'Too Many',
    500: 'Error', 502: 'Bad Gateway', 503: 'Unavailable',
  };
  return m[code] || '';
}

function timeBar(ms: number): { c: string; label: string; pct: number } {
  if (ms < 100)  return { c: C.grn, label: 'fast', pct: ms / 100 };
  if (ms < 300)  return { c: C.cyn, label: 'good', pct: ms / 300 };
  if (ms < 600)  return { c: C.ylw, label: 'okay', pct: ms / 600 };
  if (ms < 1000) return { c: C.org, label: 'slow', pct: ms / 1000 };
  return { c: C.red, label: 'fail', pct: Math.min(1, ms / 3000) };
}

function gauge(pct: number, color: string): string {
  const filled = Math.max(1, Math.round(pct * 16));
  const empty = 16 - filled;
  return `${color}${'█'.repeat(filled)}${R}${C.mut}${'░'.repeat(empty)}${R}`;
}

function fmtJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

function highlightJsonLine(l: string, keyColor: string): string {
  return l
    .replace(/"([^"]+)"(?=\s*:)/g, `${keyColor}$1${R}`)
    .replace(/:\s*"(.*?)"/g, `: ${C.mut}"${R}${C.grn}$1${R}${C.mut}"${R}`)
    .replace(/:\s*(\d+\.?\d*)/g, `: ${C.org}$1${R}`)
    .replace(/:\s*(true|false)/g, `: ${C.mag}$1${R}`)
    .replace(/:\s*null/g, `: ${C.red}null${R}`);
}

function collectQueryParams(url: string): Record<string, string> | null {
  const idx = url.indexOf('?');
  if (idx === -1) return null;
  const qs = url.slice(idx + 1);
  if (!qs) return null;
  const params: Record<string, string> = {};
  for (const part of qs.split('&')) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      params[decodeURIComponent(part)] = '';
    } else {
      params[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
    }
  }
  return params;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  try {
    const start = Date.now();
    const rid = shortId(req.id);
    const m = METHOD[req.method] || { badge: ' ??? ', bg: BG.wht, fg: C.wht };

    const originalJson = res.json.bind(res);
    let capturedBody: unknown = null;

    res.json = function (body: unknown): Response {
      capturedBody = body;
      return originalJson(body);
    };

    const maskedBody = req.body && typeof req.body === 'object' && Object.keys(req.body).length
      ? maskSensitive(req.body)
      : null;

    const queryParams = collectQueryParams(req.originalUrl || req.url || '');

    const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userTag = req.account
      ? ` ${C.grn}${req.account.sub.slice(0, 8)}${R}`
      : '';

    const rawUrl = req.originalUrl || req.url || '';
    const qIdx = rawUrl.indexOf('?');
    const pathOnly = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);
    const methodBadge = `${m.bg}${B}${C.wht}${m.badge}${R}`;

    out('');
    header(`▶  ${B}${C.wht}REQUEST${R}`, C.cyn);
    ln(`${methodBadge}  ${B}${C.wht}${pathOnly}${R}`);
    ln(`${C.mut}${ts}${R}  ${C.mut}│${R}  ${C.gry}${rid}${R}  ${C.mut}│${R}  ${C.gry}${req.ip || req.socket.remoteAddress}${R}${userTag}`);

    if (queryParams) {
      blank();
      for (const [k, v] of Object.entries(queryParams)) {
        ln(` ${C.cyn}${k}${R}  ${C.mut}=${R}  ${C.grn}${v}${R}`);
      }
    }

    if (maskedBody) {
      blank();
      for (const line of fmtJson(maskedBody).split('\n')) {
        ln(` ${C.mut}${line.replace(/"([^"]+)"(?=\s*:)/g, (_, k) => `${C.cyn}${k}${R}`)}${R}`);
      }
    }

    footer(C.cyn);

    res.on('finish', () => {
      try {
        const dur = Date.now() - start;
        const st = methodMeta(res.statusCode);
        const tb = timeBar(dur);
        const cl = res.getHeader('content-length');
        const clStr = cl ? `${C.mut}│${R}  ${C.gry}${cl} B${R}` : '';

        header(`${st.icon}  ${B}${C.wht}${res.statusCode}  ${st.text}${R}`, st.fg);
        ln(`${B}${tb.c}${dur}ms${R}  ${gauge(tb.pct, tb.c)}  ${C.gry}${tb.label}${R}  ${clStr}`);

        if (capturedBody) {
          blank();
          const maskedRes = maskSensitive(capturedBody);
          for (const line of fmtJson(maskedRes).split('\n')) {
            ln(` ${C.mut}${highlightJsonLine(line, st.fg)}${R}`);
          }
        }

        footer(st.fg);
        out('');
      } catch { /* silent */ }
    });

    next();
  } catch (e) {
    console.error('[requestLogger] error:', e);
    next();
  }
}
