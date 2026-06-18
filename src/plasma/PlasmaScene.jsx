import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import PlasmaGlobe from "./PlasmaGlobe.jsx"
import PlasmaStand from "./PlasmaStand.jsx"
import ConceptHotspots from "../education/ConceptHotspots.jsx"
import ConceptFocusHighlight from "../education/ConceptFocusHighlight.jsx"
import { useConcept } from "../education/ConceptContext.jsx"

function SceneFocusLighting() {
	const ambientRef = useRef()
	const keyRef = useRef()
	const fillRef = useRef()
	const electrodeLightRef = useRef()
	const { selectedId } = useConcept()
	const focusAmount = useRef(0)

	useFrame((_, delta) => {
		const target = selectedId ? 1 : 0
		focusAmount.current += (target - focusAmount.current) * (1 - Math.exp(-6 * delta))
		const f = focusAmount.current
		if (ambientRef.current) {
			ambientRef.current.intensity = 0.35 - f * 0.18
		}
		if (keyRef.current) {
			keyRef.current.intensity = 1.1 - f * 0.45
		}
		if (fillRef.current) {
			fillRef.current.intensity = 0.4 - f * 0.22
		}
		if (electrodeLightRef.current) {
			electrodeLightRef.current.intensity = 5 - f * 2.8
		}
	})

	return (
		<>
			<ambientLight ref={ambientRef} intensity={0.35} color="#26324a" />
			<pointLight ref={electrodeLightRef} position={[0, 0, 0]} intensity={5} distance={1.6} decay={2.4} color="#ff5aa0" />
			<directionalLight ref={keyRef} position={[-3.5, 4.5, 3]} intensity={1.1} color="#bcc8e0" />
			<directionalLight ref={fillRef} position={[3, 1.5, -3.5]} intensity={0.4} color="#5d6b94" />
		</>
	)
}

export default function PlasmaScene() {
	return (
		<group>
			<SceneFocusLighting />
			<PlasmaStand />
			<PlasmaGlobe />
			<ConceptHotspots />
			<ConceptFocusHighlight />
		</group>
	)
}
