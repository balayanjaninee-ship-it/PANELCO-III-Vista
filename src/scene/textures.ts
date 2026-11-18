import * as THREE from 'three';

export interface ProceduralTextureSet {
  licensePlate: THREE.CanvasTexture;
  cargoPlate: THREE.CanvasTexture;
  philippinePlate: THREE.CanvasTexture;
  liveryFrontNose: THREE.CanvasTexture;
  liverySideScript: THREE.CanvasTexture;
  liveryDoorCrest: THREE.CanvasTexture;
  liveryRearPanelco: THREE.CanvasTexture;
  liveryRearNumber: THREE.CanvasTexture;
  liveryTrSticker: THREE.CanvasTexture;
  tireTreadBump: THREE.CanvasTexture;
  tireSidewallColor: THREE.CanvasTexture;
  tireSidewallBump: THREE.CanvasTexture;
  metallicFlakeNormal: THREE.DataTexture;
  grilleMesh: THREE.CanvasTexture;
  grilleMeshBump: THREE.CanvasTexture;
  stepPadBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  floorGridDark: THREE.CanvasTexture;
  floorGridLight: THREE.CanvasTexture;
  floorMicroRoughness: THREE.CanvasTexture;
  hiaceBadge: THREE.CanvasTexture;
  superGlBadge: THREE.CanvasTexture;
  dashCluster: THREE.CanvasTexture;
  dispose: () => void;
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for procedural textures');
  }
  return [canvas, ctx];
}

function createLicensePlateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 256);

  // Authentic JDM enameled white aluminum plate gradient (matches reference Photo 1)
  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#f8f9f6');
  bg.addColorStop(0.5, '#f0f2ee');
  bg.addColorStop(1, '#e1e5df');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#c4cbc3';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 246);

  ctx.strokeStyle = '#255c35';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, 480, 224);

  const drawBolt = (cx: number, cy: number, sealed: boolean) => {
    ctx.beginPath();
    ctx.arc(cx, cy, sealed ? 13 : 9, 0, Math.PI * 2);
    ctx.fillStyle = sealed ? '#cfd5cf' : '#9ba49d';
    ctx.fill();
    ctx.strokeStyle = '#5c665f';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  drawBolt(108, 56, true);
  drawBolt(404, 56, false);

  ctx.fillStyle = '#14532d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('品川 400', 256, 62);

  ctx.font = '700 50px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('た', 76, 164);

  ctx.font = '700 112px "IBM Plex Mono", monospace';
  ctx.fillText('20-04', 282, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates the crisp dark showroom "HIACE CARGO" plate matching reference Photos 3 & 4.
 */
function createCargoPlateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 256);

  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#23272e');
  bg.addColorStop(0.5, '#191c22');
  bg.addColorStop(1, '#111419');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#39404b';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 248);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 96px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('HIACE', 256, 108);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 44px "IBM Plex Mono", monospace';
  ctx.fillText('C A R G O', 256, 184);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates the Philippine white embossed "URO 582" fleet license plate matching the sketch.
 */
function createPhilippinePlateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 256);

  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.5, '#f6f8fa');
  bg.addColorStop(1, '#e8edf2');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  // Subtle Philippine plate top accent bar
  ctx.fillStyle = '#0b3d91';
  ctx.fillRect(14, 14, 484, 34);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PILIPINAS', 256, 32);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 52, 476, 186);

  // Subtle mounting holes
  for (const bx of [118, 394]) {
    ctx.beginPath();
    ctx.arc(bx, 72, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
  }

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 108px "IBM Plex Mono", "Plus Jakarta Sans", monospace';
  ctx.fillText('URO 582', 256, 154);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Exact dominant green sampled directly from the uploaded official PANELCO III logo ring */
const PANELCO_LOGO_GREEN = '#00923f';
const PANELCO_LOGO_DARK_GREEN = '#005b2e';
const PANELCO_LOGO_ASSET_URL = '/panelco-3-logo.png';
const BRUSH_SCRIPT_FONT_STACK =
  '"Brush Script MT", "Brush Script Std", "Norican", cursive';

/**
 * Paints crisp, unmistakably bold cut-vinyl lettering in official PANELCO III green (#00923f)
 * with a clean outer translucent light contrast halo so bold strokes read clearly on any paint finish.
 */
function paintBoldVinylText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boldStrokeWidth: number,
  haloExtraWidth: number,
) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (haloExtraWidth > 0) {
    ctx.lineWidth = boldStrokeWidth + haloExtraWidth;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.strokeText(text, x, y);
  }

  if (boldStrokeWidth > 0) {
    ctx.lineWidth = boldStrokeWidth;
    ctx.strokeStyle = PANELCO_LOGO_GREEN;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = PANELCO_LOGO_GREEN;
  ctx.fillText(text, x, y);
}

/**
 * Triggers a clean texture redraw and on-demand viewport repaint once webfonts settle.
 */
function bindWebfontRedraw(
  fontSpec: string,
  sampleText: string,
  paint: () => void,
  texture: THREE.CanvasTexture,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
) {
  if (typeof document === 'undefined' || !document.fonts) return;

  const refresh = () => {
    if (isDisposed()) return;
    paint();
    texture.needsUpdate = true;
    onAsyncUpdate?.();
  };

  document.fonts.load(fontSpec, sampleText).then(refresh).catch(() => {});
  document.fonts.ready.then(refresh).catch(() => {});
}

/**
 * Generates bold official PANELCO III green front-nose lettering centered cleanly on the upper nose
 * (unit "75" removed from front elevation).
 */
function createLiveryFrontNoseTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 340);

  const paintNose = () => {
    ctx.clearRect(0, 0, 1024, 340);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 124px "Plus Jakarta Sans", sans-serif';
    paintBoldVinylText(ctx, 'PANELCO III', 512, 172, 5.2, 4.0);
  };

  paintNose();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  bindWebfontRedraw(
    '800 124px "Plus Jakarta Sans"',
    'PANELCO III',
    paintNose,
    texture,
    isDisposed,
    onAsyncUpdate,
  );

  return texture;
}

/**
 * Generates bold green (#00923f) Brush Script MT side door tagline "Your delight, our success."
 * with zero underline, refreshing automatically once fonts settle.
 */
function createLiverySideScriptTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1400, 320);

  const paintTagline = () => {
    ctx.clearRect(0, 0, 1400, 320);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 132px ${BRUSH_SCRIPT_FONT_STACK}`;
    paintBoldVinylText(ctx, 'Your delight, our success.', 700, 162, 5.5, 3.6);
  };

  paintTagline();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  bindWebfontRedraw(
    '400 132px "Norican"',
    'Your delight, our success.',
    paintTagline,
    texture,
    isDisposed,
    onAsyncUpdate,
  );

  return texture;
}

/**
 * Loads the user's official uploaded PANELCO III circular PNG emblem directly onto a
 * crisp 1024×1024 transparent CanvasTexture, symmetrically cropped to its exact circular
 * pixel bounds (422×412 within 595×500) so it renders 100% round with zero distortion.
 */
function createLiveryDoorCrestTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const size = 1024;
  const [canvas, ctx] = createCanvas(size, size);
  ctx.clearRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (isDisposed()) return;
      ctx.clearRect(0, 0, size, size);

      // Exact non-transparent circular emblem bounds in the 595×500 uploaded PNG:
      // minX=97, maxX=518 (w=422), minY=35, maxY=446 (h=412) -> square crop 428×428 centered on seal
      const isUploadedDim = img.naturalWidth === 595 && img.naturalHeight === 500;
      const sx = isUploadedDim ? 94 : 0;
      const sy = isUploadedDim ? 27 : 0;
      const sw = isUploadedDim ? 428 : img.naturalWidth;
      const sh = isUploadedDim ? 428 : img.naturalHeight;

      const pad = 16;
      const drawSize = size - pad * 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, pad, pad, drawSize, drawSize);

      texture.needsUpdate = true;
      onAsyncUpdate?.();
    };
    img.src = PANELCO_LOGO_ASSET_URL;
  }

  return texture;
}

/**
 * Generates bold PANELCO III green (#00923f) rear tailgate lettering (Rear View sketch).
 */
function createLiveryRearPanelcoTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 240);

  const paintRearTitle = () => {
    ctx.clearRect(0, 0, 1024, 240);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 136px "Plus Jakarta Sans", sans-serif';
    paintBoldVinylText(ctx, 'PANELCO III', 512, 122, 5.5, 4.0);
  };

  paintRearTitle();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  bindWebfontRedraw(
    '800 136px "Plus Jakarta Sans"',
    'PANELCO III',
    paintRearTitle,
    texture,
    isDisposed,
    onAsyncUpdate,
  );

  return texture;
}

/**
 * Generates bold PANELCO III green (#00923f) rear tailgate right-side unit number "75".
 */
function createLiveryRearNumberTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);

  const paintRearNumber = () => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 184px "Plus Jakarta Sans", sans-serif';
    paintBoldVinylText(ctx, '75', 128, 134, 6.5, 4.5);
  };

  paintRearNumber();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  bindWebfontRedraw(
    '800 184px "Plus Jakarta Sans"',
    '75',
    paintRearNumber,
    texture,
    isDisposed,
    onAsyncUpdate,
  );

  return texture;
}

/**
 * Generates bold upper-left rear window "TR" registration sticker harmonized with logo green.
 */
function createLiveryTrStickerTexture(
  maxAnisotropy: number,
  isDisposed: () => boolean,
  onAsyncUpdate?: () => void,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(180, 150);

  const paintTrSticker = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 180, 150);

    ctx.strokeStyle = PANELCO_LOGO_DARK_GREEN;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 170, 140);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
    paintBoldVinylText(ctx, 'TR', 90, 78, 3.6, 0);
  };

  paintTrSticker();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  bindWebfontRedraw(
    '800 84px "Plus Jakarta Sans"',
    'TR',
    paintTrSticker,
    texture,
    isDisposed,
    onAsyncUpdate,
  );

  return texture;
}

function createTireTreadBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#dcdcdc';
  const rows = 28;
  const rowH = 512 / rows;

  for (let i = 0; i < rows; i++) {
    const y = i * rowH;
    ctx.fillRect(8, y + 2, 92, rowH - 5);
    ctx.fillRect(412, y + 2, 92, rowH - 5);

    ctx.fillStyle = '#606060';
    ctx.fillRect(18, y + rowH * 0.45, 72, 2);
    ctx.fillRect(422, y + rowH * 0.45, 72, 2);
    ctx.fillStyle = '#dcdcdc';

    ctx.beginPath();
    ctx.moveTo(124, y + 2);
    ctx.lineTo(240, y + 6);
    ctx.lineTo(240, y + rowH - 3);
    ctx.lineTo(124, y + rowH - 7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(272, y + 6);
    ctx.lineTo(388, y + 2);
    ctx.lineTo(388, y + rowH - 7);
    ctx.lineTo(272, y + rowH - 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#090909';
  ctx.fillRect(106, 0, 14, 512);
  ctx.fillRect(246, 0, 18, 512);
  ctx.fillRect(392, 0, 14, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 7);
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createTireSidewallTextures(
  maxAnisotropy: number,
): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const cx = size / 2;
  const cy = size / 2;
  const [cCanvas, cCtx] = createCanvas(size, size);
  const [bCanvas, bCtx] = createCanvas(size, size);

  cCtx.fillStyle = '#1d2025';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, size, size);

  const ringSpecs = [
    { r: 244, w: 8, col: '#24282f', bmp: '#909090' },
    { r: 224, w: 4, col: '#171a1f', bmp: '#202020' },
    { r: 192, w: 3, col: '#272b33', bmp: '#a5a5a5' },
    { r: 162, w: 4, col: '#181b20', bmp: '#252525' },
  ];

  for (const ring of ringSpecs) {
    cCtx.beginPath();
    cCtx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    cCtx.strokeStyle = ring.col;
    cCtx.lineWidth = ring.w;
    cCtx.stroke();

    bCtx.beginPath();
    bCtx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    bCtx.strokeStyle = ring.bmp;
    bCtx.lineWidth = ring.w;
    bCtx.stroke();
  }

  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * 228;
    const y1 = cy + Math.sin(a) * 228;
    const x2 = cx + Math.cos(a) * 248;
    const y2 = cy + Math.sin(a) * 248;

    bCtx.beginPath();
    bCtx.moveTo(x1, y1);
    bCtx.lineTo(x2, y2);
    bCtx.strokeStyle = '#7c7c7c';
    bCtx.lineWidth = 2;
    bCtx.stroke();
  }

  const drawArcText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    radius: number,
    startAngle: number,
    stepAngle: number,
    color: string,
    font: string,
  ) => {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < text.length; i++) {
      const a = startAngle + i * stepAngle;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  drawArcText(cCtx, 'BRIDGESTONE  ECOPIA', 208, -Math.PI * 0.72, 0.068, '#2f343d', '700 17px sans-serif');
  drawArcText(bCtx, 'BRIDGESTONE  ECOPIA', 208, -Math.PI * 0.72, 0.068, '#e8e8e8', '700 17px sans-serif');

  drawArcText(cCtx, '195/80R15  107/105L  LT', 208, Math.PI * 0.22, 0.064, '#2f343d', '700 16px monospace');
  drawArcText(bCtx, '195/80R15  107/105L  LT', 208, Math.PI * 0.22, 0.064, '#ededed', '700 16px monospace');

  const color = new THREE.CanvasTexture(cCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

function createMetallicFlakeNormalTexture(maxAnisotropy: number): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  let seed = 133791;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const hasFlake = rand() > 0.72;
    const nx = hasFlake ? 128 + (rand() - 0.5) * 34 : 128 + (rand() - 0.5) * 4;
    const ny = hasFlake ? 128 + (rand() - 0.5) * 34 : 128 + (rand() - 0.5) * 4;
    data[idx] = Math.round(nx);
    data[idx + 1] = Math.round(ny);
    data[idx + 2] = 250;
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createGrilleMeshTextures(
  maxAnisotropy: number,
): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const [colorCanvas, cCtx] = createCanvas(256, 256);
  const [bumpCanvas, bCtx] = createCanvas(256, 256);

  cCtx.fillStyle = '#090b0f';
  cCtx.fillRect(0, 0, 256, 256);

  bCtx.fillStyle = '#121212';
  bCtx.fillRect(0, 0, 256, 256);

  const stepX = 22;
  const stepY = 14;

  cCtx.strokeStyle = '#20262f';
  cCtx.lineWidth = 3;
  bCtx.strokeStyle = '#e0e0e0';
  bCtx.lineWidth = 3.5;

  for (let y = -stepY; y < 256 + stepY; y += stepY) {
    for (let x = -stepX; x < 256 + stepX; x += stepX) {
      const offsetX = Math.floor(y / stepY) % 2 === 0 ? 0 : stepX * 0.5;
      const cx = x + offsetX;
      const cy = y;

      const drawHex = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(cx - 8.5, cy);
        ctx.lineTo(cx - 4.2, cy - 5.8);
        ctx.lineTo(cx + 4.2, cy - 5.8);
        ctx.lineTo(cx + 8.5, cy);
        ctx.lineTo(cx + 4.2, cy + 5.8);
        ctx.lineTo(cx - 4.2, cy + 5.8);
        ctx.closePath();
        ctx.stroke();
      };

      drawHex(cCtx);
      drawHex(bCtx);
    }
  }

  const color = new THREE.CanvasTexture(colorCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(6, 2);
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 2);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

function createStepPadBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#383838';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#dadada';
  for (let y = 0; y < 256; y += 14) {
    ctx.fillRect(0, y + 3, 256, 5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 2);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 1024);
  ctx.clearRect(0, 0, 512, 1024);

  // Soft elliptical studio underbody occlusion shadow matching Photos 2 & 4
  ctx.save();
  ctx.translate(256, 512);
  ctx.scale(1.04, 2.06);
  const bodyGrad = ctx.createRadialGradient(0, 0, 24, 0, 0, 212);
  bodyGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
  bodyGrad.addColorStop(0.52, 'rgba(0, 0, 0, 0.68)');
  bodyGrad.addColorStop(0.78, 'rgba(0, 0, 0, 0.24)');
  bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 212, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Four tight high-density tire contact ovals
  const tireSpots: [number, number][] = [
    [136, 286],
    [376, 286],
    [136, 744],
    [376, 744],
  ];
  for (const [tx, ty] of tireSpots) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(0.84, 1.4);
    const tGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 64);
    tGrad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
    tGrad.addColorStop(0.58, 'rgba(0, 0, 0, 0.58)');
    tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFloorGridTexture(
  variant: 'dark' | 'light',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);

  if (variant === 'dark') {
    ctx.fillStyle = '#0f1319';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.024)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const p = i * 128;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(186, 208, 236, 0.085)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 512, 512);
  } else {
    // Pure crisp white automotive photo gallery floor (minimal whisper-light seam lines)
    ctx.fillStyle = '#f8f9fb';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.022)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createFloorMicroRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#363636';
  ctx.fillRect(0, 0, 256, 256);

  let seed = 42421;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 380; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 6 + rand() * 24;
    const v = Math.round(42 + rand() * 28);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${v}, ${v}, ${v}, 0.25)`);
    g.addColorStop(1, `rgba(${v}, ${v}, ${v}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createMetallicBadgeTexture(
  text: string,
  subtext: string | null,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 128);
  ctx.clearRect(0, 0, 512, 128);

  const grad = ctx.createLinearGradient(0, 14, 0, 114);
  grad.addColorStop(0, '#f5f8fc');
  grad.addColorStop(0.45, '#b8c3d0');
  grad.addColorStop(0.55, '#7e8997');
  grad.addColorStop(1, '#dce3ec');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  if (subtext) {
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#aeb9c7';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtext, 256, 34);
  }

  ctx.shadowBlur = 4;
  ctx.fillStyle = grad;
  ctx.font = subtext
    ? '800 50px "Plus Jakarta Sans", sans-serif'
    : '700 62px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(text, 256, subtext ? 84 : 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createDashClusterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 160);
  ctx.fillStyle = '#0d1015';
  ctx.fillRect(0, 0, 512, 160);

  const drawDial = (cx: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, 84, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.78 + (i / 10) * Math.PI * 1.44;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 12), 84 + Math.sin(a) * (r - 12));
      ctx.lineTo(cx + Math.cos(a) * (r - 4), 84 + Math.sin(a) * (r - 4));
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, 84);
    ctx.lineTo(cx - 26, 108);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawDial(124, 54);
  drawDial(388, 54);

  ctx.fillStyle = '#152232';
  ctx.fillRect(204, 34, 104, 96);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(204, 34, 104, 96);
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HIACE', 256, 72);
  ctx.font = '500 14px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('P · 0 km/h', 256, 102);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createProceduralTextures(
  maxAnisotropy: number,
  onAsyncUpdate?: () => void,
): ProceduralTextureSet {
  const clampedAniso = Math.max(1, Math.min(maxAnisotropy, 16));
  let disposed = false;
  const isDisposed = () => disposed;

  const licensePlate = createLicensePlateTexture(clampedAniso);
  const cargoPlate = createCargoPlateTexture(clampedAniso);
  const philippinePlate = createPhilippinePlateTexture(clampedAniso);
  const liveryFrontNose = createLiveryFrontNoseTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const liverySideScript = createLiverySideScriptTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const liveryDoorCrest = createLiveryDoorCrestTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const liveryRearPanelco = createLiveryRearPanelcoTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const liveryRearNumber = createLiveryRearNumberTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const liveryTrSticker = createLiveryTrStickerTexture(
    clampedAniso,
    isDisposed,
    onAsyncUpdate,
  );
  const tireTreadBump = createTireTreadBumpTexture(clampedAniso);
  const sidewall = createTireSidewallTextures(clampedAniso);
  const metallicFlakeNormal = createMetallicFlakeNormalTexture(clampedAniso);
  const grille = createGrilleMeshTextures(clampedAniso);
  const stepPadBump = createStepPadBumpTexture(clampedAniso);
  const contactShadow = createContactShadowTexture();
  const floorGridDark = createFloorGridTexture('dark', clampedAniso);
  const floorGridLight = createFloorGridTexture('light', clampedAniso);
  const floorMicroRoughness = createFloorMicroRoughnessTexture(clampedAniso);
  const hiaceBadge = createMetallicBadgeTexture('HIACE', 'TOYOTA', clampedAniso);
  const superGlBadge = createMetallicBadgeTexture('SUPER GL', null, clampedAniso);
  const dashCluster = createDashClusterTexture(clampedAniso);

  return {
    licensePlate,
    cargoPlate,
    philippinePlate,
    liveryFrontNose,
    liverySideScript,
    liveryDoorCrest,
    liveryRearPanelco,
    liveryRearNumber,
    liveryTrSticker,
    tireTreadBump,
    tireSidewallColor: sidewall.color,
    tireSidewallBump: sidewall.bump,
    metallicFlakeNormal,
    grilleMesh: grille.color,
    grilleMeshBump: grille.bump,
    stepPadBump,
    contactShadow,
    floorGridDark,
    floorGridLight,
    floorMicroRoughness,
    hiaceBadge,
    superGlBadge,
    dashCluster,
    dispose: () => {
      disposed = true;
      licensePlate.dispose();
      cargoPlate.dispose();
      philippinePlate.dispose();
      liveryFrontNose.dispose();
      liverySideScript.dispose();
      liveryDoorCrest.dispose();
      liveryRearPanelco.dispose();
      liveryRearNumber.dispose();
      liveryTrSticker.dispose();
      tireTreadBump.dispose();
      sidewall.color.dispose();
      sidewall.bump.dispose();
      metallicFlakeNormal.dispose();
      grille.color.dispose();
      grille.bump.dispose();
      stepPadBump.dispose();
      contactShadow.dispose();
      floorGridDark.dispose();
      floorGridLight.dispose();
      floorMicroRoughness.dispose();
      hiaceBadge.dispose();
      superGlBadge.dispose();
      dashCluster.dispose();
    },
  };
}
