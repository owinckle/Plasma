import { getAllConcepts, getRelatedConcepts } from "../knowledge/index.js"
import { useConcept } from "./ConceptContext.jsx"
import { SCENE_HOTSPOT_IDS } from "./sceneHotspots.js"

export default function ConceptExplorer() {
	const { selectedId, selectConcept, selected, setHoveredId } = useConcept()
	const allConcepts = getAllConcepts()
	const related = selected ? getRelatedConcepts(selectedId) : []

	return (
		<div className="concept-explorer">
			<aside className="concept-explorer__nav" aria-label="Liste des concepts">
				<header className="concept-explorer__header">
					<p className="concept-explorer__eyebrow">Le Plasma</p>
					<h1 className="concept-explorer__title">Explorer</h1>
					<p className="concept-explorer__hint">
						{selected
							? "Faites glisser ou zoomez pour repasser en vue libre."
							: "Cliquez sur les marqueurs lumineux dans la scène ou choisissez un concept ci-dessous."}
					</p>
				</header>

				<ul className="concept-list">
					{allConcepts.map((concept) => (
						<li key={concept.id}>
							<button
								type="button"
								className={`concept-list__item${selectedId === concept.id ? " concept-list__item--active" : ""}`}
								onClick={() => selectConcept(concept.id)}
								onMouseEnter={() => {
									if (SCENE_HOTSPOT_IDS.has(concept.id)) setHoveredId(concept.id)
								}}
								onMouseLeave={() => setHoveredId(null)}
							>
								{concept.title}
							</button>
						</li>
					))}
				</ul>
			</aside>

			{selected && (
				<article className="concept-panel" aria-live="polite">
					<header className="concept-panel__header">
						<h2 className="concept-panel__title">{selected.title}</h2>
						{selected.summary && <p className="concept-panel__summary">{selected.summary}</p>}
					</header>

					<div className="concept-panel__body">
						{selected.description.map((paragraph) => (
							<p key={paragraph.slice(0, 32)}>{paragraph}</p>
						))}
					</div>

					{selected.funFact && (
						<aside className="concept-panel__fun-fact">
							<p className="concept-panel__fun-fact-label">Le savais-tu ?</p>
							<p>{selected.funFact}</p>
						</aside>
					)}

					{related.length > 0 && (
						<footer className="concept-panel__footer">
							<p className="concept-panel__related-label">Concepts liés</p>
							<div className="concept-panel__related">
								{related.map((concept) => (
									<button
										key={concept.id}
										type="button"
										className="concept-chip"
										onClick={() => selectConcept(concept.id)}
									>
										{concept.title}
									</button>
								))}
							</div>
						</footer>
					)}
				</article>
			)}

			<p className="concept-explorer__credit">
				Projet hackathon — Defend Intelligence &amp; OpenAI · par Ocean Winckler
			</p>
		</div>
	)
}
