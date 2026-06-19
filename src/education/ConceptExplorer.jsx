import { getAllConcepts, getRelatedConcepts } from "../knowledge/index.js"
import { useConcept } from "./ConceptContext.jsx"
import { SCENE_HOTSPOT_IDS } from "./sceneHotspots.js"
import { useViewport } from "./useViewport.js"

export default function ConceptExplorer() {
	const { selectedId, selectConcept, selected, setHoveredId, enterFreeView } = useConcept()
	const { isMobile, isCoarse } = useViewport()
	const allConcepts = getAllConcepts()
	const related = selected ? getRelatedConcepts(selectedId) : []

	const hint = selected
		? isCoarse
			? "Faites glisser ou pincez pour repasser en vue libre."
			: "Faites glisser ou zoomez pour repasser en vue libre."
		: isCoarse
			? "Touchez les marqueurs lumineux ou choisissez un concept ci-dessous."
			: "Cliquez sur les marqueurs lumineux dans la scène ou choisissez un concept ci-dessous."

	return (
		<div className={`concept-explorer${selected ? " concept-explorer--detail-open" : ""}`}>
			<aside className="concept-explorer__nav" aria-label="Liste des concepts">
				<header className="concept-explorer__header">
					<p className="concept-explorer__eyebrow">Le Plasma</p>
					<h1 className="concept-explorer__title">Explorer</h1>
					<p className="concept-explorer__hint">{hint}</p>
				</header>

				<ul className="concept-list" role="list">
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
								aria-current={selectedId === concept.id ? "true" : undefined}
							>
								{concept.title}
							</button>
						</li>
					))}
				</ul>
			</aside>

			{selected && (
				<article
					className="concept-panel"
					aria-live="polite"
					aria-label={`Détail : ${selected.title}`}
				>
					<header className="concept-panel__header">
						<div className="concept-panel__header-row">
							<h2 className="concept-panel__title">{selected.title}</h2>
							{isMobile && (
								<button
									type="button"
									className="concept-panel__close"
									onClick={enterFreeView}
									aria-label="Fermer le détail"
								>
									<span aria-hidden="true">×</span>
								</button>
							)}
						</div>
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
