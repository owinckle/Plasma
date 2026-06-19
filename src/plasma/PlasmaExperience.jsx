import { useMemo, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import ConceptCamera from "../education/ConceptCamera.jsx"
import { useViewport } from "../education/useViewport.js"
import PlasmaScene from "./PlasmaScene.jsx"
import { COLORS } from "./constants.js"

function Scene({ isMobile }) {
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
				minDistance={isMobile ? 1.55 : 1.4}
				maxDistance={isMobile ? 5.2 : 6}
				minPolarAngle={0.35}
				maxPolarAngle={Math.PI * 0.6}
				autoRotate
				autoRotateSpeed={0.12}
				dampingFactor={0.06}
				enableDamping
				touches={{
					ONE: THREE.TOUCH.ROTATE,
					TWO: THREE.TOUCH.DOLLY,
				}}
			/>

			<EffectComposer multisampling={0}>
				<Bloom
					intensity={0.58}
					luminanceThreshold={0.22}
					luminanceSmoothing={0.7}
					mipmapBlur={false}
					resolutionScale={isMobile ? 0.65 : 0.75}
				/>
			</EffectComposer>
		</>
	)
}

export function PlasmaCanvas() {
	const { isMobile, isTablet } = useViewport()
	const dpr = useMemo(() => {
		if (isMobile) return [1, 1]
		if (isTablet) return [1, 1.1]
		return [1, 1.25]
	}, [isMobile, isTablet])

	const camera = useMemo(
		() => ({
			position: isMobile ? [0, 0.28, 4.25] : [0, 0.35, 3.95],
			fov: isMobile ? 44 : 40,
			near: 0.1,
			far: 30,
		}),
		[isMobile],
	)

	return (
		<Canvas
			camera={camera}
			gl={{
				antialias: false,
				alpha: false,
				powerPreference: "high-performance",
				toneMapping: THREE.ACESFilmicToneMapping,
				toneMappingExposure: 1.02,
			}}
			dpr={dpr}
			style={{ touchAction: "none" }}
		>
			<Scene isMobile={isMobile} />
		</Canvas>
	)
}
