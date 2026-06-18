import * as THREE from "three"

let sparkTexture = null

export function getSparkTexture() {
	if (sparkTexture) return sparkTexture

	const size = 128
	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext("2d")
	const center = size / 2
	const grad = ctx.createRadialGradient(center, center, 0, center, center, center)
	grad.addColorStop(0, "rgba(255, 255, 255, 1)")
	grad.addColorStop(0.08, "rgba(220, 235, 255, 0.95)")
	grad.addColorStop(0.22, "rgba(140, 180, 255, 0.45)")
	grad.addColorStop(0.45, "rgba(90, 120, 220, 0.15)")
	grad.addColorStop(1, "rgba(0, 0, 0, 0)")
	ctx.fillStyle = grad
	ctx.fillRect(0, 0, size, size)

	sparkTexture = new THREE.CanvasTexture(canvas)
	sparkTexture.colorSpace = THREE.SRGBColorSpace
	return sparkTexture
}

let bloomTexture = null

export function getBloomTexture() {
	if (bloomTexture) return bloomTexture

	const size = 128
	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext("2d")
	const c = size / 2
	const grad = ctx.createRadialGradient(c, c, 0, c, c, c)
	grad.addColorStop(0, "rgba(255, 220, 235, 0.9)")
	grad.addColorStop(0.15, "rgba(240, 90, 165, 0.5)")
	grad.addColorStop(0.42, "rgba(200, 45, 120, 0.16)")
	grad.addColorStop(1, "rgba(0, 0, 0, 0)")
	ctx.fillStyle = grad
	ctx.fillRect(0, 0, size, size)

	bloomTexture = new THREE.CanvasTexture(canvas)
	bloomTexture.colorSpace = THREE.SRGBColorSpace
	return bloomTexture
}

let smearTexture = null

export function getSmearTexture() {
	if (smearTexture) return smearTexture

	const w = 128
	const h = 64
	const canvas = document.createElement("canvas")
	canvas.width = w
	canvas.height = h
	const ctx = canvas.getContext("2d")
	const cx = w / 2
	const cy = h / 2
	const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx)
	grad.addColorStop(0, "rgba(255, 255, 255, 1)")
	grad.addColorStop(0.15, "rgba(255, 180, 230, 0.9)")
	grad.addColorStop(0.4, "rgba(255, 80, 180, 0.35)")
	grad.addColorStop(1, "rgba(0, 0, 0, 0)")
	ctx.fillStyle = grad
	ctx.fillRect(0, 0, w, h)

	smearTexture = new THREE.CanvasTexture(canvas)
	smearTexture.colorSpace = THREE.SRGBColorSpace
	return smearTexture
}

export function getSoftMistTexture() {
	const size = 128
	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext("2d")
	const center = size / 2
	const grad = ctx.createRadialGradient(center, center, 0, center, center, center)
	grad.addColorStop(0, "rgba(180, 140, 255, 0.35)")
	grad.addColorStop(0.35, "rgba(100, 80, 180, 0.12)")
	grad.addColorStop(1, "rgba(0, 0, 0, 0)")
	ctx.fillStyle = grad
	ctx.fillRect(0, 0, size, size)
	const tex = new THREE.CanvasTexture(canvas)
	tex.colorSpace = THREE.SRGBColorSpace
	return tex
}

export const PLASMA_NOISE = `
	vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
	vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

	float snoise(vec3 v) {
		const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
		const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
		vec3 i = floor(v + dot(v, C.yyy));
		vec3 x0 = v - i + dot(i, C.xxx);
		vec3 g = step(x0.yzx, x0.xyz);
		vec3 l = 1.0 - g;
		vec3 i1 = min(g.xyz, l.zxy);
		vec3 i2 = max(g.xyz, l.zxy);
		vec3 x1 = x0 - i1 + C.xxx;
		vec3 x2 = x0 - i2 + C.yyy;
		vec3 x3 = x0 - D.yyy;
		i = mod289(i);
		vec4 p = permute(permute(permute(
			i.z + vec4(0.0, i1.z, i2.z, 1.0))
			+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
			+ i.x + vec4(0.0, i1.x, i2.x, 1.0));
		float n_ = 0.142857142857;
		vec3 ns = n_ * D.wyz - D.xzx;
		vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
		vec4 x_ = floor(j * ns.z);
		vec4 y_ = floor(j - 7.0 * x_);
		vec4 x = x_ * ns.x + ns.yyyy;
		vec4 y = y_ * ns.x + ns.yyyy;
		vec4 h = 1.0 - abs(x) - abs(y);
		vec4 b0 = vec4(x.xy, y.xy);
		vec4 b1 = vec4(x.zw, y.zw);
		vec4 s0 = floor(b0) * 2.0 + 1.0;
		vec4 s1 = floor(b1) * 2.0 + 1.0;
		vec4 sh = -step(h, vec4(0.0));
		vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
		vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
		vec3 p0 = vec3(a0.xy, h.x);
		vec3 p1 = vec3(a0.zw, h.y);
		vec3 p2 = vec3(a1.xy, h.z);
		vec3 p3 = vec3(a1.zw, h.w);
		vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
		p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
		vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
		m = m * m;
		return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
	}

	float fbm(vec3 p) {
		float value = 0.0;
		float amp = 0.5;
		for (int i = 0; i < 5; i++) {
			value += amp * snoise(p);
			p *= 2.1;
			amp *= 0.48;
		}
		return value;
	}
`
