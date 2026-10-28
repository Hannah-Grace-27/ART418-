// ==============================================================================
// Super Stager: Automated Figma Design System & Variable Generator
// Brand: Hannah Grace Design / Super Stager
// Run this directly in the Figma Console (Ctrl + Alt + I in Figma Desktop)
// or via Figma Desktop Bridge / Scripter plugin!
// ==============================================================================

(async function createSuperStagerDesignSystem() {
  console.log("🚀 Starting Super Stager Brand System creation...");

  // Helper: Hex to Figma RGB (0-1 range)
  function hexToFigmaRGB(hex) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }

  // 1. Color Palette Definition
  const colors = [
    { name: "Primary/Mint Green", hex: "#6FC774", desc: "Warehouse inventory / Available status" },
    { name: "Primary/Deep Pool", hex: "#057FA8", desc: "Staged project status / Structure" },
    { name: "Primary/Red Plum", hex: "#A80550", desc: "Action CTA / Urgent / Damaged" },
    { name: "Primary/Sunny", hex: "#EBC25B", desc: "Hero accent / In-transit status" },
    { name: "Neutral/Canvas", hex: "#FCF7F0", desc: "Soft warm retro background" },
    { name: "Neutral/Surface", hex: "#FFFFFF", desc: "Cards and surfaces" },
    { name: "Neutral/Border", hex: "#EDE9DF", desc: "Subtle borders and dividers" },
    { name: "Neutral/Ink", hex: "#000000", desc: "Headers and high contrast text" },
    { name: "Neutral/Ink Muted", hex: "#595959", desc: "Secondary text and metadata" }
  ];

  // 2. Create / Find Variable Collection
  let collection;
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    collection = collections.find(c => c.name === "Super Stager Brand");
    if (!collection) {
      collection = figma.variables.createVariableCollection("Super Stager Brand");
      console.log("✨ Created Variable Collection: 'Super Stager Brand'");
    } else {
      console.log("ℹ️ Found existing Variable Collection: 'Super Stager Brand'");
    }
  } catch (err) {
    console.warn("⚠️ Variable API might require a free Figma team file or local bridge:", err);
  }

  const defaultModeId = collection ? collection.defaultModeId : null;

  // 3. Create Figma Color Variables & Paint Styles
  for (const c of colors) {
    const rgb = hexToFigmaRGB(c.hex);

    // Create Variable
    if (collection && defaultModeId) {
      try {
        const localVars = await figma.variables.getLocalVariablesAsync();
        let figmaVar = localVars.find(v => v.name === c.name && v.variableCollectionId === collection.id);
        if (!figmaVar) {
          figmaVar = figma.variables.createVariable(c.name, collection, "COLOR");
        }
        figmaVar.description = c.desc;
        figmaVar.setValueForMode(defaultModeId, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
        console.log(`  ✓ Variable: ${c.name} (${c.hex})`);
      } catch (e) {
        console.error("Variable error:", e);
      }
    }

    // Create Paint Style
    try {
      const localStyles = await figma.getLocalPaintStylesAsync();
      let style = localStyles.find(s => s.name === `Super Stager/${c.name}`);
      if (!style) {
        style = figma.createPaintStyle();
        style.name = `Super Stager/${c.name}`;
      }
      style.description = c.desc;
      style.paints = [{
        type: 'SOLID',
        color: { r: rgb.r, g: rgb.g, b: rgb.b }
      }];
      console.log(`  ✓ Paint Style: Super Stager/${c.name}`);
    } catch (e) {
      console.error("Paint style error:", e);
    }
  }

  // 4. Create Typography Styles
  const typographyStyles = [
    { name: "Super Stager/Header/Hero Display", family: "Fredoka", style: "Bold", size: 40, lineHeight: { value: 48, unit: "PIXELS" } },
    { name: "Super Stager/Header/Section Title", family: "Fredoka", style: "Bold", size: 28, lineHeight: { value: 34, unit: "PIXELS" } },
    { name: "Super Stager/Header/Card Title", family: "Fredoka", style: "Bold", size: 20, lineHeight: { value: 26, unit: "PIXELS" } },
    { name: "Super Stager/Body/Regular", family: "Lato", style: "Regular", size: 16, lineHeight: { value: 24, unit: "PIXELS" } },
    { name: "Super Stager/Body/Small", family: "Lato", style: "Regular", size: 14, lineHeight: { value: 20, unit: "PIXELS" } },
    { name: "Super Stager/Decorative/Badge", family: "Quicksand", style: "Bold", size: 12, lineHeight: { value: 16, unit: "PIXELS" } }
  ];

  for (const t of typographyStyles) {
    try {
      await figma.loadFontAsync({ family: t.family, style: t.style });
      const localTextStyles = await figma.getLocalTextStylesAsync();
      let textStyle = localTextStyles.find(s => s.name === t.name);
      if (!textStyle) {
        textStyle = figma.createTextStyle();
        textStyle.name = t.name;
      }
      textStyle.fontName = { family: t.family, style: t.style };
      textStyle.fontSize = t.size;
      textStyle.lineHeight = t.lineHeight;
      console.log(`  ✓ Text Style: ${t.name}`);
    } catch (err) {
      // If Fredoka or Quicksand aren't installed locally, fallback to Inter / Roboto
      try {
        await figma.loadFontAsync({ family: "Inter", style: t.style === "Bold" ? "Bold" : "Regular" });
        const localTextStyles = await figma.getLocalTextStylesAsync();
        let textStyle = localTextStyles.find(s => s.name === t.name);
        if (!textStyle) {
          textStyle = figma.createTextStyle();
          textStyle.name = t.name;
        }
        textStyle.fontName = { family: "Inter", style: t.style === "Bold" ? "Bold" : "Regular" };
        textStyle.fontSize = t.size;
        console.log(`  ✓ Text Style (Inter fallback): ${t.name}`);
      } catch (fallbackErr) {
        console.warn(`Could not load font for ${t.name}:`, fallbackErr);
      }
    }
  }

  // 5. Create a Color Palette Frame on Canvas if on current page
  try {
    const page = figma.currentPage;
    const frame = figma.createFrame();
    frame.name = "Super Stager • Brand Color Tokens";
    frame.resize(960, 420);
    frame.cornerRadius = 24;
    frame.fills = [{ type: 'SOLID', color: hexToFigmaRGB("#FCF7F0") }];
    frame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    frame.strokeWeight = 3;

    // Position neatly
    frame.x = figma.viewport.center.x - 480;
    frame.y = figma.viewport.center.y - 210;

    let xOffset = 40;
    for (const c of colors.slice(0, 5)) {
      const swatch = figma.createRectangle();
      swatch.name = c.name;
      swatch.resize(150, 160);
      swatch.cornerRadius = 16;
      const rgb = hexToFigmaRGB(c.hex);
      swatch.fills = [{ type: 'SOLID', color: rgb }];
      swatch.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      swatch.strokeWeight = 2;
      swatch.x = xOffset;
      swatch.y = 80;
      frame.appendChild(swatch);
      xOffset += 180;
    }

    figma.viewport.scrollAndZoomIntoView([frame]);
    console.log("🎨 Generated Brand Token Swatch Frame on Canvas!");
  } catch (canvasErr) {
    console.warn("Could not draw canvas frame:", canvasErr);
  }

  figma.notify("🎉 Super Stager Brand System successfully loaded into Figma!");
  console.log("🎉 Complete! All variables, styles, and swatches are ready.");
})();
