"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import gsap from "gsap";

/**
 * WebGL film-strip bend. Renders the open gallery image as a texture on a
 * subdivided plane and, while it expands, pushes only the horizontal CENTRE
 * toward the viewer (+Z) as a smooth raised-cosine hump, tapering to zero with
 * zero slope at the left/right edges — so the edges stay flat, full-width and
 * in-plane (flush with the neighbouring ticks, as if still attached to the rest
 * of the film strip) while the middle bulges out. A real perspective projection
 * makes the forward centre read nearer/larger. A GSAP timeline drives the bend
 * 0 -> crest -> 0, so it always settles perfectly flat and pixel-accurate; the
 * render loop only runs while a bend is animating. Transparent PNG cutouts keep
 * their alpha (premultiplied blending, transparent clear); whiteBorder items get
 * a hairline baked into the quad so the border bends with the surface.
 */

const SEG_X = 48;
const SEG_Y = 2;

const FOV_Y = (40 * Math.PI) / 180;
const CAM_DIST = 3.6;
const FOCAL = 1 / Math.tan(FOV_Y / 2);
const NEAR = 0.1;
const FAR = 100;

const DEFAULT_BULGE = 35;
const DEFAULT_POP = 24;
const DEFAULT_SHARPNESS = 0.5;
const DEFAULT_OVERSHOOT = 0;
const DEFAULT_WARP_MS = 1500;
const DEFAULT_OPEN_MS = 1500;
const DEFAULT_CLOSE_MS = 1500;
const CREST_FRACTION = 0.3;
/** Extra canvas margin (CSS px) added beyond the headroom the bulge needs. */
const PAD_MARGIN = 8;
const MAX_DPR = 2;

const BORDER_RGB: [number, number, number] = [226 / 255, 226 / 255, 226 / 255];

const VERT_SRC = `
attribute vec2 a_pos;
attribute vec2 a_uv;
uniform mat4 u_proj;
uniform float u_camDist;
uniform float u_bend;
uniform float u_bulge;
uniform float u_pop;
uniform float u_sharpness;
uniform float u_halfW;
uniform float u_halfH;
varying vec2 v_uv;
const float PI = 3.141592653589793;
void main() {
  float x = clamp(a_pos.x, -1.0, 1.0);
  float base = clamp(0.5 + 0.5 * cos(PI * x), 0.0, 1.0);
  float hump = pow(base, u_sharpness);
  vec3 p;
  p.x = a_pos.x * u_halfW;
  p.y = a_pos.y * u_halfH;
  p.z = (u_bulge + u_pop) * hump * u_bend;
  gl_Position = u_proj * vec4(p.x, p.y, p.z - u_camDist, 1.0);
  v_uv = a_uv;
}
`;

const FRAG_SRC = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform float u_border;
uniform vec2 u_borderW;
uniform vec3 u_borderColor;
varying vec2 v_uv;
void main() {
  if (u_border > 0.5 && (v_uv.x < u_borderW.x || v_uv.x > 1.0 - u_borderW.x || v_uv.y < u_borderW.y || v_uv.y > 1.0 - u_borderW.y)) {
    gl_FragColor = vec4(u_borderColor, 1.0);
    return;
  }
  vec2 uv = u_uvOffset + v_uv * u_uvScale;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
  gl_FragColor = texture2D(u_tex, uv);
}
`;

type Uniforms = {
  u_proj: WebGLUniformLocation | null;
  u_camDist: WebGLUniformLocation | null;
  u_bend: WebGLUniformLocation | null;
  u_bulge: WebGLUniformLocation | null;
  u_pop: WebGLUniformLocation | null;
  u_sharpness: WebGLUniformLocation | null;
  u_halfW: WebGLUniformLocation | null;
  u_halfH: WebGLUniformLocation | null;
  u_tex: WebGLUniformLocation | null;
  u_uvScale: WebGLUniformLocation | null;
  u_uvOffset: WebGLUniformLocation | null;
  u_border: WebGLUniformLocation | null;
  u_borderW: WebGLUniformLocation | null;
  u_borderColor: WebGLUniformLocation | null;
};

type GLState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  posBuf: WebGLBuffer;
  uvBuf: WebGLBuffer;
  idxBuf: WebGLBuffer;
  indexCount: number;
  u: Uniforms;
};

type TexEntry = { tex: WebGLTexture; aspect: number };

function perspective(aspect: number): Float32Array {
  const nf = 1 / (NEAR - FAR);
  const m = new Float32Array(16);
  m[0] = FOCAL / aspect;
  m[5] = FOCAL;
  m[10] = (FAR + NEAR) * nf;
  m[11] = -1;
  m[14] = 2 * FAR * NEAR * nf;
  return m;
}

/** cover/contain -> texture (scale, offset) that maps quad uv (0..1) to the image. */
function computeUv(
  imgAspect: number,
  boxAspect: number,
  fit: "cover" | "contain",
  position: string,
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  let fracX = 1;
  let fracY = 1;
  if (fit === "cover") {
    if (imgAspect >= boxAspect) fracX = imgAspect / boxAspect;
    else fracY = boxAspect / imgAspect;
  } else if (imgAspect >= boxAspect) {
    fracY = boxAspect / imgAspect;
  } else {
    fracX = imgAspect / boxAspect;
  }

  let cy = 0.5;
  if (fracY > 1) {
    if (position === "top") cy = 0.5 / fracY;
    else if (position === "bottom") cy = 1 - 0.5 / fracY;
  }

  const scaleX = 1 / fracX;
  const scaleY = 1 / fracY;
  return { scaleX, scaleY, offsetX: 0.5 - 0.5 * scaleX, offsetY: cy - 0.5 * scaleY };
}

function buildPlane(): { positions: Float32Array; uvs: Float32Array; indices: Uint16Array } {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= SEG_Y; j++) {
    const ty = j / SEG_Y;
    const py = 1 - ty * 2;
    for (let i = 0; i <= SEG_X; i++) {
      const tx = i / SEG_X;
      positions.push(tx * 2 - 1, py);
      uvs.push(tx, ty);
    }
  }
  const cols = SEG_X + 1;
  for (let j = 0; j < SEG_Y; j++) {
    for (let i = 0; i < SEG_X; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createGL(canvas: HTMLCanvasElement): GLState | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const geo = buildPlane();
  const posBuf = gl.createBuffer();
  const uvBuf = gl.createBuffer();
  const idxBuf = gl.createBuffer();
  if (!posBuf || !uvBuf || !idxBuf) return null;

  const aPos = gl.getAttribLocation(program, "a_pos");
  const aUv = gl.getAttribLocation(program, "a_uv");
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, geo.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, geo.uvs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const u: Uniforms = {
    u_proj: gl.getUniformLocation(program, "u_proj"),
    u_camDist: gl.getUniformLocation(program, "u_camDist"),
    u_bend: gl.getUniformLocation(program, "u_bend"),
    u_bulge: gl.getUniformLocation(program, "u_bulge"),
    u_pop: gl.getUniformLocation(program, "u_pop"),
    u_sharpness: gl.getUniformLocation(program, "u_sharpness"),
    u_halfW: gl.getUniformLocation(program, "u_halfW"),
    u_halfH: gl.getUniformLocation(program, "u_halfH"),
    u_tex: gl.getUniformLocation(program, "u_tex"),
    u_uvScale: gl.getUniformLocation(program, "u_uvScale"),
    u_uvOffset: gl.getUniformLocation(program, "u_uvOffset"),
    u_border: gl.getUniformLocation(program, "u_border"),
    u_borderW: gl.getUniformLocation(program, "u_borderW"),
    u_borderColor: gl.getUniformLocation(program, "u_borderColor"),
  };

  return { gl, program, posBuf, uvBuf, idxBuf, indexCount: geo.indices.length, u };
}

function textureUrl(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;
}

function loadTexture(gl: WebGLRenderingContext, src: string): Promise<TexEntry> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const tex = gl.createTexture();
      if (!tex) {
        reject(new Error("texture"));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      resolve({ tex, aspect: img.naturalWidth / img.naturalHeight });
    };
    img.onerror = () => reject(new Error("image"));
    img.src = textureUrl(src);
  });
}

type Props = {
  rowRef: RefObject<HTMLUListElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  openIndex: number;
  isImage: boolean;
  src: string;
  fit: "cover" | "contain";
  position: string;
  whiteBorder: boolean;
  onActiveChange: (index: number | null) => void;
};

export function FilmBendCanvas({
  rowRef,
  containerRef,
  openIndex,
  isImage,
  src,
  fit,
  position,
  whiteBorder,
  onActiveChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLState | null>(null);
  const texCache = useRef<Map<string, TexEntry>>(new Map());
  const inflightRef = useRef<Map<string, Promise<TexEntry | null>>>(new Map());
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const prevRef = useRef<{
    index: number;
    src: string;
    isImage: boolean;
    fit: "cover" | "contain";
    position: string;
    whiteBorder: boolean;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cache = texCache.current;
    const inflight = inflightRef.current;

    const build = () => {
      glRef.current = createGL(canvas);
    };
    build();

    // A lost GPU context (driver reset, tab restore, HMR) silently no-ops every
    // draw; catch it, keep the canvas restorable, and rebuild on restore so the
    // next bend works without a manual page reload.
    const onLost = (e: Event) => {
      e.preventDefault();
      tlRef.current?.kill();
      tlRef.current = null;
      cache.clear();
      inflight.clear();
      glRef.current = null;
    };
    const onRestored = () => build();
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      tlRef.current?.kill();
      tlRef.current = null;
      const state = glRef.current;
      if (state) {
        const { gl } = state;
        cache.forEach((entry) => gl.deleteTexture(entry.tex));
        gl.deleteBuffer(state.posBuf);
        gl.deleteBuffer(state.uvBuf);
        gl.deleteBuffer(state.idxBuf);
        gl.deleteProgram(state.program);
      }
      cache.clear();
      inflight.clear();
      glRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = glRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;

    tlRef.current?.kill();
    tlRef.current = null;
    onActiveChange(null);
    canvas.style.opacity = "0";

    const prev = prevRef.current;
    prevRef.current = { index: openIndex, src, isImage, fit, position, whiteBorder };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let cancelled = false;

    // Bend style/curve knobs — baked-in defaults tuned for the final look.
    const bulge = DEFAULT_BULGE / 100;
    const pop = DEFAULT_POP / 100;
    const sharpness = DEFAULT_SHARPNESS;
    const camDist = CAM_DIST;
    const overshoot = DEFAULT_OVERSHOOT;
    const crestFrac = CREST_FRACTION;
    const warpMs = DEFAULT_WARP_MS;
    const openMs = DEFAULT_OPEN_MS;
    const closeMs = DEFAULT_CLOSE_MS;

    type Target = {
      index: number;
      src: string;
      fit: "cover" | "contain";
      position: string;
      whiteBorder: boolean;
    };

    const measure = (index: number) => {
      const row = rowRef.current;
      const container = containerRef.current;
      if (!row || !container) return null;
      const tile = row.querySelectorAll<HTMLElement>("[data-tile]")[index];
      const box = tile?.querySelector<HTMLElement>("[data-img-box]");
      if (!box) return null;
      const r = box.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      return { left: r.left - c.left, top: r.top - c.top, w: r.width, h: r.height };
    };

    const draw = (t: Target, bend: number) => {
      const entry = texCache.current.get(t.src);
      const box = measure(t.index);
      if (!entry || !box || box.w < 1 || box.h < 1) return false;
      const { gl, program, u, indexCount } = state;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      // Headroom: the convex bulge projects past the flat box under perspective,
      // so grow the canvas + GL viewport beyond the box by the magnification the
      // current bulge/pop/depth can reach. The flat quad is still mapped exactly
      // onto the box rect (proj scale below), so the resting image stays aligned.
      const mag = camDist / Math.max(camDist - (bulge + pop), 0.35);
      const padX = Math.ceil(((mag - 1) * box.w) / 2) + PAD_MARGIN;
      const padY = Math.ceil(((mag - 1) * box.h) / 2) + PAD_MARGIN;
      const cwCss = box.w + padX * 2;
      const chCss = box.h + padY * 2;
      const cw = Math.max(1, Math.round(cwCss * dpr));
      const ch = Math.max(1, Math.round(chCss * dpr));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      canvas.style.left = `${box.left - padX}px`;
      canvas.style.top = `${box.top - padY}px`;
      canvas.style.width = `${cwCss}px`;
      canvas.style.height = `${chCss}px`;

      const boxAspect = Math.max(box.w, 1) / Math.max(box.h, 1);
      const uv = computeUv(entry.aspect, boxAspect, t.fit, t.position);
      const halfH = camDist / FOCAL;
      const halfW = halfH * boxAspect;

      const proj = perspective(boxAspect);
      proj[0] *= box.w / cwCss;
      proj[5] *= box.h / chCss;

      gl.viewport(0, 0, cw, ch);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniformMatrix4fv(u.u_proj, false, proj);
      gl.uniform1f(u.u_camDist, camDist);
      gl.uniform1f(u.u_halfW, halfW);
      gl.uniform1f(u.u_halfH, halfH);
      gl.uniform1f(u.u_bulge, bulge);
      gl.uniform1f(u.u_pop, pop);
      gl.uniform1f(u.u_sharpness, sharpness);
      gl.uniform1f(u.u_bend, bend);
      gl.uniform2f(u.u_uvScale, uv.scaleX, uv.scaleY);
      gl.uniform2f(u.u_uvOffset, uv.offsetX, uv.offsetY);
      gl.uniform1f(u.u_border, t.whiteBorder ? 1 : 0);
      gl.uniform2f(u.u_borderW, 1 / box.w, 1 / box.h);
      gl.uniform3f(u.u_borderColor, BORDER_RGB[0], BORDER_RGB[1], BORDER_RGB[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, entry.tex);
      gl.uniform1i(u.u_tex, 0);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      return true;
    };

    // One motion: a single bend timeline tracks the live [data-img-box] rect
    // every frame, so the surface bends *as* the box grows (open) or collapses
    // (close). On open the timeline is padded to outlast the CSS grow so the
    // WebGL surface stays visible until the box settles perfectly flat.
    const play = (t: Target, spanMs: number, holdMs: number) => {
      if (cancelled) return;
      const bend = { v: 0 };
      let revealed = false;
      // Reveal the WebGL surface (and hide the flat <img>) only once a frame has
      // actually rendered, so a first-frame measurement miss can never leave the
      // flat image hidden behind an empty canvas.
      const frame = () => {
        if (draw(t, bend.v) && !revealed) {
          revealed = true;
          onActiveChange(t.index);
          canvas.style.opacity = "1";
        }
      };
      frame();
      const crest = (spanMs / 1000) * crestFrac;
      const relax = (spanMs / 1000) * (1 - crestFrac);
      const tl = gsap.timeline({
        onUpdate: frame,
        onComplete: () => {
          bend.v = 0;
          frame();
          // Hand back to the flat <img> without an empty frame. onActiveChange
          // reveals the <img> via React state, which (fired from this rAF
          // callback) only commits a macrotask later — so hiding the canvas now
          // would leave one paint where neither the canvas nor the still-hidden
          // <img> shows: the settle flicker. Reveal the <img> first and keep the
          // identical flat canvas painted until the <img> has committed, then
          // hide the canvas. cancelled skips this if a new bend has taken over.
          onActiveChange(null);
          requestAnimationFrame(() => {
            if (cancelled) return;
            requestAnimationFrame(() => {
              if (cancelled) return;
              canvas.style.opacity = "0";
            });
          });
        },
      });
      tl.to(bend, { v: 1, duration: crest, ease: `back.out(${overshoot})` }).to(
        bend,
        { v: 0, duration: relax, ease: "power2.out" },
      );
      const hold = holdMs / 1000;
      if (tl.duration() < hold) tl.to(bend, { v: 0, duration: hold - tl.duration() });
      tlRef.current = tl;
    };

    const ensureTexture = (source: string): Promise<TexEntry | null> => {
      const cached = texCache.current.get(source);
      if (cached) return Promise.resolve(cached);
      let inflight = inflightRef.current.get(source);
      if (!inflight) {
        inflight = loadTexture(state.gl, source)
          .then((entry) => {
            inflightRef.current.delete(source);
            // Cache the texture even if this bend was cancelled, so a later hover
            // of the same image plays instantly instead of reloading it.
            if (!glRef.current) {
              state.gl.deleteTexture(entry.tex);
              return null;
            }
            texCache.current.set(source, entry);
            return entry;
          })
          .catch(() => {
            inflightRef.current.delete(source);
            return null;
          });
        inflightRef.current.set(source, inflight);
      }
      return inflight;
    };

    const start = (t: Target, spanMs: number, holdMs: number) => {
      ensureTexture(t.src).then((entry) => {
        if (cancelled || !entry) return;
        play(t, spanMs, holdMs);
      });
    };

    if (isImage) {
      start(
        { index: openIndex, src, fit, position, whiteBorder },
        warpMs,
        Math.max(warpMs, openMs),
      );
    } else if (prev && prev.isImage && prev.index !== openIndex) {
      start(
        {
          index: prev.index,
          src: prev.src,
          fit: prev.fit,
          position: prev.position,
          whiteBorder: prev.whiteBorder,
        },
        closeMs,
        closeMs,
      );
    }

    return () => {
      cancelled = true;
      tlRef.current?.kill();
      tlRef.current = null;
      onActiveChange(null);
      canvas.style.opacity = "0";
    };
  }, [openIndex, src, isImage, fit, position, whiteBorder, rowRef, containerRef, onActiveChange]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 block"
      style={{ opacity: 0 }}
    />
  );
}
