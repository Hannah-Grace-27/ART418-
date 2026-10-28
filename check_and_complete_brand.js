import { spawn } from 'child_process';
import readline from 'readline';

console.log("🔍 Checking what was created and completing the brand system...");

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
  statusReqId = send('tools/call', { name: 'figma_get_status', arguments: { probe: true } });
}

rl.on('line', (line) => {
  try {
    const res = JSON.parse(line);

    if (res.id === 1) {
      console.log("✓ MCP initialized. Checking bridge...");
      mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      checkStatus();
      pollTimer = setInterval(checkStatus, 2000);
    } else if (res.id === statusReqId) {
      const text = res.result?.content?.[0]?.text || '';
      const connected = text.includes('"connected":true') || text.includes('Super Stager') || text.includes('I1yx2wSHzBlMUNpeiWj2Zb') || text.includes('EZ5hwh5VHPx88oZ3tAaWiX');
      if (connected && !isConnected) {
        isConnected = true;
        clearInterval(pollTimer);
        const fileName = (text.match(/"currentFileName":"([^"]+)"/) || [])[1] || 'Unknown';
        console.log(`🎉 Connected to: ${fileName}`);
        console.log("📋 Running brand inspection + completion code...");

        // The code run inside Figma plugin context
        const code = `
(async () => {
  const log = [];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function rgb(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.slice(0,2),16)/255,
      g: parseInt(hex.slice(2,4),16)/255,
      b: parseInt(hex.slice(4,6),16)/255
    };
  }

  async function loadFonts() {
    const fonts = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Medium' },
    ];
    for (const f of fonts) {
      try { await figma.loadFontAsync(f); } catch(e) {}
    }
  }
  await loadFonts();

  // ── 1. Inspect all pages ──────────────────────────────────────────────────
  const pageNames = figma.root.children.map(p => p.name);
  log.push('PAGES: ' + pageNames.join(' | '));

  // ── 2. Find the target brand page ─────────────────────────────────────────
  const brandPage =
    figma.root.children.find(p => /brand|book|style/i.test(p.name)) ||
    figma.root.children[0];

  log.push('Using page: ' + brandPage.name);

  // ── 3. Check / scan existing frames ──────────────────────────────────────
  const existingFrames = brandPage.children.map(n => n.name).slice(0, 10);
  log.push('Existing frames: ' + existingFrames.join(', '));

  // ── 4. Build Color Palette Frame if not already present ───────────────────
  const alreadyHasPalette = brandPage.children.some(n => n.name.includes('Color Palette'));
  if (!alreadyHasPalette) {
    log.push('Creating Color Palette frame...');
    const palette = figma.createFrame();
    palette.name = 'Super Stager · Color Palette';
    palette.resize(1200, 360);
    palette.cornerRadius = 20;
    palette.fills = [{ type: 'SOLID', color: rgb('#FCF7F0') }];
    palette.strokes = [{ type: 'SOLID', color: { r:0, g:0, b:0 } }];
    palette.strokeWeight = 3;
    palette.x = 0;
    palette.y = -400;

    // Title
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Bold' };
    t.fontSize = 28;
    t.characters = 'Super Stager · Brand Color System';
    t.x = 40; t.y = 28;
    palette.appendChild(t);

    const colors = [
      { name: 'Mint Green',  hex: '#6FC774', role: 'Primary · Available / Growth' },
      { name: 'Deep Pool',   hex: '#057FA8', role: 'Secondary · Info / Trust' },
      { name: 'Red Plum',    hex: '#A80550', role: 'Accent · Urgent / Alert' },
      { name: 'Sunny',       hex: '#EBC25B', role: 'Highlight · CTA / Warmth' },
      { name: 'Paper Canvas',hex: '#FCF7F0', role: 'Background · Retro Warmth' },
      { name: 'Ink Black',   hex: '#1A1A1A', role: 'Text · Body / Outlines' },
    ];

    let cx = 40;
    for (const c of colors) {
      const swatch = figma.createFrame();
      swatch.name = c.name;
      swatch.resize(168, 240);
      swatch.cornerRadius = 16;
      swatch.fills = [{ type: 'SOLID', color: { r:1, g:1, b:1 } }];
      swatch.strokes = [{ type: 'SOLID', color: { r:0, g:0, b:0 } }];
      swatch.strokeWeight = 2;
      swatch.x = cx; swatch.y = 80;

      // Color block
      const block = figma.createFrame();
      block.resize(168, 120);
      block.cornerRadius = 12;
      block.fills = [{ type: 'SOLID', color: rgb(c.hex) }];
      block.strokes = [{ type: 'SOLID', color: { r:0, g:0, b:0 } }];
      block.strokeWeight = 1.5;
      block.x = 0; block.y = 0;
      swatch.appendChild(block);

      const nm = figma.createText();
      nm.fontName = { family: 'Inter', style: 'Bold' };
      nm.fontSize = 13;
      nm.characters = c.name;
      nm.x = 12; nm.y = 128;
      swatch.appendChild(nm);

      const hx = figma.createText();
      hx.fontName = { family: 'Inter', style: 'Regular' };
      hx.fontSize = 11;
      hx.characters = c.hex;
      hx.fills = [{ type:'SOLID', color:{r:0.4,g:0.4,b:0.4} }];
      hx.x = 12; hx.y = 148;
      swatch.appendChild(hx);

      const rl2 = figma.createText();
      rl2.fontName = { family: 'Inter', style: 'Regular' };
      rl2.fontSize = 10;
      rl2.characters = c.role;
      rl2.fills = [{ type:'SOLID', color:{r:0.5,g:0.5,b:0.5} }];
      rl2.x = 12; rl2.y = 168;
      rl2.resize(144, 60);
      swatch.appendChild(rl2);

      palette.appendChild(swatch);
      cx += 188;
    }

    brandPage.appendChild(palette);
    log.push('Color Palette frame created!');
  } else {
    log.push('Color Palette already exists, skipping.');
  }

  // ── 5. Build Typography Frame ─────────────────────────────────────────────
  const alreadyHasType = brandPage.children.some(n => n.name.includes('Typography'));
  if (!alreadyHasType) {
    log.push('Creating Typography frame...');
    const typo = figma.createFrame();
    typo.name = 'Super Stager · Typography System';
    typo.resize(1200, 500);
    typo.cornerRadius = 20;
    typo.fills = [{ type: 'SOLID', color: { r:1, g:1, b:1 } }];
    typo.strokes = [{ type: 'SOLID', color: { r:0, g:0, b:0 } }];
    typo.strokeWeight = 3;
    typo.x = 0;
    typo.y = -820;

    const tt = figma.createText();
    tt.fontName = { family: 'Inter', style: 'Bold' };
    tt.fontSize = 28;
    tt.characters = 'Super Stager · Typography System';
    tt.x = 40; tt.y = 28;
    typo.appendChild(tt);

    const typeSpecsData = [
      { label: 'Display / Hero', name: 'BC Alphapipe Bold (substitute: Inter Bold)', size: '48–72px', use: 'Product name lockup, hero headers', sample: 'Super Stager' },
      { label: 'Heading 1', name: 'All Round Gothic (substitute: Inter Bold)', size: '32–40px', use: 'Page / section titles', sample: 'Warehouse Dashboard' },
      { label: 'Heading 2', name: 'All Round Gothic Medium (substitute: Inter Medium)', size: '20–28px', use: 'Card headers, sub-section titles', sample: 'Active Staging Projects' },
      { label: 'Body Text', name: 'Lato Regular (substitute: Inter Regular)', size: '14–16px', use: 'Content, descriptions, labels', sample: 'Track your inventory across all warehouse zones with ease.' },
      { label: 'Caption / Badge', name: 'Inter Bold', size: '9–12px', use: 'Status chips, tags, fine print', sample: 'AVAILABLE · STAGED · URGENT' },
    ];

    let ty = 88;
    for (const spec of typeSpecsData) {
      const row = figma.createFrame();
      row.name = spec.label;
      row.resize(1120, 72);
      row.cornerRadius = 12;
      row.fills = [{ type:'SOLID', color:{r:0.98,g:0.97,b:0.94} }];
      row.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
      row.strokeWeight = 1.5;
      row.x = 40; row.y = ty;

      const lbl = figma.createText();
      lbl.fontName = { family:'Inter', style:'Bold' };
      lbl.fontSize = 11;
      lbl.characters = spec.label.toUpperCase();
      lbl.fills = [{ type:'SOLID', color:{r:0.3,g:0.3,b:0.3} }];
      lbl.x = 16; lbl.y = 10;
      row.appendChild(lbl);

      const nm2 = figma.createText();
      nm2.fontName = { family:'Inter', style:'Regular' };
      nm2.fontSize = 12;
      nm2.characters = spec.name + ' · ' + spec.size;
      nm2.x = 16; nm2.y = 28;
      row.appendChild(nm2);

      const samp = figma.createText();
      samp.fontName = { family:'Inter', style:'Bold' };
      samp.fontSize = 13;
      samp.characters = spec.sample;
      samp.fills = [{ type:'SOLID', color:{r:0.02,g:0.5,b:0.66} }];
      samp.x = 520; samp.y = 22;
      row.appendChild(samp);

      typo.appendChild(row);
      ty += 84;
    }

    brandPage.appendChild(typo);
    log.push('Typography frame created!');
  } else {
    log.push('Typography already exists, skipping.');
  }

  // ── 6. Build Spacing & Grid Token Frame ──────────────────────────────────
  const alreadyHasSpacing = brandPage.children.some(n => n.name.includes('Spacing') || n.name.includes('Grid'));
  if (!alreadyHasSpacing) {
    log.push('Creating Spacing & Grid frame...');
    const grid = figma.createFrame();
    grid.name = 'Super Stager · Spacing & Grid Tokens';
    grid.resize(1200, 280);
    grid.cornerRadius = 20;
    grid.fills = [{ type:'SOLID', color:rgb('#FCF7F0') }];
    grid.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    grid.strokeWeight = 3;
    grid.x = 0;
    grid.y = -1160;

    const gt = figma.createText();
    gt.fontName = { family:'Inter', style:'Bold' };
    gt.fontSize = 24;
    gt.characters = 'Super Stager · Spacing & Grid Tokens';
    gt.x = 40; gt.y = 24;
    grid.appendChild(gt);

    const spacingTokens = [
      { name: 'space-1',  val: '4px',   desc: 'Micro gap' },
      { name: 'space-2',  val: '8px',   desc: 'Tight padding' },
      { name: 'space-3',  val: '12px',  desc: 'Compact chip' },
      { name: 'space-4',  val: '16px',  desc: 'Base unit' },
      { name: 'space-5',  val: '24px',  desc: 'Card padding' },
      { name: 'space-6',  val: '32px',  desc: 'Section gap' },
      { name: 'radius-sm','val': '8px', desc: 'Chip/tag' },
      { name: 'radius-md','val': '16px',desc: 'Card corner' },
      { name: 'radius-lg','val': '24px',desc: 'Panel corner' },
      { name: 'radius-xl','val': '44px',desc: 'Phone frame' },
    ];

    let sx2 = 40;
    for (const tok of spacingTokens) {
      const pill2 = figma.createFrame();
      pill2.name = tok.name;
      pill2.resize(108, 120);
      pill2.cornerRadius = 12;
      pill2.fills = [{ type:'SOLID', color:{r:1,g:1,b:1} }];
      pill2.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
      pill2.strokeWeight = 1.5;
      pill2.x = sx2; pill2.y = 68;

      const box = figma.createFrame();
      const boxSize = Math.min(parseInt(tok.val) * 2, 60);
      box.resize(boxSize, boxSize);
      box.cornerRadius = tok.name.includes('radius') ? parseInt(tok.val) : 2;
      box.fills = [{ type:'SOLID', color:rgb('#057FA8') }];
      box.x = (108-boxSize)/2; box.y = 8;
      pill2.appendChild(box);

      const tn = figma.createText();
      tn.fontName = { family:'Inter', style:'Bold' };
      tn.fontSize = 10;
      tn.characters = tok.name;
      tn.x = 8; tn.y = 72;
      pill2.appendChild(tn);

      const tv = figma.createText();
      tv.fontName = { family:'Inter', style:'Regular' };
      tv.fontSize = 12;
      tv.characters = tok.val;
      tv.x = 8; tv.y = 86;
      pill2.appendChild(tv);

      grid.appendChild(pill2);
      sx2 += 116;
    }

    brandPage.appendChild(grid);
    log.push('Spacing & Grid frame created!');
  } else {
    log.push('Spacing & Grid already exists, skipping.');
  }

  // ── 7. Build Component Library Preview ─────────────────────────────────
  const alreadyHasComp = brandPage.children.some(n => n.name.includes('Component'));
  if (!alreadyHasComp) {
    log.push('Creating Component Library frame...');
    const comp = figma.createFrame();
    comp.name = 'Super Stager · Component Library';
    comp.resize(1200, 420);
    comp.cornerRadius = 20;
    comp.fills = [{ type:'SOLID', color:{r:1,g:1,b:1} }];
    comp.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    comp.strokeWeight = 3;
    comp.x = 0;
    comp.y = -1500;

    const ct = figma.createText();
    ct.fontName = { family:'Inter', style:'Bold' };
    ct.fontSize = 24;
    ct.characters = 'Super Stager · Component Library';
    ct.x = 40; ct.y = 24;
    comp.appendChild(ct);

    // Primary Button
    const btn1 = figma.createFrame();
    btn1.name = 'Button · Primary (Sunny CTA)';
    btn1.resize(200, 48);
    btn1.cornerRadius = 999;
    btn1.fills = [{ type:'SOLID', color:rgb('#EBC25B') }];
    btn1.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    btn1.strokeWeight = 2;
    btn1.x = 40; btn1.y = 80;
    const btn1t = figma.createText();
    btn1t.fontName = { family:'Inter', style:'Bold' };
    btn1t.fontSize = 14;
    btn1t.characters = 'Tag New Item';
    btn1t.x = 48; btn1t.y = 14;
    btn1.appendChild(btn1t);
    comp.appendChild(btn1);

    // Secondary Button
    const btn2 = figma.createFrame();
    btn2.name = 'Button · Secondary (Outline)';
    btn2.resize(200, 48);
    btn2.cornerRadius = 999;
    btn2.fills = [{ type:'SOLID', color:{r:1,g:1,b:1} }];
    btn2.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    btn2.strokeWeight = 2;
    btn2.x = 260; btn2.y = 80;
    const btn2t = figma.createText();
    btn2t.fontName = { family:'Inter', style:'Bold' };
    btn2t.fontSize = 14;
    btn2t.characters = 'View Warehouse';
    btn2t.x = 28; btn2t.y = 14;
    btn2.appendChild(btn2t);
    comp.appendChild(btn2);

    // Status chips
    const chipColors = [
      { label:'Available', hex:'#6FC774' },
      { label:'Staged', hex:'#057FA8' },
      { label:'In Transit', hex:'#EBC25B' },
      { label:'Urgent', hex:'#A80550' },
    ];
    let chipX = 40;
    for (const ch of chipColors) {
      const chip = figma.createFrame();
      chip.name = 'Chip · ' + ch.label;
      chip.resize(100, 28);
      chip.cornerRadius = 999;
      chip.fills = [{ type:'SOLID', color:rgb(ch.hex) }];
      chip.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
      chip.strokeWeight = 1.5;
      chip.x = chipX; chip.y = 152;
      const cht = figma.createText();
      cht.fontName = { family:'Inter', style:'Bold' };
      cht.fontSize = 11;
      cht.characters = ch.label;
      cht.x = 12; cht.y = 7;
      chip.appendChild(cht);
      comp.appendChild(chip);
      chipX += 116;
    }

    // Inventory Card
    const card = figma.createFrame();
    card.name = 'Card · Inventory Item';
    card.resize(360, 120);
    card.cornerRadius = 16;
    card.fills = [{ type:'SOLID', color:rgb('#FCF7F0') }];
    card.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    card.strokeWeight = 2;
    card.x = 40; card.y = 208;
    const cTitle = figma.createText();
    cTitle.fontName = { family:'Inter', style:'Bold' };
    cTitle.fontSize = 15;
    cTitle.characters = 'Boucle Curve Sofa';
    cTitle.x = 16; cTitle.y = 16;
    card.appendChild(cTitle);
    const cSub = figma.createText();
    cSub.fontName = { family:'Inter', style:'Regular' };
    cSub.fontSize = 12;
    cSub.characters = 'SKU: S-204 · Zone A · Bay 3 · Shelf 1';
    cSub.fills = [{ type:'SOLID', color:{r:0.4,g:0.4,b:0.4} }];
    cSub.x = 16; cSub.y = 44;
    card.appendChild(cSub);
    const cChip = figma.createFrame();
    cChip.resize(80,22);
    cChip.cornerRadius = 999;
    cChip.fills = [{ type:'SOLID', color:rgb('#6FC774') }];
    cChip.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    cChip.strokeWeight = 1;
    cChip.x = 264; cChip.y = 16;
    const ccT = figma.createText();
    ccT.fontName = { family:'Inter', style:'Bold' };
    ccT.fontSize = 9;
    ccT.characters = 'AVAILABLE';
    ccT.x = 8; ccT.y = 6;
    cChip.appendChild(ccT);
    card.appendChild(cChip);
    comp.appendChild(card);

    // Nav Bar component
    const nav = figma.createFrame();
    nav.name = 'Nav Bar · Bottom Navigation';
    nav.resize(390, 56);
    nav.cornerRadius = 28;
    nav.fills = [{ type:'SOLID', color:{r:1,g:1,b:1} }];
    nav.strokes = [{ type:'SOLID', color:{r:0,g:0,b:0} }];
    nav.strokeWeight = 2;
    nav.x = 40; nav.y = 348;
    const navT = figma.createText();
    navT.fontName = { family:'Inter', style:'Bold' };
    navT.fontSize = 12;
    navT.characters = '⊞ Home   📦 Projects   🔖 Tag   🗺 Map   🏠 3D Room';
    navT.x = 24; navT.y = 18;
    nav.appendChild(navT);
    comp.appendChild(nav);

    brandPage.appendChild(comp);
    log.push('Component Library frame created!');
  } else {
    log.push('Component Library already exists, skipping.');
  }

  figma.notify('✅ Super Stager brand system fully documented in Figma!', { timeout: 5000 });
  return JSON.stringify({ success: true, log });
})()
        `;

        execReqId = send('tools/call', { name: 'figma_execute', arguments: { code } });
      }
    } else if (res.id === execReqId) {
      console.log("=== RESULT ===");
      const content = res.result?.content?.[0]?.text || JSON.stringify(res.error);
      console.log(content);

      // Parse the log if possible
      try {
        const parsed = JSON.parse(content);
        if (parsed.resultAnalysis?.isUndefined) {
          console.log("⚠️  Result was undefined — the code ran but didn't return properly.");
          console.log("    This may still mean the frames were created in Figma.");
        } else {
          const inner = JSON.parse(parsed.result || '{}');
          if (inner.log) {
            console.log("\n📋 Execution Log:");
            inner.log.forEach(l => console.log("  •", l));
          }
        }
      } catch(e) {}

      console.log("\n🏆 Done! Check your Figma file for new brand frames.");
      setTimeout(() => { mcp.kill(); process.exit(0); }, 1000);
    }
  } catch (e) {}
});

send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'antigravity-client', version: '1.0.0' }
});
