import { useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import ConceptCamera from "../education/ConceptCamera.jsx"
import PlasmaScene from "./PlasmaScene.jsx"
import { COLORS } from "./constants.js"

function Scene() {
	const controlsRef = useRef()

	return (
		<>
			<color attach="background" args={[COLORS.bg]} />
			<PlasmaScene />
			<ConceptCamera controlsRef={controlsRef} />

			<OrbitControls
				ref={controlsRef}
				enablePan={false}
				target={[0, -0.22, 0]}
				minDistance={1.4}
				maxDistance={6}
				minPolarAngle={0.35}
				maxPolarAngle={Math.PI * 0.6}
				autoRotate
				autoRotateSpeed={0.12}
				dampingFactor={0.06}
				enableDamping
			/>

			<EffectComposer multisampling={0}>
				<Bloom
					intensity={0.58}
					luminanceThreshold={0.22}
					luminanceSmoothing={0.7}
					mipmapBlur={false}
					resolutionScale={0.75}
				/>
			</EffectComposer>
		</>
	)
}

export function PlasmaCanvas() {
	return (
		<Canvas
			camera={{ position: [0, 0.35, 3.95], fov: 40, near: 0.1, far: 30 }}
			gl={{
				antialias: false,
				alpha: false,
				powerPreference: "high-performance",
				toneMapping: THREE.ACESFilmicToneMapping,
				toneMappingExposure: 1.02,
			}}
			dpr={[1, 1.25]}
		>
			<Scene />
		</Canvas>
	)
}
