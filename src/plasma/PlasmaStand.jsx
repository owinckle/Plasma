import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "../education/ConceptContext.jsx"

export default function PlasmaStand() {
	const stemGlowRef = useRef()
	const baseGlowRef = useRef()
	const ribGlowRefs = useRef([])
	const stemAmount = useRef(0)
	const baseAmount = useRef(0)
	const { selectedId } = useConcept()

	const ribs = useMemo(() => {
		const out = []
		const top = -0.08
		const bottom = -0.82
		const count = 14
		for (let i = 0; i < count; i += 1) {
			out.push(bottom + (i / (count - 1)) * (top - bottom))
		}
		return out
	}, [])

	useFrame(({ clock }, delta) => {
		const stemTarget = selectedId === "tension" ? 1 : selectedId ? 0.08 : 0
		const baseTarget = selectedId === "electricite" ? 1 : selectedId ? 0.08 : 0
		stemAmount.current += (stemTarget - stemAmount.current) * (1 - Math.exp(-6 * delta))
		baseAmount.current += (baseTarget - baseAmount.current) * (1 - Math.exp(-6 * delta))
		const pulse = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 3)

		if (stemGlowRef.current) {
			stemGlowRef.current.material.opacity = stemAmount.current * 0.65 * pulse
		}
		if (baseGlowRef.current) {
			baseGlowRef.current.material.opacity = baseAmount.current * 0.7 * pulse
		}
		ribGlowRefs.current.forEach((mesh, i) => {
			if (!mesh) return
			mesh.material.opacity = stemAmount.current * 0.35 * (0.7 + 0.3 * Math.sin(clock.elapsedTime * 2.5 + i * 0.4))
		})
	})

	return (
		<group>
			<mesh position={[0, -0.46, 0]}>
				<cylinderGeometry args={[0.05, 0.072, 0.84, 24]} />
				<meshStandardMaterial color="#101013" roughness={0.5} metalness={0.35} />
			</mesh>

			<mesh ref={stemGlowRef} position={[0, -0.46, 0]} raycast={() => null}>
				<cylinderGeometry args={[0.062, 0.085, 0.88, 24]} />
				<meshBasicMaterial
					color="#b8d4f8"
					transparent
					opacity={0}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>

			{ribs.map((y, i) => (
				<group key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<mesh>
						<torusGeometry args={[0.064, 0.013, 8, 24]} />
						<meshStandardMaterial color="#0b0b0e" roughness={0.45} metalness={0.4} />
					</mesh>
					<mesh
						ref={(el) => {
							ribGlowRefs.current[i] = el
						}}
						raycast={() => null}
					>
						<torusGeometry args={[0.064, 0.018, 8, 24]} />
						<meshBasicMaterial
							color="#a8bcd8"
							transparent
							opacity={0}
							blending={THREE.AdditiveBlending}
							depthWrite={false}
							toneMapped={false}
						/>
					</mesh>
				</group>
			))}

			<mesh position={[0, -0.9, 0]}>
				<cylinderGeometry args={[0.11, 0.16, 0.14, 32]} />
				<meshStandardMaterial color="#08080a" roughness={0.6} metalness={0.25} />
			</mesh>

			<mesh position={[0, -0.97, 0]} rotation={[0, Math.PI / 4, 0]}>
				<cylinderGeometry args={[0.58, 0.66, 0.08, 4, 1]} />
				<meshStandardMaterial color="#161619" roughness={0.4} metalness={0.3} />
			</mesh>

			<mesh position={[0, -1.29, 0]} rotation={[0, Math.PI / 4, 0]}>
				<cylinderGeometry args={[0.66, 1.02, 0.62, 4, 1]} />
				<meshStandardMaterial color="#0c0c0f" roughness={0.65} metalness={0.18} />
			</mesh>

			<mesh position={[0, -1.61, 0]} rotation={[0, Math.PI / 4, 0]}>
				<cylinderGeometry args={[1.0, 1.04, 0.05, 4, 1]} />
				<meshStandardMaterial color="#050506" roughness={0.7} metalness={0.15} />
			</mesh>

			<mesh ref={baseGlowRef} position={[0, -1.22, 0]} rotation={[0, Math.PI / 4, 0]} raycast={() => null}>
				<cylinderGeometry args={[0.74, 1.1, 0.75, 4, 1]} />
				<meshBasicMaterial
					color="#ffe898"
					transparent
					opacity={0}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>
		</group>
	)
}
