import { useRef } from "react"
import { useConcept } from "./ConceptContext.jsx"

const CLICK_PX_MOUSE = 6
const CLICK_PX_TOUCH = 14

export default function ConceptTarget({ conceptId, children }) {
	const { selectConcept, setHoveredId } = useConcept()
	const pointerStart = useRef(null)

	const handlePointerDown = (e) => {
		pointerStart.current = { x: e.clientX, y: e.clientY, pointerType: e.pointerType }
	}

	const handlePointerUp = (e) => {
		if (!pointerStart.current) return
		const dx = e.clientX - pointerStart.current.x
		const dy = e.clientY - pointerStart.current.y
		const pointerType = pointerStart.current.pointerType
		pointerStart.current = null

		const threshold = pointerType === "touch" ? CLICK_PX_TOUCH : CLICK_PX_MOUSE
		if (dx * dx + dy * dy > threshold * threshold) return

		e.stopPropagation()
		selectConcept(conceptId)
	}

	const setHover = (active) => {
		setHoveredId(active ? conceptId : null)
		if (typeof document !== "undefined") {
			document.body.style.cursor = active ? "pointer" : ""
		}
	}

	return (
		<group
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerOver={() => setHover(true)}
			onPointerOut={() => setHover(false)}
		>
			{children}
		</group>
	)
}
