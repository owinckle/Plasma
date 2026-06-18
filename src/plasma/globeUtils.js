import * as THREE from "three"

export const GLOBE_RADIUS = 1

export function randomOnSphere() {
	const u = Math.random()
	const v = Math.random()
	const theta = Math.PI * 2 * u
	const phi = Math.acos(2 * v - 1)
	return {
		x: Math.sin(phi) * Math.cos(theta),
		y: Math.sin(phi) * Math.sin(theta),
		z: Math.cos(phi),
	}
}

function normalize(v) {
	const l = Math.hypot(v.x, v.y, v.z) || 1
	return { x: v.x / l, y: v.y / l, z: v.z / l }
}

function scale(v, s) {
	return { x: v.x * s, y: v.y * s, z: v.z * s }
}

function add(a, b) {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function sub(a, b) {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function cross(a, b) {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	}
}

function radialEndpoint(index, count) {
	// Even distribution over the full sphere (Fibonacci sphere) so filaments
	// reach the glass in every direction instead of clustering randomly.
	const offset = 2 / count
	const increment = Math.PI * (3 - Math.sqrt(5))
	const y = index * offset - 1 + offset / 2
	const r = Math.sqrt(Math.max(0, 1 - y * y))
	const phi = index * increment
	// Bias endpoints upward: real plasma balls fire mostly up/out, away from the
	// support stem that occupies the bottom of the sphere.
	return normalize({
		x: Math.cos(phi) * r,
		y: y * 0.82 + 0.13,
		z: Math.sin(phi) * r,
	})
}

export function wobble(base, axis, t, speed, phase, amount) {
	return base + axis * (Math.sin(t * speed + phase) * amount + Math.sin(t * speed * 1.6 + phase * 1.9) * amount * 0.42)
}

export function bezierPoint(p0, p1, p2, p3, t, out) {
	const it = 1 - t
	const it2 = it * it
	const t2 = t * t
	const b0 = it2 * it
	const b1 = 3 * it2 * t
	const b2 = 3 * it * t2
	const b3 = t2 * t

	out.x = p0.x * b0 + p1.x * b1 + p2.x * b2 + p3.x * b3
	out.y = p0.y * b0 + p1.y * b1 + p2.y * b2 + p3.y * b3
	out.z = p0.z * b0 + p1.z * b1 + p2.z * b2 + p3.z * b3
	return out
}

export const HIGHLIGHT_TENDRIL_INDEX = 17
export const TENDRIL_COUNT = 30

let sharedTendrils = null

export function getSharedTendrils(count = TENDRIL_COUNT) {
	if (!sharedTendrils || sharedTendrils.length !== count) {
		sharedTendrils = createTendrils(count)
	}
	return sharedTendrils
}

/** Point sur la courbe centrale d'un filament (même géométrie que FilamentField). */
export function sampleTendrilPoint(tn, curveT, animT) {
	const flareWave = Math.max(0, Math.sin(animT * 2.4 + tn.phase))
	const flare = 1 + tn.flare * flareWave ** 12 * 0.8
	const p0 = { x: 0, y: 0, z: 0 }
	const ca = {
		x: wobble(tn.c1Base.x, tn.axis1.x, animT, tn.speed, tn.phase, flare),
		y: wobble(tn.c1Base.y, tn.axis1.y, animT, tn.speed, tn.phase, flare),
		z: wobble(tn.c1Base.z, tn.axis1.z, animT, tn.speed, tn.phase, flare),
	}
	const cb = {
		x: wobble(tn.c2Base.x, tn.axis2.x, animT, tn.speed, tn.phase + 0.9, flare),
		y: wobble(tn.c2Base.y, tn.axis2.y, animT, tn.speed, tn.phase + 0.9, flare),
		z: wobble(tn.c2Base.z, tn.axis2.z, animT, tn.speed, tn.phase + 0.9, flare),
	}
	const cc = {
		x: wobble(tn.end.x, tn.endAxis1.x, animT, tn.speed * 0.95, tn.phase + 5.1, 1),
		y: wobble(tn.end.y, tn.endAxis1.y, animT, tn.speed * 0.95, tn.phase + 5.1, 1),
		z: wobble(tn.end.z, tn.endAxis1.z, animT, tn.speed * 0.95, tn.phase + 5.1, 1),
	}
	cc.x += wobble(0, tn.endAxis2.x, animT, tn.speed * 0.78, tn.phase + 8.3, 1)
	cc.y += wobble(0, tn.endAxis2.y, animT, tn.speed * 0.78, tn.phase + 8.3, 1)
	cc.z += wobble(0, tn.endAxis2.z, animT, tn.speed * 0.78, tn.phase + 8.3, 1)
	const endLen = Math.hypot(cc.x, cc.y, cc.z) || 1
	const endScale = (GLOBE_RADIUS * 0.985) / endLen
	cc.x *= endScale
	cc.y *= endScale
	cc.z *= endScale
	const out = { x: 0, y: 0, z: 0 }
	bezierPoint(p0, ca, cb, cc, curveT, out)
	return out
}

export function getTendrilRestPoint(index, count = TENDRIL_COUNT, curveT = 0.55) {
	return sampleTendrilPoint(getSharedTendrils(count)[index], curveT, 0)
}

function hash01(index, salt = 0) {
	const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
	return x - Math.floor(x)
}

export function createTendrils(count = 36, radius = GLOBE_RADIUS) {
	const tendrils = []
	for (let i = 0; i < count; i += 1) {
		const endDir = radialEndpoint(i, count)
		const end = scale(endDir, radius * (0.978 + hash01(i, 1) * 0.018))

		// Two stable tangents perpendicular to the radial direction. The path
		// stays essentially radial (electrode -> glass) and only bows gently to
		// one side, like a real plasma filament finding a path of least resistance.
		const ref = Math.abs(endDir.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 }
		const tangent = normalize(cross(endDir, ref))
		const tangent2 = normalize(cross(endDir, tangent))

		// Single consistent bow direction (same sign on both control points) so
		// filaments arc smoothly outward rather than zig-zag in random directions.
		const bowDir = add(scale(tangent, Math.cos(i * 1.7)), scale(tangent2, Math.sin(i * 1.7)))
		const bow = 0.1 + hash01(i, 2) * 0.14

		const c1 = add(scale(endDir, radius * (0.3 + hash01(i, 3) * 0.05)), scale(bowDir, bow * 0.7))
		const c2 = add(scale(endDir, radius * (0.72 + hash01(i, 4) * 0.05)), scale(bowDir, bow))

		const branch = i % 3 === 0
			? {
				startT: 0.62 + hash01(i, 5) * 0.16,
				end: add(scale(end, 0.92 + hash01(i, 6) * 0.04), scale(bowDir, 0.07 + hash01(i, 7) * 0.05)),
				c1Offset: scale(bowDir, 0.04 + hash01(i, 8) * 0.05),
				c2Offset: scale(tangent2, (hash01(i, 9) - 0.5) * 0.06),
				speed: 0.55 + hash01(i, 10) * 0.3,
				phase: i * 2.2 + 9,
			}
			: null

		tendrils.push({
			end,
			endAxis1: scale(tangent, 0.1 + hash01(i, 11) * 0.1),
			endAxis2: scale(tangent2, 0.1 + hash01(i, 12) * 0.1),
			c1Base: c1,
			c2Base: c2,
			axis1: scale(tangent, 0.08 + hash01(i, 13) * 0.08),
			axis2: scale(tangent2, 0.085 + hash01(i, 14) * 0.09),
			speed: 0.9 + hash01(i, 15) * 1.1,
			phase: i * 1.73,
			sizeJitter: 0.78 + hash01(i, 16) * 0.5,
			warm: i % 7 === 0,
			flare: i % 9 === 0 ? 1.0 : 0.0,
			// A subset of filaments slowly fade in and out (plasma "spawning").
			spawns: i % 5 < 2,
			spawnSpeed: 0.08 + hash01(i, 17) * 0.09,
			spawnPhase: hash01(i, 18),
			branch,
		})
	}
	return tendrils
}

export function toThree(v) {
	return new THREE.Vector3(v.x, v.y, v.z)
}
