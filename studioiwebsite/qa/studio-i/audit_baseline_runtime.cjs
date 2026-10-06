const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

async function getWsPageUrl(port = 9310) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/list`, (r) => {
          let d = '';
          r.on('data', chunk => d += chunk);
          r.on('end', () => {
            try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      if (Array.isArray(res) && res.length > 0) {
        const page = res.find(p => p.type === 'page') || res[0];
        if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Chrome remote debugging target failed on port ' + port);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.events = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        } else if (msg.method) {
          this.events.push(msg);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function auditBaseline() {
  const port = 9310;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\shubham\\AppData\\Local\\Temp\\chrome_cdp_profile_' + port + '_' + Date.now();

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'about:blank'
  ], { detached: false });

  try {
    const wsUrl = await getWsPageUrl(port);
    const client = new CDPClient(wsUrl);
    await client.connect();

    const consoleMessages = [];
    const networkRequests = [];
    const failedRequests = [];

    await client.send('Page.enable');
    await client.send('Network.enable');
    await client.send('Runtime.enable');

    // Subscribe to events
    client.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push({
          type: msg.params.type,
          text: msg.params.args.map(a => a.value || a.description || '').join(' ')
        });
      }
      if (msg.method === 'Network.responseReceived') {
        const { url, status, mimeType, timing } = msg.params.response;
        networkRequests.push({ url, status, mimeType });
        if (status >= 400) {
          failedRequests.push({ url, status });
        }
      }
      if (msg.method === 'Network.loadingFailed') {
        failedRequests.push({ url: msg.params.requestId, error: msg.params.errorText });
      }
    });

    const start = Date.now();
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 4000));
    const loadDurationMs = Date.now() - start;

    console.log('--- BASELINE RUNTIME AUDIT RESULTS ---');
    console.log('Page Navigation Time:', loadDurationMs, 'ms');
    console.log('Total Network Requests:', networkRequests.length);
    console.log('Failed Requests (status >= 400):', failedRequests.length, failedRequests);
    console.log('Console Logs Captured:', consoleMessages.length, consoleMessages);

    const auditData = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3000',
      loadDurationMs,
      networkRequestsCount: networkRequests.length,
      failedRequests,
      consoleMessages
    };

    fs.writeFileSync(
      path.join(__dirname, '../../docs/studio-i/baseline_runtime_audit.json'),
      JSON.stringify(auditData, null, 2)
    );
    console.log('Saved baseline audit to docs/studio-i/baseline_runtime_audit.json');

    client.close();
  } finally {
    if (chromeProcess && chromeProcess.pid) {
      try {
        execSync(`taskkill /pid ${chromeProcess.pid} /f /t 2>nul`);
      } catch(e){}
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch(e){}
  }
}

auditBaseline().catch(console.error);
