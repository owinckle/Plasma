import { PlasmaCanvas } from "./plasma/PlasmaExperience.jsx"
import ConceptExplorer from "./education/ConceptExplorer.jsx"
import { ConceptProvider } from "./education/ConceptContext.jsx"
import "./education/education.css"
import "./App.css"

function App() {
	return (
		<ConceptProvider>
			<main className="plasma-app">
				<PlasmaCanvas />
				<ConceptExplorer />
			</main>
		</ConceptProvider>
	)
}

export default App
