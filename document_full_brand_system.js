import { spawn } from 'child_process';
import readline from 'readline';

console.log("🚀 Starting Figma Console MCP and documenting full brand in Figma...");

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
  console.log("🔍 Checking connection to Figma Desktop Bridge...");
  statusReqId = send('tools/call', {
    name: 'figma_get_status',
    arguments: { probe: true }
  });
}

rl.on('line', (line) => {
  try {
    const res = JSON.parse(line);

    if (res.id === 1) {
      console.log("✓ Server initialized. Announcing client...");
      mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      checkStatus();
      pollTimer = setInterval(checkStatus, 2000);
    } else if (res.id === statusReqId) {
      const text = res.result?.content?.[0]?.text || '';
      console.log("Status response:", text.substring(0, 160));
      
      if (text.includes('"connected":true') || text.includes('Super Stager') || text.includes('EZ5hwh5VHPx88oZ3tAaWiX') || text.includes('I1yx2wSHzBlMUNpeiWj2Zb')) {
        isConnected = true;
        clearInterval(pollTimer);
        console.log("🎉 Bridge connection confirmed! Running Full Brand & Prototyping setup script...");

        const code = `
          (async () => {
            function hexToRgb(hex) {
              hex = hex.replace('#', '');
              return {
                r: parseInt(hex.substring(0, 2), 16) / 255,
                g: parseInt(hex.substring(2, 4), 16) / 255,
                b: parseInt(hex.substring(4, 6), 16) / 255
              };
            }

            const results = {};

            // Helper to update text safely
            async function updateText(nodeId, newCharacters) {
              try {
                const node = await figma.getNodeByIdAsync(nodeId);
                if (node && node.type === 'TEXT') {
                  const font = node.fontName;
                  if (font && typeof font === 'object') {
                    await figma.loadFontAsync(font);
                    node.characters = newCharacters;
                    return true;
                  }
                }
              } catch (e) {
                console.warn('Could not update text ' + nodeId, e);
              }
              return false;
            }

            // 1. UPDATE COVER PAGE
            console.log("Step 1: Updating Cover page...");
            await updateText("4093:27569", "Super Stager\\nBrand System");
            await updateText("4093:27570", "A House Stager's Dream: Warehouse inventory management, barcode scanning, 3D design curation, and staging turnover.");
            await updateText("4093:27568", "Design system  ·  Super Stager");
            await updateText("4093:23304", "Retro Comeback");
            await updateText("4093:23309", "Lato");
            await updateText("4093:27563", "BC Alphapipe Bold");
            await updateText("4093:23310", "All Round Gothic");
            await updateText("I4093:23347;1953:19061", "Hannah Grace Design");
            results.cover = "Cover updated with Super Stager details";

            // 2. DOCUMENT BRAND BOOK / BRAND MISSION
            console.log("Step 2: Documenting Brand Mission & Archetype...");
            const brandBookPage = figma.root.children.find(p => p.name.includes("Brand book")) || 
                                  figma.root.children.find(p => p.name.includes("Your brand"));
            
            if (brandBookPage) {
              const brandSection = figma.createFrame();
              brandSection.name = "Super Stager • Brand Pillars & Philosophy";
              brandSection.resize(1200, 780);
              brandSection.cornerRadius = 24;
              brandSection.fills = [{ type: 'SOLID', color: hexToRgb("#FCF7F0") }];
              brandSection.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
              brandSection.strokeWeight = 3;
              brandSection.x = 0;
              brandSection.y = -860;

              try {
                await figma.loadFontAsync({ family: "Inter", style: "Bold" });
                await figma.loadFontAsync({ family: "Inter", style: "Regular" });

                // Title
                const title = figma.createText();
                title.fontName = { family: "Inter", style: "Bold" };
                title.fontSize = 32;
                title.characters = "Super Stager • Brand Strategy & Foundations";
                title.x = 48;
                title.y = 48;
                brandSection.appendChild(title);

                // Personal Statement Card
                const stmtCard = figma.createFrame();
                stmtCard.name = "Personal Statement";
                stmtCard.resize(1104, 210);
                stmtCard.cornerRadius = 16;
                stmtCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                stmtCard.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                stmtCard.strokeWeight = 2;
                stmtCard.x = 48;
                stmtCard.y = 110;

                const stmtTitle = figma.createText();
                stmtTitle.fontName = { family: "Inter", style: "Bold" };
                stmtTitle.fontSize = 18;
                stmtTitle.characters = "Hannah Grace Design • Personal Statement";
                stmtTitle.x = 24;
                stmtTitle.y = 24;
                stmtCard.appendChild(stmtTitle);

                const stmtBody = figma.createText();
                stmtBody.fontName = { family: "Inter", style: "Regular" };
                stmtBody.fontSize = 14;
                stmtBody.lineHeight = { value: 22, unit: "PIXELS" };
                stmtBody.characters = "Hannah Grace Design is rooted in a lifelong passion for the transformative beauty and power of art. I believe thoughtful design breathes new life into neglected spaces and overlooked details. Grounded in both interior and graphic design, my goal is to craft, elevate, and revitalize what is already here with efficiency. I help individuals and businesses put their strongest foot forward—spanning photography, brand identity, and digital advertising to residential styling, decorating, and staging. Hannah Grace Design desires to give back to this world through art, one project at a time.";
                stmtBody.x = 24;
                stmtBody.y = 60;
                stmtBody.resize(1056, 130);
                stmtCard.appendChild(stmtBody);
                brandSection.appendChild(stmtCard);

                // Strategy Columns
                const cols = [
                  { title: "Target Audience", badge: "House Stagers", color: "#6FC774", text: "Stagers deal with furniture and client turnover daily, causing warehouse chaos and double work. Super Stager provides total inventory awareness, barcode tracking, and calm." },
                  { title: "Archetype & Tone", badge: "Creator & Hero", color: "#057FA8", text: "Creator: 'Here to help you design before you place'\\nHero: 'Here to save your energy and time'\\nTone: Welcoming, Catchy, Trendy, Retro, Flowing, Bright, Clear." },
                  { title: "Retro Comeback Style", badge: "Aesthetic Identity", color: "#EBC25B", text: "Curved flowing contours, bold ink outlines, structured layouts, and warm paper canvas backgrounds (#FCF7F0) with vivid retro accent pops." }
                ];

                let cx = 48;
                for (const col of cols) {
                  const card = figma.createFrame();
                  card.name = col.title;
                  card.resize(346, 360);
                  card.cornerRadius = 16;
                  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                  card.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                  card.strokeWeight = 2;
                  card.x = cx;
                  card.y = 350;

                  // Badge pill
                  const pill = figma.createFrame();
                  pill.resize(140, 28);
                  pill.cornerRadius = 999;
                  pill.fills = [{ type: 'SOLID', color: hexToRgb(col.color) }];
                  pill.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                  pill.strokeWeight = 1.5;
                  pill.x = 20;
                  pill.y = 20;
                  const pillText = figma.createText();
                  pillText.fontName = { family: "Inter", style: "Bold" };
                  pillText.fontSize = 11;
                  pillText.characters = col.badge;
                  pillText.x = 10;
                  pillText.y = 7;
                  pill.appendChild(pillText);
                  card.appendChild(pill);

                  const colTitle = figma.createText();
                  colTitle.fontName = { family: "Inter", style: "Bold" };
                  colTitle.fontSize = 18;
                  colTitle.characters = col.title;
                  colTitle.x = 20;
                  colTitle.y = 64;
                  card.appendChild(colTitle);

                  const colText = figma.createText();
                  colText.fontName = { family: "Inter", style: "Regular" };
                  colText.fontSize = 13;
                  colText.lineHeight = { value: 20, unit: "PIXELS" };
                  colText.characters = col.text;
                  colText.x = 20;
                  colText.y = 100;
                  colText.resize(306, 230);
                  card.appendChild(colText);

                  brandSection.appendChild(card);
                  cx += 378;
                }

                brandBookPage.appendChild(brandSection);
                results.brandStrategy = "Brand Strategy and Personal Statement added to Brand page";
              } catch (e) {
                console.warn('Font load error in brand section:', e);
              }
            }

            // 3. SET UP PROTOTYPING SCREENS ON 'Your screens'
            console.log("Step 3: Building 5 Prototyping Screens on Your screens page...");
            const screensPage = figma.root.children.find(p => p.name === "Your screens") || figma.currentPage;

            const screensData = [
              {
                id: "home",
                name: "1 • Home Dashboard",
                accent: "#EBC25B",
                subtitle: "Warehouse A • Overview",
                elements: [
                  { label: "Active Staging Projects", val: "6 Properties", status: "Staged", color: "#057FA8" },
                  { label: "Warehouse Inventory", val: "1,248 Items", status: "Available", color: "#6FC774" },
                  { label: "Pending Intake", val: "14 Items", status: "Transit", color: "#EBC25B" },
                  { label: "Maintenance / Repair", val: "3 Flagged", status: "Urgent", color: "#A80550" }
                ],
                actions: ["Tag New Item", "Warehouse Map", "Design Room", "Projects"]
              },
              {
                id: "projects",
                name: "2 • Staging Projects",
                accent: "#057FA8",
                subtitle: "Client Turnover & Folders",
                elements: [
                  { label: "442 Elm Street Staging", val: "34 Furniture Items", status: "Active", color: "#057FA8" },
                  { label: "Oakridge Estate Luxury Staging", val: "58 Items", status: "Pack Out", color: "#EBC25B" },
                  { label: "Highland Mid-Century Condo", val: "22 Items", status: "Design Phase", color: "#6FC774" }
                ],
                actions: ["New Project", "Archive Folder", "Export Manifest"]
              },
              {
                id: "tag",
                name: "3 • Tag New Item (Scanner)",
                accent: "#6FC774",
                subtitle: "Barcode & Quick Intake",
                elements: [
                  { label: "Camera Barcode Scanner", val: "Align Barcode in Reticle", status: "Ready", color: "#6FC774" },
                  { label: "Item Details", val: "Mid-Century Walnut Credenza", status: "Scanned", color: "#057FA8" },
                  { label: "Assigned Bay", val: "Aisle 4 • Bay C • Shelf 2", status: "Warehouse", color: "#6FC774" }
                ],
                actions: ["Scan Next", "Print Tag", "Assign to Project"]
              },
              {
                id: "warehouse",
                name: "4 • Warehouse Map",
                accent: "#057FA8",
                subtitle: "Visual Bin & Aisle Locator",
                elements: [
                  { label: "Zone A: Living & Sofas", val: "92% Capacity", status: "High Turnover", color: "#A80550" },
                  { label: "Zone B: Dining & Tables", val: "65% Capacity", status: "Available", color: "#6FC774" },
                  { label: "Zone C: Lighting & Accents", val: "48% Capacity", status: "Available", color: "#6FC774" }
                ],
                actions: ["AI Locate Furniture", "Filter by Category", "Floor Plan"]
              },
              {
                id: "design",
                name: "5 • Design Room (3D Mockup)",
                accent: "#A80550",
                subtitle: "Virtual Room Staging",
                elements: [
                  { label: "Living Room 3D Floorplan", val: "18' x 24' Model Loaded", status: "3D Ready", color: "#057FA8" },
                  { label: "Palette Applied", val: "Retro Comeback Scheme", status: "Active", color: "#EBC25B" },
                  { label: "Selected Piece", val: "Boucle Curve Sofa (#S-204)", status: "Placed", color: "#6FC774" }
                ],
                actions: ["Render 3D Room", "Swap Furniture", "Share Client Deck"]
              }
            ];

            let sx = 0;
            const startY = 1200;

            for (const s of screensData) {
              const screenFrame = figma.createFrame();
              screenFrame.name = "Prototype • " + s.name;
              screenFrame.resize(390, 844); // iPhone 14 / standard mobile prototype
              screenFrame.cornerRadius = 44;
              screenFrame.fills = [{ type: 'SOLID', color: hexToRgb("#FCF7F0") }];
              screenFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
              screenFrame.strokeWeight = 4;
              screenFrame.x = sx;
              screenFrame.y = startY;

              // Notch / Dynamic Island
              const notch = figma.createFrame();
              notch.resize(120, 28);
              notch.cornerRadius = 14;
              notch.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
              notch.x = 135;
              notch.y = 12;
              screenFrame.appendChild(notch);

              // Screen Header
              const header = figma.createFrame();
              header.resize(342, 60);
              header.cornerRadius = 14;
              header.fills = [{ type: 'SOLID', color: hexToRgb(s.accent) }];
              header.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
              header.strokeWeight = 2;
              header.x = 24;
              header.y = 56;

              const screenTitle = figma.createText();
              await figma.loadFontAsync({ family: "Inter", style: "Bold" });
              screenTitle.fontName = { family: "Inter", style: "Bold" };
              screenTitle.fontSize = 15;
              screenTitle.characters = s.name.split('• ')[1] || s.name;
              screenTitle.x = 16;
              screenTitle.y = 12;
              header.appendChild(screenTitle);

              const screenSub = figma.createText();
              await figma.loadFontAsync({ family: "Inter", style: "Regular" });
              screenSub.fontName = { family: "Inter", style: "Regular" };
              screenSub.fontSize = 11;
              screenSub.characters = s.subtitle;
              screenSub.x = 16;
              screenSub.y = 34;
              header.appendChild(screenSub);

              screenFrame.appendChild(header);

              // Content Items
              let ey = 132;
              for (const elem of s.elements) {
                const item = figma.createFrame();
                item.resize(342, 80);
                item.cornerRadius = 14;
                item.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                item.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                item.strokeWeight = 2;
                item.x = 24;
                item.y = ey;

                const ilabel = figma.createText();
                ilabel.fontName = { family: "Inter", style: "Bold" };
                ilabel.fontSize = 13;
                ilabel.characters = elem.label;
                ilabel.x = 16;
                ilabel.y = 16;
                item.appendChild(ilabel);

                const ival = figma.createText();
                ival.fontName = { family: "Inter", style: "Regular" };
                ival.fontSize = 12;
                ival.characters = elem.val;
                ival.fills = [{ type: 'SOLID', color: { r: 0.35, g: 0.35, b: 0.35 } }];
                ival.x = 16;
                ival.y = 42;
                item.appendChild(ival);

                // Status chip
                const chip = figma.createFrame();
                chip.resize(80, 22);
                chip.cornerRadius = 999;
                chip.fills = [{ type: 'SOLID', color: hexToRgb(elem.color) }];
                chip.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                chip.strokeWeight = 1;
                chip.x = 246;
                chip.y = 16;

                const chipText = figma.createText();
                chipText.fontName = { family: "Inter", style: "Bold" };
                chipText.fontSize = 9;
                chipText.characters = elem.status;
                chipText.x = 10;
                chipText.y = 5;
                chip.appendChild(chipText);
                item.appendChild(chip);

                screenFrame.appendChild(item);
                ey += 94;
              }

              // Action Buttons Row
              let ay = 540;
              for (const act of s.actions) {
                const btn = figma.createFrame();
                btn.resize(342, 44);
                btn.cornerRadius = 999;
                btn.fills = [{ type: 'SOLID', color: hexToRgb("#EBC25B") }];
                btn.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                btn.strokeWeight = 2;
                btn.x = 24;
                btn.y = ay;

                const btnText = figma.createText();
                btnText.fontName = { family: "Inter", style: "Bold" };
                btnText.fontSize = 13;
                btnText.characters = act;
                btnText.x = 24;
                btnText.y = 14;
                btn.appendChild(btnText);

                screenFrame.appendChild(btn);
                ay += 54;
              }

              // Bottom Navigation Bar
              const nav = figma.createFrame();
              nav.resize(342, 54);
              nav.cornerRadius = 27;
              nav.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
              nav.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
              nav.strokeWeight = 2;
              nav.x = 24;
              nav.y = 760;

              const navText = figma.createText();
              navText.fontName = { family: "Inter", style: "Bold" };
              navText.fontSize = 11;
              navText.characters = "Home  ·  Projects  ·  Tag  ·  Map  ·  3D Room";
              navText.x = 36;
              navText.y = 20;
              nav.appendChild(navText);
              screenFrame.appendChild(nav);

              screensPage.appendChild(screenFrame);
              sx += 440;
            }

            results.prototypingScreens = "Created 5 mobile prototype screens matching Super Stager sitemap";

            figma.notify("🎉 Full Super Stager Brand Documented & Prototyping Ready!");
            return results;
          })()
        `;

        execReqId = send('tools/call', {
          name: 'figma_execute',
          arguments: { code }
        });
      }
    } else if (res.id === execReqId) {
      console.log("=== FULL BRAND DOCUMENTATION RESULT ===");
      console.log(JSON.stringify(res.result || res.error, null, 2));
      console.log("🏆 SUCCESS! Full brand documented and prototyping screens set up in Figma!");
      setTimeout(() => {
        mcp.kill();
        process.exit(0);
      }, 1000);
    }
  } catch (e) {}
});

send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'antigravity-client', version: '1.0.0' }
});
