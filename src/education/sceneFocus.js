/** Vue libre par défaut (caméra initiale + cible OrbitControls). */
import { getTendrilRestPoint, HIGHLIGHT_TENDRIL_INDEX, TENDRIL_COUNT } from "../plasma/globeUtils.js"
import { IONISATION_ANCHOR } from "./sceneHotspots.js"

export const BASE_VIEW = {
	target: [0, -0.22, 0],
	position: [0, 0.35, 3.95],
}

const filamentPt = getTendrilRestPoint(HIGHLIGHT_TENDRIL_INDEX, TENDRIL_COUNT, 0.55)
const filamentDir = (() => {
	const len = Math.hypot(filamentPt.x, filamentPt.y, filamentPt.z) || 1
	return [filamentPt.x / len, filamentPt.y / len, filamentPt.z / len]
})()

/** Cible et position caméra pour chaque concept (zoom fluide). */
export const CONCEPT_FOCUS = {
	plasma: BASE_VIEW,
	ionisation: {
		target: [...IONISATION_ANCHOR],
		position: [
			IONISATION_ANCHOR[0] - 0.75,
			IONISATION_ANCHOR[1] + 0.42,
			IONISATION_ANCHOR[2] + 2.05,
		],
	},
	atome: {
		target: [0, 0, 0],
		position: [0.42, 0.22, 1.75],
	},
	tension: {
		target: [0, -0.52, 0],
		position: [0.95, 0.05, 2.45],
	},
	electricite: {
		target: [0, -1.32, 0],
		position: [0.35, -0.45, 3.35],
	},
	"filament-plasma": {
		target: [filamentPt.x, filamentPt.y, filamentPt.z],
		position: [
			filamentPt.x + filamentDir[0] * 0.75 + 0.12,
			filamentPt.y + filamentDir[1] * 0.75 + 0.38,
			filamentPt.z + filamentDir[2] * 0.75 + 2.05,
		],
	},
}
