/**
 * Graphe de connaissances — contenu éducatif en français.
 * Uniquement les concepts visibles dans la scène 3D.
 */

export const concepts = {
	plasma: {
		id: "plasma",
		title: "Plasma",
		summary:
			"Le plasma est le quatrième état de la matière : un gaz ionisé capable de conduire l'électricité.",
		description: [
			"Le plasma est souvent appelé le quatrième état de la matière. Il se forme lorsqu'un gaz reçoit suffisamment d'énergie pour arracher certains électrons aux atomes. Ces particules chargées deviennent alors capables de conduire l'électricité.",
			"Dans le globe, tu le vois sous forme de lumière diffuse à l'intérieur de la sphère de verre.",
		],
		related: ["filament-plasma", "ionisation", "atome"],
	},
	"filament-plasma": {
		id: "filament-plasma",
		title: "Filament de plasma",
		summary:
			"Les filaments lumineux sont les structures les plus visibles d'un globe plasma. Ils apparaissent lorsque l'électricité traverse un gaz ionisé et crée un chemin conducteur à travers la sphère.",
		description: [
			"Lorsqu'une très haute tension est appliquée à l'électrode centrale, un champ électrique intense se forme à l'intérieur du globe. Ce champ arrache des électrons à certains atomes du gaz contenu dans la sphère.",
			"Le gaz devient alors un plasma, un état de la matière capable de conduire l'électricité. Les filaments que tu observes sont les chemins empruntés par le courant électrique à travers ce plasma.",
			"Ces structures sont en mouvement permanent. Elles se déplacent, se divisent et se reforment continuellement sous l'influence du champ électrique.",
		],
		funFact:
			"⚡ Les filaments d'un globe plasma reposent sur les mêmes principes physiques que la foudre. La principale différence est l'échelle : un filament mesure quelques centimètres alors qu'un éclair peut parcourir plusieurs kilomètres.",
		related: ["plasma", "ionisation", "atome", "tension"],
	},
	ionisation: {
		id: "ionisation",
		title: "Ionisation",
		description: [
			"L'ionisation est le processus par lequel un atome perd ou gagne des électrons.",
			"Dans le globe, la brume rosée près de la paroi interne illustre cette énergie qui travaille le gaz avant la formation des filaments.",
		],
		related: ["plasma", "filament-plasma", "atome"],
	},
	atome: {
		id: "atome",
		title: "Atome",
		description: [
			"L'atome est l'unité de base de la matière. Tout ce qui nous entoure est constitué d'atomes.",
			"L'électrode centrale du globe est le point d'origine de l'énergie qui ionise le gaz et alimente les filaments.",
		],
		related: ["plasma", "filament-plasma", "ionisation", "tension"],
	},
	tension: {
		id: "tension",
		title: "Tension",
		description: [
			"La tension représente une différence de potentiel électrique entre deux points.",
			"Dans le globe, elle est transmise par la colonne métallique qui relie la base à l'électrode centrale.",
		],
		related: ["filament-plasma", "atome", "electricite"],
	},
	electricite: {
		id: "electricite",
		title: "Électricité",
		description: [
			"L'électricité désigne l'ensemble des phénomènes liés à la présence et au déplacement des charges électriques.",
			"La base du globe est le point d'alimentation : c'est d'ici que le courant entre dans l'appareil.",
		],
		related: ["tension", "filament-plasma", "plasma"],
	},
}
