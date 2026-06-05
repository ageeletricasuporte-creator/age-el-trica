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

  try {
    // Render the 1200x630 sharing preview
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);
    console.log(`Success! Preview PNG Image saved successfully to ${outputPath}`);

    // Render the 512x512 brand app logo/icon
    const mainLogoSvg = fs.readFileSync(path.join(process.cwd(), 'src/assets/logo.svg'));
    await sharp(mainLogoSvg)
      .resize(512, 512)
      .png()
      .toFile(logoOutputPath);
    console.log(`Success! Logo brand PNG saved successfully to ${logoOutputPath}`);

  } catch (err) {
    console.error('Error generating image via sharp:', err);
    process.exit(1);
  }
}

generate();
