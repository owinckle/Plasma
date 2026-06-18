import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useConcept } from "./ConceptContext.jsx"
import { BASE_VIEW, CONCEPT_FOCUS } from "./sceneFocus.js"

const DRAG_EPS = 0.02
const ARRIVE_EPS = 0.02

export default function ConceptCamera({ controlsRef }) {
	const { selectedId, focusToken, enterFreeView } = useConcept()
	const { camera } = useThree()
	const goalTarget = useRef(new THREE.Vector3())
	const goalPosition = useRef(new THREE.Vector3())
	const animating = useRef(false)
	const snapPosition = useRef(new THREE.Vector3())
	const snapTarget = useRef(new THREE.Vector3())
	const navigating = useRef(false)
	const hasMoved = useRef(false)
	const selectedIdRef = useRef(selectedId)
	selectedIdRef.current = selectedId

	useEffect(() => {
		const controls = controlsRef.current
		if (!controls || !selectedId) return

		const focus = CONCEPT_FOCUS[selectedId] ?? CONCEPT_FOCUS.plasma
		goalTarget.current.set(focus.target[0], focus.target[1], focus.target[2])
		goalPosition.current.set(focus.position[0], focus.position[1], focus.position[2])
		animating.current = true
		controls.enabled = true
		controls.autoRotate = false
	}, [selectedId, focusToken, controlsRef])

	useEffect(() => {
		const controls = controlsRef.current
		if (!controls) return

		const onStart = () => {
			navigating.current = true
			hasMoved.current = false
			snapPosition.current.copy(camera.position)
			snapTarget.current.copy(controls.target)
		}

		const onChange = () => {
			if (!navigating.current) return
			const moved =
				camera.position.distanceTo(snapPosition.current) > DRAG_EPS ||
				controls.target.distanceTo(snapTarget.current) > DRAG_EPS
			if (moved) hasMoved.current = true
		}

		const onEnd = () => {
			if (hasMoved.current && selectedIdRef.current) {
				enterFreeView()
				goalTarget.current.set(BASE_VIEW.target[0], BASE_VIEW.target[1], BASE_VIEW.target[2])
				goalPosition.current.set(BASE_VIEW.position[0], BASE_VIEW.position[1], BASE_VIEW.position[2])
				animating.current = true
				controls.autoRotate = false
			} else if (hasMoved.current) {
				animating.current = false
				enterFreeView()
				controls.autoRotate = true
			}
			navigating.current = false
			hasMoved.current = false
		}

		controls.addEventListener("start", onStart)
		controls.addEventListener("change", onChange)
		controls.addEventListener("end", onEnd)
		return () => {
			controls.removeEventListener("start", onStart)
			controls.removeEventListener("change", onChange)
			controls.removeEventListener("end", onEnd)
		}
	}, [controlsRef, camera, enterFreeView])

	useFrame((_, delta) => {
		if (!animating.current) return

		const controls = controlsRef.current
		if (!controls) return

		const t = 1 - Math.exp(-4.5 * delta)
		controls.target.lerp(goalTarget.current, t)
		camera.position.lerp(goalPosition.current, t)
		controls.update()

		const dist =
			camera.position.distanceTo(goalPosition.current) + controls.target.distanceTo(goalTarget.current)
		if (dist < ARRIVE_EPS) {
			animating.current = false
			controls.enabled = true
			controls.autoRotate = !selectedIdRef.current
		}
	})

	return null
}
