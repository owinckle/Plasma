import GlassShell from "./GlassShell.jsx"
import Electrode from "./Electrode.jsx"
import FilamentField from "./FilamentField.jsx"
import SurfaceWisps from "./SurfaceWisps.jsx"

export default function PlasmaGlobe() {
	return (
		<group>
			<SurfaceWisps />
			<FilamentField />
			<Electrode />
			<GlassShell />
		</group>
	)
}
