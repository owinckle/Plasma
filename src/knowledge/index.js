import { concepts } from "./concepts.js"

export { concepts }

export function getConcept(id) {
	return concepts[id] ?? null
}

export function getAllConcepts() {
	return Object.values(concepts)
}

export function getRelatedConcepts(id) {
	const concept = getConcept(id)
	if (!concept) return []
	return concept.related.map((relatedId) => getConcept(relatedId)).filter(Boolean)
}

export function getGraphEdges() {
	const edges = []
	for (const concept of getAllConcepts()) {
		for (const relatedId of concept.related) {
			if (getConcept(relatedId)) {
				edges.push({ from: concept.id, to: relatedId })
			}
		}
	}
	return edges
}
