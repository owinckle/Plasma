import { useRef } from "react"
import { useConcept } from "./ConceptContext.jsx"

const CLICK_PX = 6

export default function ConceptTarget({ conceptId, children }) {
	const { selectConcept, setHoveredId } = useConcept()
	const pointerStart = useRef(null)

	const handlePointerDown = (e) => {
		pointerStart.current = { x: e.clientX, y: e.clientY }
	}

	const handlePointerUp = (e) => {
		if (!pointerStart.current) return
		const dx = e.clientX - pointerStart.current.x
		const dy = e.clientY - pointerStart.current.y
		pointerStart.current = null
		if (dx * dx + dy * dy > CLICK_PX * CLICK_PX) return

		e.stopPropagation()
		selectConcept(conceptId)
	}

	return (
		<group
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerOver={(e) => {
				setHoveredId(conceptId)
				document.body.style.cursor = "pointer"
			}}
			onPointerOut={() => {
				setHoveredId(null)
				document.body.style.cursor = "default"
			}}
		>
			{children}
		</group>
	)
}
