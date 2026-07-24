const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const iconsDir = path.join(__dirname, '../public/icons');
const charactersDir = path.join(__dirname, '../public/characters');

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(charactersDir, { recursive: true });

function renderSvgToPng(svgString, outputPath, width = 256, height = 256) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log('Saved:', outputPath);
}

// --- ICONS ---

// 1. feed.png (Bottle)
const feedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Nipple -->
  <path d="M 85 45 C 85 25, 115 25, 115 45 Z" fill="#FBBF24" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Cap ring -->
  <rect x="70" y="45" width="60" height="25" rx="10" fill="#60A5FA" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Bottle body -->
  <rect x="60" y="70" width="80" height="110" rx="20" fill="#FFFBEB" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Milk level -->
  <path d="M 64 110 L 136 110 L 136 160 C 136 170 126 176 116 176 L 84 176 C 74 176 64 170 64 160 Z" fill="#FEF08A" opacity="0.6" />
  <!-- Measurements -->
  <line x1="75" y1="95" x2="95" y2="95" stroke="#000" stroke-width="6" stroke-linecap="round" />
  <line x1="75" y1="115" x2="95" y2="115" stroke="#000" stroke-width="6" stroke-linecap="round" />
  <line x1="75" y1="135" x2="95" y2="135" stroke="#000" stroke-width="6" stroke-linecap="round" />
</svg>`;

// 2. sleep.png (Crescent Moon)
const sleepSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Moon Body -->
  <path d="M 120 20 C 60 20, 20 70, 20 130 C 20 160 32 180 45 190 C 25 150 40 80 110 50 C 135 40 165 42 180 50 C 170 30 148 20 120 20 Z" 
        fill="#FDE047" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Sleep eyes -->
  <path d="M 65 100 Q 75 110 85 100" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
  <path d="M 95 125 Q 105 135 115 125" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
  <!-- Smile -->
  <path d="M 75 135 Q 85 145 95 138" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
  <!-- Zzz -->
  <text x="135" y="70" font-family="sans-serif" font-weight="900" font-size="28" fill="#8B5CF6">Z</text>
  <text x="155" y="45" font-family="sans-serif" font-weight="900" font-size="22" fill="#A78BFA">z</text>
</svg>`;

// 3. diaper.png (Droplet)
const diaperSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M 100 20 C 100 20, 35 100, 35 140 C 35 175, 64 190, 100 190 C 136 190, 165 175, 165 140 C 165 100, 100 20, 100 20 Z" 
        fill="#60A5FA" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Highlight -->
  <path d="M 65 110 C 60 125, 60 145, 68 155" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
  <!-- Cute Face -->
  <circle cx="80" cy="135" r="6" fill="#000" />
  <circle cx="120" cy="135" r="6" fill="#000" />
  <path d="M 92 150 Q 100 158 108 150" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
</svg>`;

// 4. cry.png (Tear/Crying)
const crySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Droplet / Tear -->
  <path d="M 100 20 C 100 20, 40 95, 40 135 C 40 170, 67 185, 100 185 C 133 185, 160 170, 160 135 C 160 95, 100 20, 100 20 Z" 
        fill="#38BDF8" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Crying Eyes (closed > <) -->
  <path d="M 70 120 L 85 130 L 70 140" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 130 120 L 115 130 L 130 140" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Open crying mouth -->
  <ellipse cx="100" cy="155" rx="14" ry="10" fill="#000" />
</svg>`;

// 5. poop.png (Poop)
const poopSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Swirl Poop -->
  <path d="M 100 25 Q 115 25 110 45 Q 145 45 145 70 Q 165 80 165 115 Q 165 175, 100 175 Q 35 175 35 115 Q 35 80 55 70 Q 55 45 90 45 Q 85 25 100 25 Z" 
        fill="#B45309" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Cute Face -->
  <circle cx="80" cy="115" r="7" fill="#000" />
  <circle cx="120" cy="115" r="7" fill="#000" />
  <path d="M 88 135 Q 100 145 112 135" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
</svg>`;

// 6. play.png (Toy Blocks)
const playSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Bottom Left Block (Red) -->
  <rect x="25" y="105" width="70" height="70" rx="10" fill="#F87171" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Bottom Right Block (Blue) -->
  <rect x="105" y="105" width="70" height="70" rx="10" fill="#60A5FA" stroke="#000" stroke-width="8" stroke-linejoin="round" />
  <!-- Top Center Block (Green) -->
  <rect x="65" y="25" width="70" height="70" rx="10" fill="#34D399" stroke="#000" stroke-width="8" stroke-linejoin="round" />
</svg>`;

renderSvgToPng(feedSvg, path.join(iconsDir, 'feed.png'));
renderSvgToPng(sleepSvg, path.join(iconsDir, 'sleep.png'));
renderSvgToPng(diaperSvg, path.join(iconsDir, 'diaper.png'));
renderSvgToPng(crySvg, path.join(iconsDir, 'cry.png'));
renderSvgToPng(poopSvg, path.join(iconsDir, 'poop.png'));
renderSvgToPng(playSvg, path.join(iconsDir, 'play.png'));

// --- CHARACTERS ---

// Swaddle Baby (Newborn) - Base Helper
function makeNewbornSvg(bgColor, swaddleColor, hairBow = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <!-- Outer Swaddle Body -->
    <ellipse cx="100" cy="130" rx="55" ry="60" fill="${swaddleColor}" stroke="#000" stroke-width="8" />
    <path d="M 65 100 L 100 160 L 135 100" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
    <circle cx="100" cy="130" r="10" fill="#FFFFFF" opacity="0.5" />
    <!-- Baby Head -->
    <circle cx="100" cy="70" r="45" fill="#FED7AA" stroke="#000" stroke-width="8" />
    <!-- Hair -->
    <path d="M 85 30 Q 100 20 115 30" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
    ${hairBow ? `<path d="M 125 35 Q 135 25 145 35 Q 135 45 125 35 Z" fill="#F43F5E" stroke="#000" stroke-width="4" /><circle cx="135" cy="35" r="4" fill="#FFF" />` : ''}
    <!-- Sleeping Eyes -->
    <path d="M 75 70 Q 85 80 95 70" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
    <path d="M 105 70 Q 115 80 125 70" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
    <!-- Cheeks -->
    <circle cx="70" cy="80" r="7" fill="#F43F5E" opacity="0.4" />
    <circle cx="130" cy="80" r="7" fill="#F43F5E" opacity="0.4" />
    <!-- Cute Mouth -->
    <path d="M 95 85 Q 100 90 105 85" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" />
  </svg>`;
}

// Crawling Baby (6 Months)
function make6MonthSvg(outfitColor, hairBow = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <!-- Crawling Body -->
    <ellipse cx="120" cy="125" rx="45" ry="32" fill="${outfitColor}" stroke="#000" stroke-width="8" />
    <!-- Crawling Legs & Arms -->
    <path d="M 155 130 C 170 145, 175 160, 160 165" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" />
    <path d="M 80 135 L 70 165" stroke="#000" stroke-width="10" stroke-linecap="round" />
    <path d="M 110 140 L 100 170" stroke="#000" stroke-width="10" stroke-linecap="round" />
    <!-- Head -->
    <circle cx="65" cy="80" r="40" fill="#FED7AA" stroke="#000" stroke-width="8" />
    <!-- Hair -->
    <path d="M 50 45 Q 65 35 80 45" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none" />
    ${hairBow ? `<path d="M 85 45 Q 95 35 105 45 Q 95 55 85 45 Z" fill="#F43F5E" stroke="#000" stroke-width="4" />` : ''}
    <!-- Happy Face -->
    <circle cx="52" cy="78" r="5" fill="#000" />
    <circle cx="78" cy="78" r="5" fill="#000" />
    <path d="M 58 92 Q 65 102 72 92 Z" fill="#F43F5E" stroke="#000" stroke-width="3" />
  </svg>`;
}

// Sitting Baby playing with blocks (1 Year)
function make1YearSvg(outfitColor, hairBow = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <!-- Sitting Body -->
    <ellipse cx="100" cy="120" rx="40" ry="35" fill="${outfitColor}" stroke="#000" stroke-width="8" />
    <!-- Head -->
    <circle cx="100" cy="60" r="38" fill="#FED7AA" stroke="#000" stroke-width="8" />
    <!-- Hair -->
    <path d="M 80 25 Q 100 15 120 25" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none" />
    ${hairBow ? `<path d="M 125 25 Q 135 15 145 25 Q 135 35 125 25 Z" fill="#F43F5E" stroke="#000" stroke-width="4" />` : ''}
    <!-- Face -->
    <circle cx="88" cy="58" r="5" fill="#000" />
    <circle cx="112" cy="58" r="5" fill="#000" />
    <path d="M 94 72 Q 100 80 106 72 Z" fill="#F43F5E" stroke="#000" stroke-width="3" />
    <!-- Toy Block in front -->
    <rect x="80" y="145" width="40" height="40" rx="8" fill="#FBBF24" stroke="#000" stroke-width="6" />
    <rect x="130" y="155" width="30" height="30" rx="6" fill="#60A5FA" stroke="#000" stroke-width="6" />
  </svg>`;
}

// Toddler Walking (1.5 Years)
function make1Year6MonthSvg(outfitColor, hairBow = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <!-- Standing Body -->
    <rect x="75" y="85" width="50" height="55" rx="15" fill="${outfitColor}" stroke="#000" stroke-width="8" />
    <!-- Legs in motion -->
    <line x1="85" y1="140" x2="70" y2="175" stroke="#000" stroke-width="10" stroke-linecap="round" />
    <line x1="115" y1="140" x2="130" y2="175" stroke="#000" stroke-width="10" stroke-linecap="round" />
    <!-- Shoes -->
    <ellipse cx="65" cy="178" rx="12" ry="7" fill="#60A5FA" stroke="#000" stroke-width="4" />
    <ellipse cx="135" cy="178" rx="12" ry="7" fill="#60A5FA" stroke="#000" stroke-width="4" />
    <!-- Head -->
    <circle cx="100" cy="50" r="35" fill="#FED7AA" stroke="#000" stroke-width="8" />
    <!-- Hair -->
    <path d="M 80 20 Q 100 10 120 20" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none" />
    ${hairBow ? `<circle cx="70" cy="25" r="8" fill="#F43F5E" /><circle cx="130" cy="25" r="8" fill="#F43F5E" />` : ''}
    <!-- Face -->
    <circle cx="88" cy="48" r="5" fill="#000" />
    <circle cx="112" cy="48" r="5" fill="#000" />
    <path d="M 92 62 Q 100 70 108 62 Z" fill="#F43F5E" stroke="#000" stroke-width="3" />
  </svg>`;
}

renderSvgToPng(makeNewbornSvg('#DBEAFE', '#93C5FD', false), path.join(charactersDir, '신생아-남자.png'));
renderSvgToPng(makeNewbornSvg('#FFE4E6', '#FDA4AF', true), path.join(charactersDir, '신생아-여자.png'));

renderSvgToPng(make6MonthSvg('#86EFAC', false), path.join(charactersDir, '6개월-남자.png'));
renderSvgToPng(make6MonthSvg('#F472B6', true), path.join(charactersDir, '6개월-여자.png'));

renderSvgToPng(make1YearSvg('#60A5FA', false), path.join(charactersDir, '1년-남자.png'));
renderSvgToPng(make1YearSvg('#FB7185', true), path.join(charactersDir, '1년-여자.png'));

renderSvgToPng(make1Year6MonthSvg('#34D399', false), path.join(charactersDir, '1년6개월-남자.png'));
renderSvgToPng(make1Year6MonthSvg('#F43F5E', true), path.join(charactersDir, '1년6개월-여자.png'));

console.log('All icons and characters rendered successfully!');
