import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "../education/ConceptContext.jsx"
import { IONISATION_ANCHOR } from "../education/sceneHotspots.js"
import { getSoftMistTexture } from "./textures.js"
import { GLOBE_RADIUS } from "./globeUtils.js"

function hash01(i, salt = 0) {
	const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
	return x - Math.floor(x)
}

function buildWispShell(count, radiusMin, radiusMax) {
	const data = new Float32Array(count * 3)
	for (let i = 0; i < count; i += 1) {
		const u = hash01(i, 1) * Math.PI * 2
		const v = Math.acos(2 * hash01(i, 2) - 1)
		const r = GLOBE_RADIUS * (radiusMin + hash01(i, 3) * (radiusMax - radiusMin))
		data[i * 3] = Math.sin(v) * Math.cos(u) * r
		data[i * 3 + 1] = Math.sin(v) * Math.sin(u) * r
		data[i * 3 + 2] = Math.cos(v) * r
	}
	return data
}

function buildCluster(count, anchor, spread) {
	const ax = anchor[0]
	const ay = anchor[1]
	const az = anchor[2]
	const len = Math.hypot(ax, ay, az) || 1
	const nx = ax / len
	const ny = ay / len
	const nz = az / len
	const ref = Math.abs(ny) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
	const tangent = new THREE.Vector3(nx, ny, nz).cross(ref).normalize()
	const bitangent = new THREE.Vector3(nx, ny, nz).cross(tangent).normalize()
	const data = new Float32Array(count * 3)
	for (let i = 0; i < count; i += 1) {
		const ang = hash01(i, 4) * Math.PI * 2
		const rad = spread * Math.sqrt(hash01(i, 5))
		const ox = tangent.x * Math.cos(ang) * rad + bitangent.x * Math.sin(ang) * rad
		const oy = tangent.y * Math.cos(ang) * rad + bitangent.y * Math.sin(ang) * rad
		const oz = tangent.z * Math.cos(ang) * rad + bitangent.z * Math.sin(ang) * rad
		const r = GLOBE_RADIUS * 0.902
		data[i * 3] = nx * r + ox
		data[i * 3 + 1] = ny * r + oy
		data[i * 3 + 2] = nz * r + oz
	}
	return data
}

export default function SurfaceWisps() {
	const shellMatRef = useRef()
	const clusterMatRef = useRef()
	const patchMatRef = useRef()
	const haloMatRef = useRef()
	const orientRef = useRef()
	const focusAmount = useRef(0)
	const { selectedId } = useConcept()
	const texture = useMemo(() => getSoftMistTexture(), [])

	const shellPos = useMemo(() => buildWispShell(48, 0.895, 0.935), [])
	const clusterPos = useMemo(() => buildCluster(24, IONISATION_ANCHOR, 0.16), [])

	const normal = useMemo(() => {
		const v = new THREE.Vector3(...IONISATION_ANCHOR)
		return v.normalize()
	}, [])

	useLayoutEffect(() => {
		if (!orientRef.current) return
		orientRef.current.lookAt(
			IONISATION_ANCHOR[0] + normal.x,
			IONISATION_ANCHOR[1] + normal.y,
			IONISATION_ANCHOR[2] + normal.z,
		)
	}, [normal])

	useFrame(({ clock }, delta) => {
		const want = selectedId === "ionisation" ? 1 : 0
		focusAmount.current += (want - focusAmount.current) * (1 - Math.exp(-6 * delta))
		const f = focusAmount.current
		const pulse = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 2.8)

		if (shellMatRef.current) {
			const base = selectedId && selectedId !== "ionisation" ? 0.04 : 0.18
			shellMatRef.current.opacity = base + f * 0.42 * pulse
			shellMatRef.current.size = 0.11 + f * 0.08
		}
		if (clusterMatRef.current) {
			clusterMatRef.current.opacity = f * 0.9 * pulse
			clusterMatRef.current.size = 0.15 + f * 0.12
		}
		if (patchMatRef.current) {
			patchMatRef.current.opacity = f * 0.72 * pulse
		}
		if (haloMatRef.current) {
			haloMatRef.current.opacity = f * 0.5 * pulse
		}
	})

	return (
		<group>
			<points renderOrder={1}>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[shellPos, 3]} />
				</bufferGeometry>
				<pointsMaterial
					ref={shellMatRef}
					map={texture}
					alphaMap={texture}
					size={0.11}
					color="#d848a8"
					transparent
					opacity={0.2}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					sizeAttenuation
				/>
			</points>

			<points renderOrder={2}>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[clusterPos, 3]} />
				</bufferGeometry>
				<pointsMaterial
					ref={clusterMatRef}
					map={texture}
					alphaMap={texture}
					size={0.14}
					color="#ff68cc"
					transparent
					opacity={0}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					sizeAttenuation
				/>
			</points>

			<group position={IONISATION_ANCHOR}>
				<group ref={orientRef}>
					<mesh renderOrder={2} raycast={() => null}>
						<circleGeometry args={[0.13, 24]} />
						<meshBasicMaterial
							ref={patchMatRef}
							color="#ff50b8"
							transparent
							opacity={0}
							blending={THREE.AdditiveBlending}
							depthWrite={false}
							side={THREE.DoubleSide}
							toneMapped={false}
						/>
					</mesh>
					<mesh renderOrder={2} raycast={() => null}>
						<ringGeometry args={[0.1, 0.16, 24]} />
						<meshBasicMaterial
							ref={haloMatRef}
							color="#c878ff"
							transparent
							opacity={0}
							blending={THREE.AdditiveBlending}
							depthWrite={false}
							side={THREE.DoubleSide}
							toneMapped={false}
						/>
					</mesh>
				</group>
			</group>
		</group>
	)
}
