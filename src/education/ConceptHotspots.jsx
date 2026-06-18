import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "./ConceptContext.jsx"
import ConceptTarget from "./ConceptTarget.jsx"
import { SCENE_HOTSPOTS } from "./sceneHotspots.js"
import { getSharedTendrils, sampleTendrilPoint } from "../plasma/globeUtils.js"

function ConceptHotspot({
	id,
	position,
	pickRadius,
	color,
	surfaceAligned,
	trackTendril,
	onRootRef,
	haloRef,
	ringRef,
}) {
	const orientRef = useRef()
	const { selectedId, hoveredId } = useConcept()

	const anchor = trackTendril != null ? null : position
	const isHovered = hoveredId === id
	const isSelected = selectedId === id
	const emphasis = isHovered || isSelected

	const normal = useMemo(() => {
		if (!surfaceAligned || !anchor) return null
		const v = new THREE.Vector3(...anchor)
		return v.lengthSq() > 1e-6 ? v.normalize() : null
	}, [anchor, surfaceAligned])

	useLayoutEffect(() => {
		if (!orientRef.current || !normal || !anchor) return
		orientRef.current.lookAt(anchor[0] + normal.x, anchor[1] + normal.y, anchor[2] + normal.z)
	}, [anchor, normal])

	const coreOpacity = isSelected ? 0.05 : emphasis ? 0.95 : selectedId ? 0.35 : 0.62

	return (
		<group ref={onRootRef} position={anchor ?? undefined}>
			<group ref={surfaceAligned ? orientRef : undefined}>
				<mesh ref={haloRef} renderOrder={24} raycast={() => null}>
					<sphereGeometry args={[0.016, 8, 8]} />
					<meshBasicMaterial
						color={color}
						transparent
						opacity={0.26}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
						depthTest={false}
						toneMapped={false}
					/>
				</mesh>
				<mesh ref={ringRef} renderOrder={25} raycast={() => null}>
					<ringGeometry args={[0.011, 0.015, 16]} />
					<meshBasicMaterial
						color={color}
						transparent
						opacity={0.44}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
						depthTest={false}
						toneMapped={false}
					/>
				</mesh>
				<mesh renderOrder={26} raycast={() => null}>
					<sphereGeometry args={[0.0055, 8, 8]} />
					<meshBasicMaterial
						color="#ffffff"
						transparent
						opacity={coreOpacity}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
						depthTest={false}
						toneMapped={false}
					/>
				</mesh>
			</group>

			<ConceptTarget conceptId={id}>
				<mesh renderOrder={22}>
					<sphereGeometry args={[pickRadius, 8, 8]} />
					<meshBasicMaterial transparent opacity={0} depthWrite={false} />
				</mesh>
			</ConceptTarget>
		</group>
	)
}

export default function ConceptHotspots() {
	const refs = useRef(
		SCENE_HOTSPOTS.map(() => ({
			root: null,
			halo: null,
			ring: null,
		})),
	)
	const { selectedId, hoveredId } = useConcept()
	const tendrils = useMemo(() => getSharedTendrils(), [])

	useFrame(({ clock }) => {
		const t = clock.elapsedTime
		SCENE_HOTSPOTS.forEach((hotspot, i) => {
			const r = refs.current[i]
			if (!r.root) return

			if (hotspot.trackTendril != null) {
				const tn = tendrils[hotspot.trackTendril]
				if (tn) {
					const pt = sampleTendrilPoint(tn, hotspot.trackT ?? 0.55, t * 0.5)
					r.root.position.set(pt.x, pt.y, pt.z)
				}
			}

			const isSelected = selectedId === hotspot.id
			const isHovered = hoveredId === hotspot.id
			const emphasis = isHovered || isSelected
			const dimOthers = selectedId && !isSelected
			const breathe = emphasis ? 0.82 + 0.18 * Math.sin(t * 2.4 + hotspot.phase) : 1

			if (r.halo) {
				const base = isSelected ? 0.08 : emphasis ? 0.42 : dimOthers ? 0.1 : 0.26
				r.halo.material.opacity = base * breathe
			}
			if (r.ring) {
				const base = isSelected ? 0.06 : emphasis ? 0.72 : dimOthers ? 0.16 : 0.44
				r.ring.material.opacity = base * breathe
			}
		})
	})

	return (
		<group>
			{SCENE_HOTSPOTS.map((hotspot, i) => (
				<ConceptHotspot
					key={hotspot.id}
					{...hotspot}
					onRootRef={(el) => {
						refs.current[i].root = el
					}}
					haloRef={(el) => {
						refs.current[i].halo = el
					}}
					ringRef={(el) => {
						refs.current[i].ring = el
					}}
				/>
			))}
		</group>
	)
}
