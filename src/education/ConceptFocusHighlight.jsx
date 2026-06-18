import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "./ConceptContext.jsx"
import { getHotspotByConceptId, getHotspotColor } from "./conceptFocus.js"
import { getSharedTendrils, sampleTendrilPoint } from "../plasma/globeUtils.js"

function FocusRing({ color, amountRef, surfaceAligned, position }) {
	const orientRef = useRef()
	const rippleRef = useRef()
	const outerRef = useRef()
	const innerRef = useRef()
	const coreRef = useRef()
	const stemRef = useRef()
	const crossRefs = useRef([])

	const normal = useMemo(() => {
		if (!surfaceAligned) return null
		const v = new THREE.Vector3(...position)
		return v.lengthSq() > 1e-6 ? v.normalize() : null
	}, [position, surfaceAligned])

	useLayoutEffect(() => {
		if (!orientRef.current || !normal) return
		orientRef.current.lookAt(
			position[0] + normal.x,
			position[1] + normal.y,
			position[2] + normal.z,
		)
	}, [position, normal])

	useFrame(({ clock }) => {
		const amount = amountRef.current
		const t = clock.elapsedTime
		const pulse = 0.5 + 0.5 * Math.sin(t * 3.4)
		const rippleT = (t * 0.85) % 1
		const rippleScale = 0.85 + rippleT * 0.9

		if (rippleRef.current) {
			rippleRef.current.scale.setScalar(rippleScale)
			rippleRef.current.material.opacity = (1 - rippleT) * 0.38 * amount
		}
		if (outerRef.current) {
			const s = 1 + pulse * 0.22 * amount
			outerRef.current.scale.setScalar(s)
			outerRef.current.material.opacity = (0.35 + pulse * 0.3) * amount
		}
		if (innerRef.current) {
			innerRef.current.material.opacity = (0.75 + pulse * 0.2) * amount
		}
		if (coreRef.current) {
			coreRef.current.material.opacity = (0.85 + pulse * 0.15) * amount
			coreRef.current.scale.setScalar(1 + pulse * 0.15 * amount)
		}
		if (stemRef.current) {
			stemRef.current.material.opacity = (0.45 + pulse * 0.25) * amount
		}
		crossRefs.current.forEach((mesh, i) => {
			if (!mesh) return
			mesh.material.opacity = (0.4 + pulse * 0.2) * amount
			mesh.rotation.z = (i * Math.PI) / 2 + t * 0.15
		})
	})

	const matProps = {
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		depthTest: false,
		toneMapped: false,
	}

	const ringGroup = (
		<>
			<mesh ref={rippleRef} renderOrder={30} raycast={() => null}>
				<ringGeometry args={[0.042, 0.048, 28]} />
				<meshBasicMaterial color={color} {...matProps} />
			</mesh>
			<mesh ref={outerRef} renderOrder={31} raycast={() => null}>
				<ringGeometry args={[0.028, 0.038, 28]} />
				<meshBasicMaterial color={color} {...matProps} />
			</mesh>
			<mesh ref={innerRef} renderOrder={32} raycast={() => null}>
				<ringGeometry args={[0.014, 0.02, 24]} />
				<meshBasicMaterial color="#ffffff" {...matProps} />
			</mesh>
			<mesh ref={coreRef} renderOrder={33} raycast={() => null}>
				<sphereGeometry args={[0.009, 10, 10]} />
				<meshBasicMaterial color="#ffffff" {...matProps} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<mesh
					key={i}
					ref={(el) => {
						crossRefs.current[i] = el
					}}
					renderOrder={32}
					raycast={() => null}
				>
					<planeGeometry args={[0.055, 0.0025]} />
					<meshBasicMaterial color={color} {...matProps} />
				</mesh>
			))}
			{surfaceAligned && (
				<mesh ref={stemRef} position={[0, 0, 0.022]} renderOrder={29} raycast={() => null}>
					<cylinderGeometry args={[0.0012, 0.0012, 0.042, 6]} />
					<meshBasicMaterial color={color} {...matProps} />
				</mesh>
			)}
		</>
	)

	return surfaceAligned ? <group ref={orientRef}>{ringGroup}</group> : ringGroup
}

export default function ConceptFocusHighlight() {
	const rootRef = useRef()
	const lightRef = useRef()
	const amount = useRef(0)
	const { selectedId } = useConcept()
	const tendrils = useMemo(() => getSharedTendrils(), [])
	const hotspot = selectedId ? getHotspotByConceptId(selectedId) : null
	const color = selectedId ? getHotspotColor(selectedId) : "#ff8ec8"

	const staticPos = useMemo(() => {
		if (!hotspot || hotspot.trackTendril != null) return null
		return hotspot.position
	}, [hotspot])

	useFrame((_, delta) => {
		const target = selectedId ? 1 : 0
		amount.current += (target - amount.current) * (1 - Math.exp(-8 * delta))
		if (!rootRef.current) return

		rootRef.current.visible = amount.current > 0.02
		if (lightRef.current) {
			lightRef.current.intensity = 4.5 * amount.current
		}

		if (amount.current < 0.02 || !hotspot) return

		if (hotspot.trackTendril != null) {
			const tn = tendrils[hotspot.trackTendril]
			if (tn) {
				const animT = performance.now() * 0.0005
				const pt = sampleTendrilPoint(tn, hotspot.trackT ?? 0.55, animT)
				rootRef.current.position.set(pt.x, pt.y, pt.z)
			}
		} else if (staticPos) {
			rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2])
		}
	})

	if (!hotspot) return null

	return (
		<group ref={rootRef} position={staticPos ?? undefined}>
			<FocusRing
				color={color}
				amountRef={amount}
				surfaceAligned={hotspot.surfaceAligned}
				position={staticPos ?? [0, 0, 0]}
			/>
			<pointLight ref={lightRef} color={color} intensity={0} distance={0.85} decay={1.8} />
		</group>
	)
}
