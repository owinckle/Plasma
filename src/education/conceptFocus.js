import { SCENE_HOTSPOTS } from "./sceneHotspots.js"
import { HIGHLIGHT_TENDRIL_INDEX } from "../plasma/globeUtils.js"

export const TENDRIL_FOCUS = {
	"filament-plasma": { index: HIGHLIGHT_TENDRIL_INDEX, trackT: 0.55 },
}

export const ELECTRODE_FOCUS = new Set(["atome"])

export const IONISATION_FOCUS = new Set(["ionisation"])

export function getHotspotByConceptId(id) {
	return SCENE_HOTSPOTS.find((h) => h.id === id) ?? null
}

export function getHotspotColor(id) {
	return getHotspotByConceptId(id)?.color ?? "#ff8ec8"
}
