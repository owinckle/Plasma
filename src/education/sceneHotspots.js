import { GLOBE_RADIUS, HIGHLIGHT_TENDRIL_INDEX } from "../plasma/globeUtils.js"

function onGlobe(x, y, z, depth = 0.94) {
	const len = Math.hypot(x, y, z) || 1
	const r = GLOBE_RADIUS * depth
	return [x / len * r, y / len * r, z / len * r]
}

/** Point d'ancrage de la brume d'ionisation (paroi interne du globe). */
export const IONISATION_ANCHOR = onGlobe(-0.48, 0.4, 0.54, 0.905)

/** Marqueurs pour les éléments réellement rendus dans la scène. */
export const SCENE_HOTSPOTS = [
	{
		id: "plasma",
		position: onGlobe(0.1, 0.34, 0.84, 0.97),
		surfaceAligned: true,
		pickRadius: 0.1,
		color: "#a8c8f0",
		phase: 0,
	},
	{
		id: "filament-plasma",
		trackTendril: HIGHLIGHT_TENDRIL_INDEX,
		trackT: 0.55,
		surfaceAligned: false,
		pickRadius: 0.1,
		color: "#ff72b8",
		phase: 1.35,
	},
	{
		id: "ionisation",
		position: IONISATION_ANCHOR,
		surfaceAligned: true,
		pickRadius: 0.1,
		color: "#c890ff",
		phase: 2.2,
	},
	{
		id: "atome",
		position: [0, 0.025, 0.045],
		surfaceAligned: false,
		pickRadius: 0.09,
		color: "#ffc888",
		phase: 0.65,
	},
	{
		id: "tension",
		position: [0.065, -0.45, 0.045],
		surfaceAligned: false,
		pickRadius: 0.09,
		color: "#a8bcd8",
		phase: 3.1,
	},
	{
		id: "electricite",
		position: [0.26, -1.03, 0.2],
		surfaceAligned: false,
		pickRadius: 0.11,
		color: "#ffe898",
		phase: 4.4,
	},
]

export const SCENE_HOTSPOT_IDS = new Set(SCENE_HOTSPOTS.map((h) => h.id))
