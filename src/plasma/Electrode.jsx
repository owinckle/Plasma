import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "../education/ConceptContext.jsx"
import { ELECTRODE_FOCUS } from "../education/conceptFocus.js"

const coreVertex = `
	varying vec3 vPos;
	varying vec3 vNormal;
	varying vec3 vView;
	uniform float uTime;

	float hash(vec3 p) {
		return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
	}

	float noise(vec3 p) {
		vec3 i = floor(p);
		vec3 f = fract(p);
		f = f * f * (3.0 - 2.0 * f);
		float n000 = hash(i + vec3(0.0, 0.0, 0.0));
		float n100 = hash(i + vec3(1.0, 0.0, 0.0));
		float n010 = hash(i + vec3(0.0, 1.0, 0.0));
		float n110 = hash(i + vec3(1.0, 1.0, 0.0));
		float n001 = hash(i + vec3(0.0, 0.0, 1.0));
		float n101 = hash(i + vec3(1.0, 0.0, 1.0));
		float n011 = hash(i + vec3(0.0, 1.0, 1.0));
		float n111 = hash(i + vec3(1.0, 1.0, 1.0));
		float nx00 = mix(n000, n100, f.x);
		float nx10 = mix(n010, n110, f.x);
		float nx01 = mix(n001, n101, f.x);
		float nx11 = mix(n011, n111, f.x);
		float nxy0 = mix(nx00, nx10, f.y);
		float nxy1 = mix(nx01, nx11, f.y);
		return mix(nxy0, nxy1, f.z);
	}

	void main() {
		vPos = position;
		float n = noise(normal * 4.0 + vec3(uTime * 0.18));
		vec3 warped = position + normal * (n - 0.5) * 0.012;
		vNormal = normalize(normalMatrix * normalize(warped));
		vec4 mv = modelViewMatrix * vec4(warped, 1.0);
		vView = -mv.xyz;
		gl_Position = projectionMatrix * mv;
	}
`

const glowVertex = `
	varying vec3 vPos;
	varying vec3 vNormal;
	varying vec3 vView;
	void main() {
		vPos = position;
		vNormal = normalize(normalMatrix * normal);
		vec4 mv = modelViewMatrix * vec4(position, 1.0);
		vView = -mv.xyz;
		gl_Position = projectionMatrix * mv;
	}
`

const glowFragment = `
	uniform float uTime;
	uniform float uFocus;
	varying vec3 vPos;
	varying vec3 vNormal;
	varying vec3 vView;

	float hash(vec3 p) {
		return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
	}
	float noise(vec3 p) {
		vec3 i = floor(p);
		vec3 f = fract(p);
		f = f * f * (3.0 - 2.0 * f);
		float n000 = hash(i + vec3(0.0, 0.0, 0.0));
		float n100 = hash(i + vec3(1.0, 0.0, 0.0));
		float n010 = hash(i + vec3(0.0, 1.0, 0.0));
		float n110 = hash(i + vec3(1.0, 1.0, 0.0));
		float n001 = hash(i + vec3(0.0, 0.0, 1.0));
		float n101 = hash(i + vec3(1.0, 0.0, 1.0));
		float n011 = hash(i + vec3(0.0, 1.0, 1.0));
		float n111 = hash(i + vec3(1.0, 1.0, 1.0));
		float nx00 = mix(n000, n100, f.x);
		float nx10 = mix(n010, n110, f.x);
		float nx01 = mix(n001, n101, f.x);
		float nx11 = mix(n011, n111, f.x);
		float nxy0 = mix(nx00, nx10, f.y);
		float nxy1 = mix(nx01, nx11, f.y);
		return mix(nxy0, nxy1, f.z);
	}

	void main() {
		float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
		vec3 dir = normalize(vPos);
		float n = noise(dir * 4.0 + vec3(uTime * 0.5))
			* 0.6 + noise(dir * 8.0 - vec3(uTime * 0.3)) * 0.4;
		float a = fres * (0.35 + n * 0.85) * (0.55 + uFocus * 1.1);
		vec3 col = mix(vec3(1.0, 0.12, 0.42), vec3(1.0, 0.45, 0.78), n);
		gl_FragColor = vec4(col, a * 0.55);
	}
`

const coreFragment = `
	uniform float uTime;
	varying vec3 vPos;
	varying vec3 vNormal;
	varying vec3 vView;

	float hash(vec3 p) {
		return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
	}

	float noise(vec3 p) {
		vec3 i = floor(p);
		vec3 f = fract(p);
		f = f * f * (3.0 - 2.0 * f);
		float n000 = hash(i + vec3(0.0, 0.0, 0.0));
		float n100 = hash(i + vec3(1.0, 0.0, 0.0));
		float n010 = hash(i + vec3(0.0, 1.0, 0.0));
		float n110 = hash(i + vec3(1.0, 1.0, 0.0));
		float n001 = hash(i + vec3(0.0, 0.0, 1.0));
		float n101 = hash(i + vec3(1.0, 0.0, 1.0));
		float n011 = hash(i + vec3(0.0, 1.0, 1.0));
		float n111 = hash(i + vec3(1.0, 1.0, 1.0));
		float nx00 = mix(n000, n100, f.x);
		float nx10 = mix(n010, n110, f.x);
		float nx01 = mix(n001, n101, f.x);
		float nx11 = mix(n011, n111, f.x);
		float nxy0 = mix(nx00, nx10, f.y);
		float nxy1 = mix(nx01, nx11, f.y);
		return mix(nxy0, nxy1, f.z);
	}

	void main() {
		float r = length(vPos);
		float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 1.8);
		vec3 p = vPos * 12.0 + vec3(uTime * 0.8, -uTime * 0.45, uTime * 0.32);
		float n = noise(p) * 0.55 + noise(p * 2.1) * 0.3 + noise(p * 4.0) * 0.15;
		float veins = smoothstep(0.48, 0.86, n);
		float center = 1.0 - smoothstep(0.0, 0.085, r);
		vec3 red = vec3(1.0, 0.05, 0.25);
		vec3 magenta = vec3(1.0, 0.12, 0.72);
		vec3 hot = vec3(1.0, 0.74, 0.88);
		vec3 col = mix(red, magenta, n);
		col = mix(col, hot, center * 0.75 + veins * 0.28);
		col += vec3(0.45, 0.0, 0.22) * fresnel;
		gl_FragColor = vec4(col, 1.0);
	}
`

export default function Electrode() {
	const coreRef = useRef()
	const glowMatRef = useRef()
	const coreMatRef = useRef()
	const focusRingRef = useRef()
	const outerRingRef = useRef()
	const focusAmount = useRef(0)
	const { selectedId } = useConcept()

	useFrame((_, delta) => {
		const t = performance.now() * 0.001
		if (coreMatRef.current) coreMatRef.current.uniforms.uTime.value = t
		if (glowMatRef.current) {
			glowMatRef.current.uniforms.uTime.value = t
			const want = ELECTRODE_FOCUS.has(selectedId) ? 1 : 0
			focusAmount.current += (want - focusAmount.current) * (1 - Math.exp(-6 * delta))
			glowMatRef.current.uniforms.uFocus.value = focusAmount.current
		}
		if (focusRingRef.current) {
			const pulse = 1 + 0.14 * Math.sin(t * 3.5)
			focusRingRef.current.scale.setScalar(1 + focusAmount.current * 0.45 * pulse)
			focusRingRef.current.material.opacity = focusAmount.current * 0.75
		}
		if (outerRingRef.current) {
			const pulse = 1 + 0.1 * Math.sin(t * 2.8 + 1)
			outerRingRef.current.scale.setScalar(1 + focusAmount.current * 0.6 * pulse)
			outerRingRef.current.material.opacity = focusAmount.current * 0.35
		}
	})

	return (
		<group>
			<mesh renderOrder={1}>
				<sphereGeometry args={[0.115, 24, 24]} />
				<shaderMaterial
					ref={glowMatRef}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					uniforms={{ uTime: { value: 0 }, uFocus: { value: 0 } }}
					vertexShader={glowVertex}
					fragmentShader={glowFragment}
				/>
			</mesh>
			<mesh ref={coreRef} renderOrder={2}>
				<sphereGeometry args={[0.086, 24, 24]} />
				<shaderMaterial
					ref={coreMatRef}
					depthWrite
					uniforms={{ uTime: { value: 0 } }}
					vertexShader={coreVertex}
					fragmentShader={coreFragment}
				/>
			</mesh>
			<mesh renderOrder={2}>
				<sphereGeometry args={[0.026, 14, 14]} />
				<meshBasicMaterial color="#ffe0f2" toneMapped={false} />
			</mesh>
			<mesh ref={outerRingRef} renderOrder={3} raycast={() => null}>
				<ringGeometry args={[0.14, 0.155, 28]} />
				<meshBasicMaterial
					color="#ffc888"
					transparent
					opacity={0}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					depthTest={false}
					toneMapped={false}
				/>
			</mesh>
			<mesh ref={focusRingRef} renderOrder={4} raycast={() => null}>
				<ringGeometry args={[0.1, 0.118, 28]} />
				<meshBasicMaterial
					color="#ffc888"
					transparent
					opacity={0}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					depthTest={false}
					toneMapped={false}
				/>
			</mesh>
		</group>
	)
}
