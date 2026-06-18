import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "../education/ConceptContext.jsx"
import { GLOBE_RADIUS } from "./globeUtils.js"

const rimVertex = `
	varying vec3 vWNormal;
	varying vec3 vWPos;
	void main() {
		vWNormal = normalize(mat3(modelMatrix) * normal);
		vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`

const rimFragment = `
	uniform float uFocus;
	varying vec3 vWNormal;
	varying vec3 vWPos;
	void main() {
		vec3 N = normalize(vWNormal);
		vec3 V = normalize(cameraPosition - vWPos);
		float ndv = max(dot(N, V), 0.0);
		float f = 1.0 - ndv;
		float fresnel = pow(f, 2.6);

		vec3 L1 = normalize(vec3(-0.6, 0.95, 0.5));
		vec3 H1 = normalize(L1 + V);
		float s1 = pow(max(dot(N, H1), 0.0), 240.0);
		vec3 L2 = normalize(vec3(0.55, 0.5, 0.7));
		vec3 H2 = normalize(L2 + V);
		float s2 = pow(max(dot(N, H2), 0.0), 80.0);

		float edge = smoothstep(0.5, 0.99, f);
		vec3 rim = mix(vec3(0.10, 0.15, 0.26), vec3(0.62, 0.78, 1.0), fresnel);
		vec3 col = rim + vec3(1.0) * (s1 + s2 * 0.5);
		col += vec3(0.35, 0.55, 1.0) * uFocus * fresnel * 1.2;
		float alpha = fresnel * (0.26 + uFocus * 0.38) + edge * (0.16 + uFocus * 0.22) + s1 + s2 * 0.5 + 0.008;
		gl_FragColor = vec4(col, alpha);
	}
`

export default function GlassShell() {
	const skipRaycast = () => null
	const rimMatRef = useRef()
	const shellGlowRef = useRef()
	const focusAmount = useRef(0)
	const { selectedId } = useConcept()

	useFrame((_, delta) => {
		let target = 0
		if (selectedId === "plasma") target = 1
		else if (selectedId) target = 0.1
		focusAmount.current += (target - focusAmount.current) * (1 - Math.exp(-6 * delta))
		const f = focusAmount.current
		if (rimMatRef.current) {
			rimMatRef.current.uniforms.uFocus.value = f
		}
		if (shellGlowRef.current) {
			shellGlowRef.current.opacity = f * 0.22
		}
	})

	return (
		<group>
			<mesh renderOrder={2} raycast={skipRaycast}>
				<sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
				<meshPhysicalMaterial
					transparent
					opacity={0.03}
					roughness={0.05}
					metalness={0.0}
					transmission={0.97}
					thickness={0.25}
					ior={1.5}
					clearcoat={1.0}
					clearcoatRoughness={0.04}
					color="#eaf2ff"
					depthWrite={false}
					side={THREE.FrontSide}
				/>
			</mesh>

			<mesh renderOrder={2} raycast={skipRaycast}>
				<sphereGeometry args={[GLOBE_RADIUS * 1.008, 32, 32]} />
				<meshBasicMaterial
					ref={shellGlowRef}
					color="#88b8ff"
					transparent
					opacity={0}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					side={THREE.BackSide}
					toneMapped={false}
				/>
			</mesh>

			<mesh renderOrder={3} raycast={skipRaycast}>
				<sphereGeometry args={[GLOBE_RADIUS * 1.004, 32, 32]} />
				<shaderMaterial
					ref={rimMatRef}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					uniforms={{ uFocus: { value: 0 } }}
					vertexShader={rimVertex}
					fragmentShader={rimFragment}
				/>
			</mesh>
		</group>
	)
}
