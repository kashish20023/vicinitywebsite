const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

async function getWsPageUrl(port = 9250) {
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
      await new Promise(r => setTimeout(r, 250));
    }
  }
  throw new Error('Chrome remote debugging page target did not become available on port ' + port);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
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

  async screenshot(filepath, fullPage = false) {
    let params = { format: 'png' };
    if (fullPage) {
      const metrics = await this.send('Page.getLayoutMetrics');
      const width = Math.ceil(metrics.contentSize ? metrics.contentSize.width : metrics.cssContentSize.width);
      const height = Math.ceil(metrics.contentSize ? metrics.contentSize.height : metrics.cssContentSize.height);
      params.captureBeyondViewport = true;
      params.clip = { x: 0, y: 0, width, height, scale: 1 };
    }
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

let cdpPortCounter = 9300;

async function captureViewport(url, width, height, outputPath, fullPage = false) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = ++cdpPortCounter;
  const userDataDir = 'C:\\Users\\shubham\\AppData\\Local\\Temp\\chrome_cdp_profile_' + port + '_' + Date.now();
  
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { detached: false });

  try {
    const wsUrl = await getWsPageUrl(port);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: width,
      height: height,
      deviceScaleFactor: 1,
      mobile: width < 600
    });

    console.log(`[Navigating] -> ${url} (${width}x${height})`);
    await client.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 3500)); // Wait for images, fonts, hydration

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await client.screenshot(outputPath, fullPage);
    console.log(`[Captured] -> ${outputPath} (${fs.statSync(outputPath).size} bytes)`);

    client.close();
  } finally {
    if (chromeProcess && chromeProcess.pid) {
      try {
        execSync(`taskkill /pid ${chromeProcess.pid} /f /t 2>nul`);
      } catch (e) {}
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

async function run() {
  const url = 'http://localhost:3000';
  console.log('--- CAPTURING MANDATORY STUDIO I BASELINE SCREENSHOTS ---');
  
  const viewports = [
    { name: 'baseline_1440_desktop.png', width: 1440, height: 900 },
    { name: 'baseline_768_tablet.png', width: 768, height: 1024 },
    { name: 'baseline_390_mobile.png', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const docPath = path.join(__dirname, '../../docs/studio-i/baselines', vp.name);
    const qaPath = path.join(__dirname, 'baselines', vp.name);
    
    await captureViewport(url, vp.width, vp.height, docPath, false);
    fs.copyFileSync(docPath, qaPath);
  }

  console.log('--- ALL BASELINE SCREENSHOTS CAPTURED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Error capturing baselines:', err);
  process.exit(1);
});
