import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { getConcept } from "../knowledge/index.js"

const ConceptContext = createContext(null)

export function ConceptProvider({ children }) {
	const [selectedId, setSelectedId] = useState(null)
	const [hoveredId, setHoveredId] = useState(null)
	const [focusToken, setFocusToken] = useState(0)

	const selectConcept = useCallback((id) => {
		if (!getConcept(id)) return
		setSelectedId(id)
		setFocusToken((t) => t + 1)
	}, [])

	const enterFreeView = useCallback(() => {
		setSelectedId(null)
	}, [])

	const value = useMemo(
		() => ({
			selectedId,
			hoveredId,
			focusToken,
			selectConcept,
			enterFreeView,
			setHoveredId,
			selected: selectedId ? getConcept(selectedId) : null,
		}),
		[selectedId, hoveredId, focusToken, selectConcept, enterFreeView],
	)

	return <ConceptContext.Provider value={value}>{children}</ConceptContext.Provider>
}

export function useConcept() {
	const ctx = useContext(ConceptContext)
	if (!ctx) throw new Error("useConcept must be used within ConceptProvider")
	return ctx
}
