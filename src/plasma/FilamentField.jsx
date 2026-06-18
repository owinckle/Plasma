import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "../education/ConceptContext.jsx"
import { TENDRIL_FOCUS } from "../education/conceptFocus.js"
import { bezierPoint, getSharedTendrils, GLOBE_RADIUS, HIGHLIGHT_TENDRIL_INDEX, TENDRIL_COUNT, wobble } from "./globeUtils.js"
import { getSparkTexture } from "./textures.js"

const TUBE_MAIN_L = 20
const TUBE_BRANCH_L = 10
const RADIAL = 6
const KNOTS = 1
const MAX_L = TUBE_MAIN_L

const tubeVertex = `
	attribute float aT;
	attribute float aWarm;
	attribute float aLife;
	attribute float aTendril;
	uniform float uExpand;
	uniform float uFocusActive;
	uniform float uHighlightTendril;
	uniform float uCamDist;
	varying float vT;
	varying float vWarm;
	varying float vLife;
	varying float vDepth;
	varying float vNdotV;
	varying float vTendril;
	void main() {
		float highlighted = 1.0 - step(0.5, abs(aTendril - uHighlightTendril));
		float expandBoost = uFocusActive * highlighted * 0.005;
		vec3 pos = position + normal * (uExpand + expandBoost);
		vec4 mv = modelViewMatrix * vec4(pos, 1.0);
		float dist = -mv.z;
		vDepth = clamp((dist - (uCamDist - 1.0)) / 2.0, 0.0, 1.0);
		vec3 n = normalize(normalMatrix * normal);
		vec3 vd = normalize(-mv.xyz);
		vNdotV = dot(n, vd);
		vT = aT;
		vWarm = aWarm;
		vLife = aLife;
		vTendril = aTendril;
		gl_Position = projectionMatrix * mv;
	}
`

const tubeFragment = `
	uniform float uAlpha;
	uniform float uCore;
	uniform float uFocusActive;
	uniform float uSceneDim;
	uniform float uHighlightTendril;
	uniform float uDimScale;
	uniform float uBoostScale;
	varying float vT;
	varying float vWarm;
	varying float vLife;
	varying float vDepth;
	varying float vNdotV;
	varying float vTendril;
	void main() {
		if (vNdotV <= 0.0) discard;

		vec3 hot     = vec3(0.85, 0.95, 1.00);
		vec3 blue    = vec3(0.28, 0.55, 1.00);
		vec3 violet  = vec3(0.55, 0.32, 1.00);
		vec3 magenta = vec3(1.00, 0.24, 0.72);
		vec3 col = mix(hot, blue, smoothstep(0.0, 0.26, vT));
		col = mix(col, violet, smoothstep(0.26, 0.7, vT));
		col = mix(col, magenta, smoothstep(0.72, 1.0, vT));
		col = mix(col, mix(col, vec3(1.0, 0.5, 0.22), 0.6), vWarm * 0.4);
		col = mix(col, col * vec3(0.5, 0.46, 0.78), vDepth * 0.6);
		float bright = mix(1.0, 0.4, vDepth);
		col = mix(col, vec3(1.0), uCore * pow(max(vNdotV, 0.0), 2.0) * 0.16);
		float a = uAlpha * vLife * bright;
		if (uCore > 0.5) {
			a *= 0.9 + 0.1 * pow(max(vNdotV, 0.0), 0.2);
		} else {
			a *= 0.3 + 0.7 * pow(max(vNdotV, 0.0), 0.55);
		}
		if (uSceneDim > 0.001) {
			a *= 0.18;
			bright *= 0.42;
			col *= 0.5;
		}
		if (uFocusActive > 0.001) {
			float highlighted = 1.0 - step(0.5, abs(vTendril - uHighlightTendril));
			float focusScale = mix(uDimScale, uBoostScale, highlighted);
			a *= focusScale;
			bright = mix(bright * 0.35, bright * 1.65, highlighted);
			col = mix(col * 0.55, mix(col, vec3(1.0, 0.95, 1.0), 0.45) * 1.35, highlighted);
		}
		if (a < 0.002) discard;
		gl_FragColor = vec4(col * bright, a);
	}
`

const spriteVertex = `
	attribute float aWarm;
	attribute float aSize;
	attribute float aLife;
	attribute float aTendril;
	uniform float uPixelRatio;
	uniform float uSize;
	uniform float uMaxSize;
	uniform float uCamDist;
	varying float vWarm;
	varying float vDepth;
	varying float vLife;
	varying float vTendril;
	void main() {
		vec4 mv = modelViewMatrix * vec4(position, 1.0);
		float dist = -mv.z;
		vDepth = clamp((dist - (uCamDist - 1.0)) / 2.0, 0.0, 1.0);
		float depthScale = mix(1.1, 0.6, vDepth);
		float lifeSize = 0.35 + 0.65 * aLife;
		float ps = uSize * aSize * depthScale * lifeSize * uPixelRatio / max(dist, 0.001);
		gl_PointSize = min(ps, uMaxSize * uPixelRatio);
		vWarm = aWarm;
		vLife = aLife;
		vTendril = aTendril;
		gl_Position = projectionMatrix * mv;
	}
`

const spriteFragment = `
	uniform sampler2D uTex;
	uniform float uAlpha;
	uniform float uFocusActive;
	uniform float uSceneDim;
	uniform float uHighlightTendril;
	uniform float uDimScale;
	uniform float uBoostScale;
	varying float vWarm;
	varying float vDepth;
	varying float vLife;
	varying float vTendril;
	void main() {
		vec4 tex = texture2D(uTex, gl_PointCoord);
		if (tex.a < 0.01) discard;
		vec3 col = mix(vec3(1.0, 0.24, 0.72), vec3(1.0, 0.55, 0.85), 0.35 + vWarm * 0.1);
		col = mix(col, col * vec3(0.55, 0.5, 0.78), vDepth * 0.5);
		float bright = mix(1.0, 0.45, vDepth);
		float a = tex.a * uAlpha * vLife;
		if (uSceneDim > 0.001) {
			a *= 0.18;
			bright *= 0.42;
			col *= 0.5;
		}
		if (uFocusActive > 0.001) {
			float highlighted = 1.0 - step(0.5, abs(vTendril - uHighlightTendril));
			float focusScale = mix(uDimScale, uBoostScale, highlighted);
			a *= focusScale;
			bright = mix(bright * 0.32, bright * 1.7, highlighted);
			col = mix(col * 0.5, col * 1.45, highlighted);
		}
		gl_FragColor = vec4(col * bright, a);
	}
`

function smooth(e0, e1, x) {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
	return t * t * (3 - 2 * t)
}

export default function FilamentField() {
	const groupRef = useRef()
	const gl = useThree((s) => s.gl)
	const camera = useThree((s) => s.camera)
	const { selectedId } = useConcept()
	const focusAmount = useRef(0)
	const sceneDimAmount = useRef(0)
	const tendrils = useMemo(() => getSharedTendrils(TENDRIL_COUNT), [])
	const sparkTexture = useMemo(() => getSparkTexture(), [])

	const focusUniforms = useMemo(
		() => ({
			uFocusActive: { value: 0 },
			uSceneDim: { value: 0 },
			uHighlightTendril: { value: HIGHLIGHT_TENDRIL_INDEX },
			uDimScale: { value: 0.12 },
			uBoostScale: { value: 2.1 },
		}),
		[],
	)

	const tubeCore = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {
					uExpand: { value: 0.0 },
					uAlpha: { value: 1.0 },
					uCore: { value: 1.0 },
					uCamDist: { value: 2.5 },
					...focusUniforms,
				},
				vertexShader: tubeVertex,
				fragmentShader: tubeFragment,
				transparent: true,
				depthWrite: false,
				side: THREE.FrontSide,
				blending: THREE.AdditiveBlending,
			}),
		[focusUniforms],
	)
	const tubeHalo = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {
					uExpand: { value: 0.012 },
					uAlpha: { value: 0.22 },
					uCore: { value: 0.0 },
					uCamDist: { value: 2.5 },
					...focusUniforms,
				},
				vertexShader: tubeVertex,
				fragmentShader: tubeFragment,
				transparent: true,
				depthWrite: false,
				side: THREE.FrontSide,
				blending: THREE.AdditiveBlending,
			}),
		[focusUniforms],
	)
	const spriteCore = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {
					uTex: { value: sparkTexture },
					uPixelRatio: { value: 1.5 },
					uSize: { value: 20 },
					uMaxSize: { value: 40 },
					uCamDist: { value: 2.5 },
					uAlpha: { value: 0.95 },
					...focusUniforms,
				},
				vertexShader: spriteVertex,
				fragmentShader: spriteFragment,
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
			}),
		[sparkTexture, focusUniforms],
	)

	const tubeInfo = useMemo(() => {
		let v = 0
		let idx = 0
		for (let i = 0; i < tendrils.length; i += 1) {
			v += TUBE_MAIN_L * RADIAL
			idx += (TUBE_MAIN_L - 1) * RADIAL * 6
			if (tendrils[i].branch) {
				v += TUBE_BRANCH_L * RADIAL
				idx += (TUBE_BRANCH_L - 1) * RADIAL * 6
			}
		}
		const aT = new Float32Array(v)
		const aWarm = new Float32Array(v)
		const aTendril = new Float32Array(v)
		const index = new Uint32Array(idx)
		let vc = 0
		let ic = 0
		const addTube = (L, aT0, aT1, warm, tendrilIdx) => {
			const baseV = vc
			for (let s = 0; s < L; s += 1) {
				const tt = aT0 + (aT1 - aT0) * (s / (L - 1))
				for (let j = 0; j < RADIAL; j += 1) {
					aT[vc] = tt
					aWarm[vc] = warm
					aTendril[vc] = tendrilIdx
					vc += 1
				}
			}
			for (let s = 0; s < L - 1; s += 1) {
				for (let j = 0; j < RADIAL; j += 1) {
					const a = baseV + s * RADIAL + j
					const b = baseV + s * RADIAL + ((j + 1) % RADIAL)
					const c = baseV + (s + 1) * RADIAL + j
					const d = baseV + (s + 1) * RADIAL + ((j + 1) % RADIAL)
					index[ic++] = a
					index[ic++] = b
					index[ic++] = d
					index[ic++] = a
					index[ic++] = d
					index[ic++] = c
				}
			}
		}
		for (let i = 0; i < tendrils.length; i += 1) {
			const warm = tendrils[i].warm ? 1 : 0
			addTube(TUBE_MAIN_L, 0, 1, warm, i)
			if (tendrils[i].branch) addTube(TUBE_BRANCH_L, 0.55, 1, warm, i)
		}
		return { aT, aWarm, aTendril, index, vertexCount: v }
	}, [tendrils])

	const tubePos = useMemo(() => new Float32Array(tubeInfo.vertexCount * 3), [tubeInfo])
	const tubeNorm = useMemo(() => new Float32Array(tubeInfo.vertexCount * 3), [tubeInfo])
	const tubeLife = useMemo(() => new Float32Array(tubeInfo.vertexCount), [tubeInfo])

	const tubeGeo = useMemo(() => new THREE.BufferGeometry(), [])
	useMemo(() => {
		tubeGeo.setAttribute("position", new THREE.BufferAttribute(tubePos, 3))
		tubeGeo.setAttribute("normal", new THREE.BufferAttribute(tubeNorm, 3))
		tubeGeo.setAttribute("aT", new THREE.BufferAttribute(tubeInfo.aT, 1))
		tubeGeo.setAttribute("aWarm", new THREE.BufferAttribute(tubeInfo.aWarm, 1))
		tubeGeo.setAttribute("aTendril", new THREE.BufferAttribute(tubeInfo.aTendril, 1))
		tubeGeo.setAttribute("aLife", new THREE.BufferAttribute(tubeLife, 1))
		tubeGeo.setIndex(new THREE.BufferAttribute(tubeInfo.index, 1))
	}, [tubeGeo, tubeInfo, tubePos, tubeNorm, tubeLife])

	const knotCount = useMemo(() => tendrils.length * KNOTS, [tendrils])
	const knotPos = useMemo(() => new Float32Array(knotCount * 3), [knotCount])
	const knotLife = useMemo(() => new Float32Array(knotCount), [knotCount])
	const knotWarm = useMemo(() => new Float32Array(knotCount), [knotCount])
	const knotTendril = useMemo(() => new Float32Array(knotCount), [knotCount])
	const knotGeo = useMemo(() => new THREE.BufferGeometry(), [])

	useMemo(() => {
		knotGeo.setAttribute("position", new THREE.BufferAttribute(knotPos, 3))
		knotGeo.setAttribute("aWarm", new THREE.BufferAttribute(knotWarm, 1))
		knotGeo.setAttribute("aTendril", new THREE.BufferAttribute(knotTendril, 1))
		knotGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(knotCount).fill(0.7), 1))
		knotGeo.setAttribute("aLife", new THREE.BufferAttribute(knotLife, 1))
	}, [knotGeo, knotPos, knotLife, knotWarm, knotTendril, knotCount])

	const scratch = useRef({
		cx: new Float64Array(MAX_L),
		cy: new Float64Array(MAX_L),
		cz: new Float64Array(MAX_L),
		tx: new Float64Array(MAX_L),
		ty: new Float64Array(MAX_L),
		tz: new Float64Array(MAX_L),
		p0: { x: 0, y: 0, z: 0 },
		ca: { x: 0, y: 0, z: 0 },
		cb: { x: 0, y: 0, z: 0 },
		cc: { x: 0, y: 0, z: 0 },
		td: { x: 0, y: 0, z: 0 },
		pa: { x: 0, y: 0, z: 0 },
		bStart: { x: 0, y: 0, z: 0 },
		bC1: { x: 0, y: 0, z: 0 },
		bC2: { x: 0, y: 0, z: 0 },
	})

	useMemo(() => {
		for (let i = 0; i < tendrils.length; i += 1) {
			knotWarm[i] = tendrils[i].warm ? 1 : 0
			knotTendril[i] = i
		}
	}, [tendrils, knotWarm, knotTendril])

	useEffect(() => {
		spriteCore.uniforms.uPixelRatio.value = gl.getPixelRatio()
	}, [gl, spriteCore])

	useFrame((_, delta) => {
		const t = performance.now() * 0.0005
		const camDist = camera.position.length()
		const tendrilFocus = TENDRIL_FOCUS[selectedId]
		const wantFocus = tendrilFocus ? 1 : 0
		const wantSceneDim = selectedId && !tendrilFocus ? 1 : 0
		focusAmount.current += (wantFocus - focusAmount.current) * (1 - Math.exp(-6 * delta))
		sceneDimAmount.current += (wantSceneDim - sceneDimAmount.current) * (1 - Math.exp(-6 * delta))
		const focusMats = [tubeCore, tubeHalo, spriteCore]
		focusMats.forEach((m) => {
			m.uniforms.uCamDist.value = camDist
			m.uniforms.uFocusActive.value = focusAmount.current
			m.uniforms.uSceneDim.value = sceneDimAmount.current
			m.uniforms.uHighlightTendril.value = tendrilFocus?.index ?? HIGHLIGHT_TENDRIL_INDEX
		})

		let vc = 0
		let kCur = 0
		const s = scratch.current
		const { cx, cy, cz, tx, ty, tz, p0, ca, cb, cc, td, pa, bStart, bC1, bC2 } = s

		const writeTube = (q0, q1, q2, q3, L, aT0, aT1, jitter, life) => {
			for (let seg = 0; seg < L; seg += 1) {
				bezierPoint(q0, q1, q2, q3, seg / (L - 1), pa)
				cx[seg] = pa.x
				cy[seg] = pa.y
				cz[seg] = pa.z
			}
			for (let seg = 0; seg < L; seg += 1) {
				let ax
				let ay
				let az
				if (seg < L - 1) {
					ax = cx[seg + 1] - cx[seg]
					ay = cy[seg + 1] - cy[seg]
					az = cz[seg + 1] - cz[seg]
				} else {
					ax = cx[seg] - cx[seg - 1]
					ay = cy[seg] - cy[seg - 1]
					az = cz[seg] - cz[seg - 1]
				}
				const len = Math.hypot(ax, ay, az) || 1
				tx[seg] = ax / len
				ty[seg] = ay / len
				tz[seg] = az / len
			}

			let upx = 0
			let upy = 1
			let upz = 0
			if (Math.abs(tx[0] * upx + ty[0] * upy + tz[0] * upz) > 0.9) {
				upx = 1
				upy = 0
				upz = 0
			}
			let dot = tx[0] * upx + ty[0] * upy + tz[0] * upz
			let nx = upx - tx[0] * dot
			let ny = upy - ty[0] * dot
			let nz = upz - tz[0] * dot
			let nl = Math.hypot(nx, ny, nz) || 1
			nx /= nl
			ny /= nl
			nz /= nl

			const lifeR = 0.3 + 0.7 * life
			for (let seg = 0; seg < L; seg += 1) {
				if (seg > 0) {
					dot = nx * tx[seg] + ny * ty[seg] + nz * tz[seg]
					nx -= tx[seg] * dot
					ny -= ty[seg] * dot
					nz -= tz[seg] * dot
					nl = Math.hypot(nx, ny, nz) || 1
					nx /= nl
					ny /= nl
					nz /= nl
				}

				const bx = ty[seg] * nz - tz[seg] * ny
				const by = tz[seg] * nx - tx[seg] * nz
				const bz = tx[seg] * ny - ty[seg] * nx
				const aT = aT0 + (aT1 - aT0) * (seg / (L - 1))
				const radius = (0.003 + 0.012 * Math.pow(1 - aT, 1.4)) * jitter * lifeR

				for (let j = 0; j < RADIAL; j += 1) {
					const ang = (j / RADIAL) * Math.PI * 2
					const c = Math.cos(ang)
					const sn = Math.sin(ang)
					const dx = c * nx + sn * bx
					const dy = c * ny + sn * by
					const dz = c * nz + sn * bz
					const o = vc * 3
					tubePos[o] = cx[seg] + dx * radius
					tubePos[o + 1] = cy[seg] + dy * radius
					tubePos[o + 2] = cz[seg] + dz * radius
					tubeNorm[o] = dx
					tubeNorm[o + 1] = dy
					tubeNorm[o + 2] = dz
					tubeLife[vc] = life
					vc += 1
				}
			}
		}

		for (let i = 0; i < tendrils.length; i += 1) {
			const tn = tendrils[i]
			const flareWave = Math.max(0, Math.sin(t * 2.4 + tn.phase))
			const flare = 1 + tn.flare * flareWave ** 12 * 0.8

			const flick = 0.8 + 0.2 * Math.sin(t * 3.1 + tn.phase * 1.7)
			let life
			if (tn.spawns) {
				const cyc = (((t * tn.spawnSpeed + tn.spawnPhase) % 1) + 1) % 1
				life = smooth(0, 0.2, cyc) * (1 - smooth(0.8, 1, cyc)) * flick
			} else {
				life = flick
			}

			ca.x = wobble(tn.c1Base.x, tn.axis1.x, t, tn.speed, tn.phase, flare)
			ca.y = wobble(tn.c1Base.y, tn.axis1.y, t, tn.speed, tn.phase, flare)
			ca.z = wobble(tn.c1Base.z, tn.axis1.z, t, tn.speed, tn.phase, flare)

			cb.x = wobble(tn.c2Base.x, tn.axis2.x, t, tn.speed, tn.phase + 0.9, flare)
			cb.y = wobble(tn.c2Base.y, tn.axis2.y, t, tn.speed, tn.phase + 0.9, flare)
			cb.z = wobble(tn.c2Base.z, tn.axis2.z, t, tn.speed, tn.phase + 0.9, flare)

			cc.x = wobble(tn.end.x, tn.endAxis1.x, t, tn.speed * 0.95, tn.phase + 5.1, 1)
			cc.y = wobble(tn.end.y, tn.endAxis1.y, t, tn.speed * 0.95, tn.phase + 5.1, 1)
			cc.z = wobble(tn.end.z, tn.endAxis1.z, t, tn.speed * 0.95, tn.phase + 5.1, 1)
			cc.x += wobble(0, tn.endAxis2.x, t, tn.speed * 0.78, tn.phase + 8.3, 1)
			cc.y += wobble(0, tn.endAxis2.y, t, tn.speed * 0.78, tn.phase + 8.3, 1)
			cc.z += wobble(0, tn.endAxis2.z, t, tn.speed * 0.78, tn.phase + 8.3, 1)
			const endLen = Math.hypot(cc.x, cc.y, cc.z) || 1
			const endScale = (GLOBE_RADIUS * 0.985) / endLen
			cc.x *= endScale
			cc.y *= endScale
			cc.z *= endScale

			writeTube(p0, ca, cb, cc, TUBE_MAIN_L, 0, 1, tn.sizeJitter, life)

			for (let kk = 0; kk < KNOTS; kk += 1) {
				const travel = (t * (0.12 + tn.speed * 0.04) + tn.phase * 0.07 + kk / KNOTS) % 1
				const shaped = travel * travel * (3 - 2 * travel)
				bezierPoint(p0, ca, cb, cc, shaped, pa)
				const o = kCur * 3
				knotPos[o] = pa.x
				knotPos[o + 1] = pa.y
				knotPos[o + 2] = pa.z
				knotLife[kCur] = life
				kCur += 1
			}

			if (tn.branch) {
				const br = tn.branch
				bezierPoint(p0, ca, cb, cc, br.startT, bStart)
				bC1.x = bStart.x + wobble(br.c1Offset.x, br.c1Offset.x, t, br.speed, br.phase, 0.7)
				bC1.y = bStart.y + wobble(br.c1Offset.y, br.c1Offset.y, t, br.speed, br.phase, 0.7)
				bC1.z = bStart.z + wobble(br.c1Offset.z, br.c1Offset.z, t, br.speed, br.phase, 0.7)
				bC2.x = br.end.x + br.c2Offset.x
				bC2.y = br.end.y + br.c2Offset.y
				bC2.z = br.end.z + br.c2Offset.z
				const bLen = Math.hypot(br.end.x, br.end.y, br.end.z) || 1
				const bScale = (GLOBE_RADIUS * 0.985) / bLen
				td.x = br.end.x * bScale
				td.y = br.end.y * bScale
				td.z = br.end.z * bScale

				writeTube(bStart, bC1, bC2, td, TUBE_BRANCH_L, 0.55, 1, tn.sizeJitter * 0.7, life)
			}
		}

		tubeGeo.attributes.position.needsUpdate = true
		tubeGeo.attributes.normal.needsUpdate = true
		tubeGeo.attributes.aLife.needsUpdate = true
		knotGeo.attributes.position.needsUpdate = true
		knotGeo.attributes.aLife.needsUpdate = true

		if (groupRef.current) groupRef.current.rotation.y = t * 0.02
	})

	return (
		<group ref={groupRef}>
			<mesh renderOrder={0}>
				<primitive object={tubeGeo} attach="geometry" />
				<primitive object={tubeHalo} attach="material" />
			</mesh>
			<mesh renderOrder={1}>
				<primitive object={tubeGeo} attach="geometry" />
				<primitive object={tubeCore} attach="material" />
			</mesh>

			<points renderOrder={4} raycast={() => null}>
				<primitive object={knotGeo} attach="geometry" />
				<primitive object={spriteCore} attach="material" />
			</points>
		</group>
	)
}
