import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Yellow gradient for lightning -->
    <linearGradient id="yellowLightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2b705" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    
    <!-- Soft glow effect -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Premium Dark Solid Background representing professional electrical durability -->
  <rect width="1200" height="630" fill="#070707" />
  
  <!-- Tech-themed grid pattern (extremely low opacity for clean luxury tech feel) -->
  <g opacity="0.05">
    <path d="M 0,105 L 1200,105 M 0,210 L 1200,210 M 0,315 L 1200,315 M 0,420 L 1200,420 M 0,525 L 1200,525" stroke="#ffffff" stroke-width="1" />
    <path d="M 150,0 L 150,630 M 300,0 L 300,630 M 450,0 L 450,630 M 600,0 L 600,630 M 750,0 L 750,630 M 900,0 L 900,630 M 1050,0 L 1050,630" stroke="#ffffff" stroke-width="1" />
  </g>

  <!-- Ambient golden back-glow center circle -->
  <circle cx="600" cy="300" r="280" fill="#f2b705" opacity="0.06" filter="blur(65px)" />

  <!-- Centered container for Logo (offset to align beautifully vertically and horizontally) -->
  <!-- Logo bounding box transformed to center X:600 Y:300 -->
  <g transform="translate(355, 45)">
    <!-- Main Group "AGE" stylized and italicized -->
    <g transform="skewX(-14)">
      <!-- Letter 'A' (white) -->
      <path d="M 85,300 L 155,140 H 195 L 265,300 H 220 L 205,260 H 145 L 130,300 Z M 153,225 H 197 L 175,175 Z" fill="#ffffff" />
      
      <!-- Letter 'G' (white) -->
      <path d="M 335,140 H 255 V 300 H 335 V 250 H 295 V 265 H 318 V 285 H 272 V 155 H 335 Z" fill="#ffffff" />
      
      <!-- Letter 'E' (white) -->
      <path d="M 350,140 H 425 V 158 H 368 V 212 H 415 V 230 H 368 V 282 H 428 V 300 H 350 Z" fill="#ffffff" />
    </g>

    <!-- Overlay Lightning Bolt (Yellow, glowing, centered) -->
    <polygon points="210,85 275,85 210,215 285,215 178,365 208,235 160,235" fill="url(#yellowLightningGrad)" filter="url(#softGlow)" />
    
    <!-- Subtitle text 'ELÉTRICA' in spaced gold -->
    <text x="240" y="375" fill="#f2b705" font-family="'Inter', 'Space Grotesk', 'Helvetica', sans-serif" font-size="26" font-weight="900" letter-spacing="18" text-anchor="middle" transform="translate(10, 0)">ELÉTRICA</text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'preview-age-eletrica.png');
  const logoOutputPath = path.join(publicDir, 'logo-age.png');
  const faviconPath = path.join(publicDir, 'favicon.png');
  const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
  
  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  const icon192Path = path.join(iconsDir, 'icon-192.png');
  const icon512Path = path.join(iconsDir, 'icon-512.png');

  // Solid true black background SVG logo optimized for app icons
  const iconSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="yellowLightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2b705" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Solid pure black background requested for crisp non-cut iPhone installation -->
  <rect width="512" height="512" fill="#000000" />
  
  <!-- Content group slightly scaled down/padded for perfect safe margins -->
  <g transform="translate(38, 20) scale(0.85)">
    <!-- Main Group "AGE" stylized and italicized -->
    <g transform="skewX(-14)">
      <!-- Letter 'A' (white) -->
      <path d="M 85,300 L 155,140 H 195 L 265,300 H 220 L 205,260 H 145 L 130,300 Z M 153,225 H 197 L 175,175 Z" fill="#ffffff" />
      
      <!-- Letter 'G' (white) -->
      <path d="M 335,140 H 255 V 300 H 335 V 250 H 295 V 265 H 318 V 285 H 272 V 155 H 335 Z" fill="#ffffff" />
      
      <!-- Letter 'E' (white) -->
      <path d="M 350,140 H 425 V 158 H 368 V 212 H 415 V 230 H 368 V 282 H 428 V 300 H 350 Z" fill="#ffffff" />
    </g>

    <!-- Overlay Lightning Bolt (Yellow, glowing, centered) -->
    <polygon points="210,85 275,85 210,215 285,215 178,365 208,235 160,235" fill="url(#yellowLightningGrad)" filter="url(#softGlow)" />
    
    <!-- Subtitle text 'ELÉTRICA' in gold, spaced across the logo width -->
    <text x="240" y="375" fill="#f2b705" font-family="'Inter', 'Space Grotesk', system-ui, sans-serif" font-size="25" font-weight="900" letter-spacing="18" text-anchor="middle" transform="translate(10, 0)">ELÉTRICA</text>
  </g>
</svg>
`;

  try {
    // Render the 1200x630 sharing preview
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);
    console.log(`Success! Preview PNG Image saved successfully to ${outputPath}`);

    // Render 512x512 app logo (used by site elements)
    await sharp(Buffer.from(iconSvgContent))
      .resize(512, 512)
      .png()
      .toFile(logoOutputPath);
    console.log(`Success! Logo brand PNG saved successfully to ${logoOutputPath}`);

    // Render 512x512 icon-512.png
    await sharp(Buffer.from(iconSvgContent))
      .resize(512, 512)
      .png()
      .toFile(icon512Path);
    console.log(`Success! PWA 512x512 icon saved to ${icon512Path}`);

    // Render 192x192 icon-192.png
    await sharp(Buffer.from(iconSvgContent))
      .resize(192, 192)
      .png()
      .toFile(icon192Path);
    console.log(`Success! PWA 192x192 icon saved to ${icon192Path}`);

    // Render 180x180 apple-touch-icon.png
    await sharp(Buffer.from(iconSvgContent))
      .resize(180, 180)
      .png()
      .toFile(appleIconPath);
    console.log(`Success! apple-touch-icon.png saved to ${appleIconPath}`);

    // Render 48x48 favicon.png
    await sharp(Buffer.from(iconSvgContent))
      .resize(48, 48)
      .png()
      .toFile(faviconPath);
    console.log(`Success! favicon.png saved to ${faviconPath}`);

  } catch (err) {
    console.error('Error generating image via sharp:', err);
    process.exit(1);
  }
}

generate();
