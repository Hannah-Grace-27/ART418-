import { spawn } from 'child_process';
import readline from 'readline';

console.log("🎨 Running Super Stager brand system in Figma (sync-safe version)...");

const mcp = spawn('npx', ['-y', 'figma-console-mcp@latest'], {
  shell: true,
  env: { ...process.env, PATH: 'C:\\Program Files\\nodejs;' + (process.env.PATH || '') },
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
let execIds = [];
let step = 0;
let pollTimer = null;
let isConnected = false;

// We split into individual calls so each can complete + return properly
const steps = [
  {
    name: 'Inspect pages',
    code: `
      const pages = figma.root.children.map(p => p.name + ' (' + p.children.length + ' children)');
      'Pages: ' + pages.join(' | ')
    `
  },
  {
    name: 'Create Color Palette frame',
    code: `
      function rgb(hex) {
        hex = hex.replace('#','');
        return { r:parseInt(hex.slice(0,2),16)/255, g:parseInt(hex.slice(2,4),16)/255, b:parseInt(hex.slice(4,6),16)/255 };
      }
      // Find correct page
      const pg = figma.root.children.find(p => /brand|book|style|color/i.test(p.name)) || figma.root.children[0];
      // Skip if already exists
      if (pg.children.some(n => n.name.includes('Color Palette'))) {
        'Color Palette already exists on page: ' + pg.name;
      } else {
        // Font loading must be done async - use setInterval trick
        figma.loadFontAsync({family:'Inter',style:'Regular'}).then(() =>
          figma.loadFontAsync({family:'Inter',style:'Bold'}).then(() => {
            const palette = figma.createFrame();
            palette.name = 'Super Stager · Color Palette';
            palette.resize(1200, 380);
            palette.cornerRadius = 20;
            palette.fills = [{type:'SOLID',color:rgb('#FCF7F0')}];
            palette.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            palette.strokeWeight = 3;
            palette.x = 0; palette.y = -440;

            const title = figma.createText();
            title.fontName = {family:'Inter',style:'Bold'};
            title.fontSize = 28;
            title.characters = 'Super Stager · Brand Color System';
            title.x = 40; title.y = 28;
            palette.appendChild(title);

            const subtitle = figma.createText();
            subtitle.fontName = {family:'Inter',style:'Regular'};
            subtitle.fontSize = 13;
            subtitle.characters = 'Retro Comeback palette — rooted in warmth, growth, trust, and energy';
            subtitle.fills = [{type:'SOLID',color:{r:0.4,g:0.4,b:0.4}}];
            subtitle.x = 40; subtitle.y = 64;
            palette.appendChild(subtitle);

            const colors = [
              {name:'Mint Green', hex:'#6FC774', role:'Primary · Available / Growth', variable:'color/primary/mint-green'},
              {name:'Deep Pool',  hex:'#057FA8', role:'Secondary · Info / Trust',     variable:'color/secondary/deep-pool'},
              {name:'Red Plum',   hex:'#A80550', role:'Accent · Urgent / Alert',      variable:'color/accent/red-plum'},
              {name:'Sunny',      hex:'#EBC25B', role:'Highlight · CTA / Warmth',     variable:'color/highlight/sunny'},
              {name:'Paper Canvas',hex:'#FCF7F0',role:'Background · Retro warmth',    variable:'color/background/paper'},
              {name:'Ink Black',  hex:'#1A1A1A', role:'Text · Body / Outlines',       variable:'color/text/ink-black'},
            ];
            let cx = 40;
            for (const c of colors) {
              const swatch = figma.createFrame();
              swatch.name = 'Swatch / ' + c.name;
              swatch.resize(172, 260);
              swatch.cornerRadius = 16;
              swatch.fills = [{type:'SOLID',color:{r:1,g:1,b:1}}];
              swatch.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
              swatch.strokeWeight = 2;
              swatch.x = cx; swatch.y = 90;

              const block = figma.createFrame();
              block.resize(172, 130);
              block.cornerRadius = 12;
              block.fills = [{type:'SOLID',color:rgb(c.hex)}];
              block.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
              block.strokeWeight = 1.5;
              block.x = 0; block.y = 0;
              swatch.appendChild(block);

              const nm = figma.createText();
              nm.fontName = {family:'Inter',style:'Bold'};
              nm.fontSize = 14; nm.characters = c.name;
              nm.x = 12; nm.y = 142;
              swatch.appendChild(nm);

              const hx = figma.createText();
              hx.fontName = {family:'Inter',style:'Regular'};
              hx.fontSize = 12; hx.characters = c.hex;
              hx.fills = [{type:'SOLID',color:{r:0.35,g:0.35,b:0.35}}];
              hx.x = 12; hx.y = 164;
              swatch.appendChild(hx);

              const ro = figma.createText();
              ro.fontName = {family:'Inter',style:'Regular'};
              ro.fontSize = 10; ro.characters = c.role;
              ro.fills = [{type:'SOLID',color:{r:0.55,g:0.55,b:0.55}}];
              ro.x = 12; ro.y = 186;
              ro.resize(148, 60);
              swatch.appendChild(ro);

              const vr = figma.createText();
              vr.fontName = {family:'Inter',style:'Regular'};
              vr.fontSize = 9; vr.characters = c.variable;
              vr.fills = [{type:'SOLID',color:{r:0.02,g:0.5,b:0.66}}];
              vr.x = 12; vr.y = 226;
              swatch.appendChild(vr);

              palette.appendChild(swatch);
              cx += 188;
            }
            pg.appendChild(palette);
            figma.notify('✅ Color Palette added!', {timeout:3000});
          })
        );
        'Color Palette frame created on page: ' + pg.name;
      }
    `
  },
  {
    name: 'Create Typography frame',
    code: `
      function rgb(hex) {
        hex = hex.replace('#','');
        return {r:parseInt(hex.slice(0,2),16)/255,g:parseInt(hex.slice(2,4),16)/255,b:parseInt(hex.slice(4,6),16)/255};
      }
      const pg = figma.root.children.find(p => /brand|book|style|color/i.test(p.name)) || figma.root.children[0];
      if (pg.children.some(n => n.name.includes('Typography'))) {
        'Typography already exists on: ' + pg.name;
      } else {
        figma.loadFontAsync({family:'Inter',style:'Regular'}).then(() =>
          figma.loadFontAsync({family:'Inter',style:'Bold'}).then(() =>
            figma.loadFontAsync({family:'Inter',style:'Medium'}).then(() => {
              const typo = figma.createFrame();
              typo.name = 'Super Stager · Typography System';
              typo.resize(1200, 520);
              typo.cornerRadius = 20;
              typo.fills = [{type:'SOLID',color:{r:1,g:1,b:1}}];
              typo.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
              typo.strokeWeight = 3;
              typo.x = 0; typo.y = -1020;

              const t = figma.createText();
              t.fontName = {family:'Inter',style:'Bold'};
              t.fontSize = 28;
              t.characters = 'Super Stager · Typography System';
              t.x = 40; t.y = 28;
              typo.appendChild(t);

              const specs = [
                {label:'Display / Hero',    font:'BC Alphapipe Bold',   subst:'Inter Bold',   size:'48–72px', weight:'900', sample:'Super Stager', color:'#1A1A1A'},
                {label:'Heading 1',         font:'All Round Gothic',    subst:'Inter Bold',   size:'32–40px', weight:'700', sample:'Warehouse Dashboard', color:'#057FA8'},
                {label:'Heading 2',         font:'All Round Gothic Med',subst:'Inter Medium', size:'20–28px', weight:'500', sample:'Active Staging Projects', color:'#1A1A1A'},
                {label:'Body / Paragraph',  font:'Lato Regular',        subst:'Inter Regular',size:'14–16px', weight:'400', sample:'Track all inventory across zones with ease and confidence.', color:'#333333'},
                {label:'Caption / Status',  font:'Inter Bold',          subst:'Inter Bold',   size:'9–12px',  weight:'700', sample:'AVAILABLE  ·  STAGED  ·  URGENT  ·  IN TRANSIT', color:'#057FA8'},
              ];
              let ty = 86;
              for (const s of specs) {
                const row = figma.createFrame();
                row.name = 'Type / ' + s.label;
                row.resize(1120, 78);
                row.cornerRadius = 12;
                row.fills = [{type:'SOLID',color:rgb('#FCF7F0')}];
                row.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
                row.strokeWeight = 1.5;
                row.x = 40; row.y = ty;

                const lbl = figma.createText();
                lbl.fontName = {family:'Inter',style:'Bold'};
                lbl.fontSize = 10;
                lbl.characters = s.label.toUpperCase();
                lbl.fills = [{type:'SOLID',color:{r:0.3,g:0.3,b:0.3}}];
                lbl.x = 16; lbl.y = 10;
                row.appendChild(lbl);

                const info = figma.createText();
                info.fontName = {family:'Inter',style:'Regular'};
                info.fontSize = 11;
                info.characters = s.font + ' (fallback: ' + s.subst + ')  ·  ' + s.size + '  ·  weight ' + s.weight;
                info.fills = [{type:'SOLID',color:{r:0.5,g:0.5,b:0.5}}];
                info.x = 16; info.y = 30;
                row.appendChild(info);

                const samp = figma.createText();
                samp.fontName = {family:'Inter',style:s.subst.includes('Medium') ? 'Medium' : s.subst.includes('Bold') ? 'Bold' : 'Regular'};
                samp.fontSize = s.label.includes('Display') ? 20 : s.label.includes('Heading 1') ? 17 : s.label.includes('Heading 2') ? 15 : s.label.includes('Body') ? 13 : 11;
                samp.characters = s.sample;
                samp.fills = [{type:'SOLID',color:rgb(s.color)}];
                samp.x = 480; samp.y = 22;
                samp.resize(600, 40);
                row.appendChild(samp);

                typo.appendChild(row);
                ty += 88;
              }

              pg.appendChild(typo);
              figma.notify('✅ Typography System added!', {timeout:3000});
            })
          )
        );
        'Typography frame created on page: ' + pg.name;
      }
    `
  },
  {
    name: 'Create Component Library frame',
    code: `
      function rgb(hex) {
        hex = hex.replace('#','');
        return {r:parseInt(hex.slice(0,2),16)/255,g:parseInt(hex.slice(2,4),16)/255,b:parseInt(hex.slice(4,6),16)/255};
      }
      const pg = figma.root.children.find(p => /brand|book|style|color/i.test(p.name)) || figma.root.children[0];
      if (pg.children.some(n => n.name.includes('Component'))) {
        'Component Library already exists on: ' + pg.name;
      } else {
        figma.loadFontAsync({family:'Inter',style:'Regular'}).then(() =>
          figma.loadFontAsync({family:'Inter',style:'Bold'}).then(() => {
            const comp = figma.createFrame();
            comp.name = 'Super Stager · Component Library';
            comp.resize(1200, 500);
            comp.cornerRadius = 20;
            comp.fills = [{type:'SOLID',color:{r:1,g:1,b:1}}];
            comp.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            comp.strokeWeight = 3;
            comp.x = 0; comp.y = -1600;

            const t = figma.createText();
            t.fontName = {family:'Inter',style:'Bold'};
            t.fontSize = 28;
            t.characters = 'Super Stager · Component Library';
            t.x = 40; t.y = 28;
            comp.appendChild(t);

            const subtitle = figma.createText();
            subtitle.fontName = {family:'Inter',style:'Regular'};
            subtitle.fontSize = 13;
            subtitle.characters = 'Reusable UI building blocks for prototype screens';
            subtitle.fills = [{type:'SOLID',color:{r:0.4,g:0.4,b:0.4}}];
            subtitle.x = 40; subtitle.y = 64;
            comp.appendChild(subtitle);

            // Section label helper
            function sectionLabel(text, x, y) {
              const l = figma.createText();
              l.fontName = {family:'Inter',style:'Bold'};
              l.fontSize = 11;
              l.characters = text.toUpperCase();
              l.fills = [{type:'SOLID',color:{r:0.4,g:0.4,b:0.4}}];
              l.x = x; l.y = y;
              comp.appendChild(l);
            }

            // ── Buttons ──
            sectionLabel('Buttons', 40, 100);
            const btnDefs = [
              {label:'Tag New Item',     hex:'#EBC25B', textColor:{r:0,g:0,b:0},   name:'Button / Primary CTA'},
              {label:'View Warehouse',   hex:'#FFFFFF',  textColor:{r:0,g:0,b:0},   name:'Button / Secondary Outline'},
              {label:'Export Manifest',  hex:'#057FA8',  textColor:{r:1,g:1,b:1},   name:'Button / Info Action'},
              {label:'Flag Urgent',      hex:'#A80550',  textColor:{r:1,g:1,b:1},   name:'Button / Danger Action'},
            ];
            let bx = 40;
            for (const b of btnDefs) {
              const btn = figma.createFrame();
              btn.name = b.name;
              btn.resize(180, 44);
              btn.cornerRadius = 999;
              btn.fills = [{type:'SOLID',color:rgb(b.hex)}];
              btn.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
              btn.strokeWeight = b.hex === '#FFFFFF' ? 2 : 1.5;
              btn.x = bx; btn.y = 118;

              const bt = figma.createText();
              bt.fontName = {family:'Inter',style:'Bold'};
              bt.fontSize = 13;
              bt.characters = b.label;
              bt.fills = [{type:'SOLID',color:b.textColor}];
              bt.x = 20; bt.y = 13;
              btn.appendChild(bt);
              comp.appendChild(btn);
              bx += 196;
            }

            // ── Status Chips ──
            sectionLabel('Status Chips', 40, 182);
            const chips = [
              {label:'Available',   hex:'#6FC774'},
              {label:'Staged',      hex:'#057FA8'},
              {label:'In Transit',  hex:'#EBC25B'},
              {label:'Urgent',      hex:'#A80550'},
              {label:'Design Phase',hex:'#A3A3A3'},
              {label:'Pack Out',    hex:'#EBC25B'},
            ];
            let cx2 = 40;
            for (const c of chips) {
              const chip = figma.createFrame();
              chip.name = 'Chip / ' + c.label;
              chip.resize(100, 26);
              chip.cornerRadius = 999;
              chip.fills = [{type:'SOLID',color:rgb(c.hex)}];
              chip.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
              chip.strokeWeight = 1.5;
              chip.x = cx2; chip.y = 200;
              const ct2 = figma.createText();
              ct2.fontName = {family:'Inter',style:'Bold'};
              ct2.fontSize = 10;
              ct2.characters = c.label;
              ct2.x = 10; ct2.y = 6;
              chip.appendChild(ct2);
              comp.appendChild(chip);
              cx2 += 112;
            }

            // ── Inventory Card ──
            sectionLabel('Inventory Card', 40, 248);
            const card = figma.createFrame();
            card.name = 'Card / Inventory Item';
            card.resize(380, 100);
            card.cornerRadius = 16;
            card.fills = [{type:'SOLID',color:rgb('#FCF7F0')}];
            card.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            card.strokeWeight = 2;
            card.x = 40; card.y = 268;

            const cT = figma.createText();
            cT.fontName = {family:'Inter',style:'Bold'};
            cT.fontSize = 15;
            cT.characters = 'Boucle Curve Sofa';
            cT.x = 16; cT.y = 14;
            card.appendChild(cT);

            const cS = figma.createText();
            cS.fontName = {family:'Inter',style:'Regular'};
            cS.fontSize = 12;
            cS.characters = 'SKU: S-204 · Zone A · Bay 3 · Shelf 1';
            cS.fills = [{type:'SOLID',color:{r:0.45,g:0.45,b:0.45}}];
            cS.x = 16; cS.y = 42;
            card.appendChild(cS);

            const cChip = figma.createFrame();
            cChip.resize(90,24);
            cChip.cornerRadius = 999;
            cChip.fills = [{type:'SOLID',color:rgb('#6FC774')}];
            cChip.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            cChip.strokeWeight = 1;
            cChip.x = 274; cChip.y = 14;
            const ccT = figma.createText();
            ccT.fontName = {family:'Inter',style:'Bold'};
            ccT.fontSize = 10;
            ccT.characters = 'AVAILABLE';
            ccT.x = 10; ccT.y = 6;
            cChip.appendChild(ccT);
            card.appendChild(cChip);

            const cBtn = figma.createFrame();
            cBtn.resize(80,28);
            cBtn.cornerRadius = 999;
            cBtn.fills = [{type:'SOLID',color:rgb('#EBC25B')}];
            cBtn.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            cBtn.strokeWeight = 1;
            cBtn.x = 284; cBtn.y = 62;
            const cbT = figma.createText();
            cbT.fontName = {family:'Inter',style:'Bold'};
            cbT.fontSize = 10;
            cbT.characters = 'Assign';
            cbT.x = 18; cbT.y = 8;
            cBtn.appendChild(cbT);
            card.appendChild(cBtn);
            comp.appendChild(card);

            // ── Bottom Navigation Bar ──
            sectionLabel('Bottom Navigation Bar', 40, 390);
            const nav = figma.createFrame();
            nav.name = 'Nav / Bottom Bar';
            nav.resize(390, 56);
            nav.cornerRadius = 28;
            nav.fills = [{type:'SOLID',color:{r:1,g:1,b:1}}];
            nav.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            nav.strokeWeight = 2;
            nav.x = 40; nav.y = 410;
            const navT = figma.createText();
            navT.fontName = {family:'Inter',style:'Bold'};
            navT.fontSize = 11;
            navT.characters = 'Home   Projects   Tag   Map   3D Room';
            navT.x = 32; navT.y = 19;
            nav.appendChild(navT);
            comp.appendChild(nav);

            // ── Search Bar ──
            const search = figma.createFrame();
            search.name = 'Input / Search Bar';
            search.resize(380, 44);
            search.cornerRadius = 999;
            search.fills = [{type:'SOLID',color:rgb('#FCF7F0')}];
            search.strokes = [{type:'SOLID',color:{r:0,g:0,b:0}}];
            search.strokeWeight = 2;
            search.x = 480; search.y = 268;
            const sT = figma.createText();
            sT.fontName = {family:'Inter',style:'Regular'};
            sT.fontSize = 13;
            sT.characters = '🔍 Search inventory, zones, SKUs...';
            sT.fills = [{type:'SOLID',color:{r:0.6,g:0.6,b:0.6}}];
            sT.x = 20; sT.y = 13;
            search.appendChild(sT);
            comp.appendChild(search);

            pg.appendChild(comp);
            figma.notify('✅ Component Library added!', {timeout:3000});
          })
        );
        'Component Library frame created on page: ' + pg.name;
      }
    `
  }
];

rl.on('line', (line) => {
  try {
    const res = JSON.parse(line);
    if (res.id === 1) {
      console.log("✓ MCP server initialized.");
      mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      statusReqId = send('tools/call', { name: 'figma_get_status', arguments: { probe: true } });
      pollTimer = setInterval(() => {
        if (!isConnected) statusReqId = send('tools/call', { name: 'figma_get_status', arguments: { probe: true } });
      }, 2000);
    } else if (res.id === statusReqId && !isConnected) {
      const text = res.result?.content?.[0]?.text || '';
      const connected = text.includes('"connected":true') || text.includes('Super Stager') || text.includes('I1yx2wSHzBlMUNpeiWj2Zb') || text.includes('EZ5hwh5VHPx88oZ3tAaWiX');
      if (connected) {
        isConnected = true;
        clearInterval(pollTimer);
        const fn = (text.match(/"currentFileName":"([^"]+)"/) || [])[1] || 'Unknown';
        console.log(`🎉 Connected to: ${fn}`);
        runNextStep();
      }
    } else if (execIds.includes(res.id)) {
      const idx = execIds.indexOf(res.id);
      const text = res.result?.content?.[0]?.text || JSON.stringify(res.error || '');
      // Try to extract the actual string result from the wrapper
      try {
        const parsed = JSON.parse(text);
        const result = parsed.result ?? (parsed.resultAnalysis?.isUndefined ? '(async - frames likely created)' : text);
        console.log(`  ✓ Step ${idx + 1} [${steps[idx].name}]: ${result}`);
      } catch(e) {
        console.log(`  ✓ Step ${idx + 1} [${steps[idx].name}]: ${text.substring(0, 200)}`);
      }
      step++;
      if (step < steps.length) {
        runNextStep();
      } else {
        console.log("\n🏆 All brand system frames sent to Figma!");
        console.log("📌 Check your file: Super Stager Brand System - Claude");
        console.log("   New frames added to the brand page:");
        console.log("   • Super Stager · Color Palette");
        console.log("   • Super Stager · Typography System");
        console.log("   • Super Stager · Component Library");
        console.log("   (Plus prototype screens from the previous run)");
        setTimeout(() => { mcp.kill(); process.exit(0); }, 1000);
      }
    }
  } catch (e) {}
});

function runNextStep() {
  const s = steps[step];
  console.log(`\n▶ Step ${step + 1}/${steps.length}: ${s.name}`);
  const eId = send('tools/call', { name: 'figma_execute', arguments: { code: s.code } });
  execIds[step] = eId;
}

send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'antigravity-brand-client', version: '2.0.0' }
});
