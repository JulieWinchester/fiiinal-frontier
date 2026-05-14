#!/usr/bin/env node

// Generates assets/images/neutral-zone.png — a transparent PNG with a glowing
// red arc representing the Klingon Neutral Zone boundary, sized to overlay the
// starfield canvas (2500x1600px = 500x320 scene units at 10px per unit).
//
// Scene geometry reference (5px per scene Z unit, y=0 at Z=-160):
//   Birds of Prey  Z≈-27  →  y≈665px  (above arc, Klingon side)
//   Kobayashi Maru Z=0    →  y=800px  (just inside neutral zone)
//   Arc midpoint   Z≈30   →  y≈950px  (neutral zone boundary)
//   Enterprise     Z=60   →  y=1100px (below arc, Federation side)

const sharp = require('sharp');
const path = require('path');

const W = 2500;
const H = 1600;

// Quadratic bezier: endpoints at y=975 (edges), control point pulls center up to y=800
const ARC = `M 0,975 Q 1250,700 ${W},975`;
// Filled region above the arc (neutral zone / Klingon side)
const ZONE_FILL = `M 0,0 L ${W},0 L ${W},975 Q 1250,700 0,975 Z`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="outer-glow" x="-5%" y="-300%" width="110%" height="700%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="40"/>
    </filter>
    <filter id="inner-glow" x="-5%" y="-150%" width="110%" height="400%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12"/>
    </filter>
  </defs>

  <!-- Subtle red tint over neutral zone (Klingon side, above arc) -->
  <path d="${ZONE_FILL}" fill="rgba(160,0,0,0.09)"/>

  <!-- Diffuse outer glow -->
  <path d="${ARC}" stroke="rgba(255,0,0,0.30)" stroke-width="110" fill="none"
        filter="url(#outer-glow)"/>

  <!-- Soft inner glow -->
  <path d="${ARC}" stroke="rgba(255,30,30,0.55)" stroke-width="26" fill="none"
        filter="url(#inner-glow)"/>

  <!-- Main arc line -->
  <path d="${ARC}" stroke="rgba(220,35,35,0.95)" stroke-width="7" fill="none"
        stroke-linecap="round"/>

  <!-- Bright core highlight -->
  <path d="${ARC}" stroke="rgba(255,210,210,0.80)" stroke-width="2" fill="none"
        stroke-linecap="round"/>
</svg>`;

async function main() {
  const outputPath = path.join(__dirname, '..', 'assets', 'images', 'neutral-zone.png');
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Generated neutral-zone.png (${W}x${H})`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
