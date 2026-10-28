import { spawn } from 'child_process';
import readline from 'readline';

console.log("🔍 Inspecting Figma node 4003:15509 with top-level return...");

const mcp = spawn('npx', ['-y', 'figma-console-mcp@latest'], {
  shell: true,
  env: {
    ...process.env,
    PATH: 'C:\\Program Files\\nodejs;' + (process.env.PATH || '')
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

const rl = readline.createInterface({ input: mcp.stdout });
let id = 1;

function send(method, params = {}) {
  const req = { jsonrpc: '2.0', id: id++, method, params };
  mcp.stdin.write(JSON.stringify(req) + '\n');
  return req.id;
}

let statusReqId = null;
let execReqId = null;
let pollTimer = null;
let isConnected = false;

function checkStatus() {
  if (isConnected) return;
  statusReqId = send('tools/call', {
    name: 'figma_get_status',
    arguments: { probe: true }
  });
}

rl.on('line', (line) => {
  try {
    const res = JSON.parse(line);

    if (res.id === 1) {
      mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      checkStatus();
      pollTimer = setInterval(checkStatus, 2000);
    } else if (res.id === statusReqId) {
      const text = res.result?.content?.[0]?.text || '';
      if (text.includes('"connected":true') || text.includes('EZ5hwh5VHPx88oZ3tAaWiX') || text.includes('Super Stager')) {
        isConnected = true;
        clearInterval(pollTimer);
        console.log("✓ Connected. Executing inspection...");

        const code = `
          const node = await figma.getNodeByIdAsync("4003:15509");
          const pages = figma.root.children.map(p => ({
            id: p.id,
            name: p.name,
            childCount: p.children.length
          }));

          let childrenSummary = [];
          if (node && 'children' in node) {
            childrenSummary = node.children.map(c => ({
              id: c.id,
              name: c.name,
              type: c.type,
              x: c.x,
              y: c.y,
              width: c.width,
              height: c.height
            }));
          }

          return {
            currentPage: figma.currentPage.name,
            nodeFound: !!node,
            nodeName: node ? node.name : null,
            nodeType: node ? node.type : null,
            nodeDimensions: node ? { width: node.width, height: node.height } : null,
            childrenCount: childrenSummary.length,
            childrenSummary,
            pages
          };
        `;

        execReqId = send('tools/call', {
          name: 'figma_execute',
          arguments: { code }
        });
      }
    } else if (res.id === execReqId) {
      console.log("=== FIGMA NODE INSPECTION RESULT ===");
      console.log(JSON.stringify(res.result || res.error, null, 2));
      setTimeout(() => {
        mcp.kill();
        process.exit(0);
      }, 500);
    }
  } catch (e) {}
});

send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'antigravity-client', version: '1.0.0' }
});
