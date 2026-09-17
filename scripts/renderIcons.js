const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = 'C:\\Users\\gtech\\AppData\\Local\\Temp\\edge_icon_render';
const projectDir = path.resolve(__dirname, '..');
const assetsDir = path.join(projectDir, 'assets');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Read original logo.svg
const logoSvg = fs.readFileSync(path.join(assetsDir, 'logo.svg'), 'utf8');

// 2. Create foreground SVG (without the background squircle rect, so it is transparent adaptive foreground)
const foregroundSvg = logoSvg.replace(
  /<rect width="512" height="512" rx="116" fill="url\(#bgGrad\)" \/>/,
  '<!-- background omitted for adaptive foreground -->'
);

// Helper to render HTML with Edge
function renderSvgToPng(svgContent, targetPngPath, size = 1024, scale = 1.0) {
  const htmlFile = path.join(tempDir, 'render.html');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${size}px;
    height: ${size}px;
    overflow: hidden;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wrapper {
    width: ${size * scale}px;
    height: ${size * scale}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
  <div class="wrapper">
    ${svgContent}
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlFile, html, 'utf8');

  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');
  const args = [
    '--headless=new',
    `--user-data-dir=${tempDir}`,
    `--window-size=${size},${size}`,
    '--hide-scrollbars',
    '--default-background-color=00000000',
    `--screenshot=${targetPngPath}`,
    fileUrl,
  ];

  execFileSync(edgePath, args, { stdio: 'pipe' });
  console.log(`Rendered ${path.basename(targetPngPath)} (${size}x${size}, scale ${scale})`);
}

// Render main app icon (1024x1024, full squircle)
renderSvgToPng(logoSvg, path.join(assetsDir, 'icon.png'), 1024, 0.98);

// Render adaptive foreground (1024x1024, 68% scale for Android safe zone circle)
renderSvgToPng(foregroundSvg, path.join(assetsDir, 'android-icon-foreground.png'), 1024, 0.68);

// Render splash icon (512x512, 75% scale)
renderSvgToPng(logoSvg, path.join(assetsDir, 'splash-icon.png'), 512, 0.75);

// Render favicon (48x48)
renderSvgToPng(logoSvg, path.join(assetsDir, 'favicon.png'), 48, 1.0);

// Generate solid dark background for adaptive icon
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#0B0F19" />
</svg>`;
renderSvgToPng(bgSvg, path.join(assetsDir, 'android-icon-background.png'), 1024, 1.0);

console.log('All icons generated successfully!');
