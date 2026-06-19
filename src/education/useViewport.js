import { useEffect, useState } from "react"

function readViewport() {
	if (typeof window === "undefined") {
		return { isMobile: false, isTablet: false, isCoarse: false, isLandscape: false, isShort: false }
	}

	const isMobile = window.matchMedia("(max-width: 768px)").matches
	const isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches
	const isCoarse = window.matchMedia("(pointer: coarse)").matches
	const isLandscape = window.matchMedia("(orientation: landscape)").matches
	const isShort = window.matchMedia("(max-height: 520px)").matches

	return { isMobile, isTablet, isCoarse, isLandscape, isShort }
}

export function useViewport() {
	const [viewport, setViewport] = useState(readViewport)

	useEffect(() => {
		const queries = [
			"(max-width: 768px)",
			"(min-width: 769px) and (max-width: 1024px)",
			"(pointer: coarse)",
			"(orientation: landscape)",
			"(max-height: 520px)",
		].map((q) => window.matchMedia(q))

		const update = () => setViewport(readViewport())
		queries.forEach((mq) => mq.addEventListener("change", update))
		return () => queries.forEach((mq) => mq.removeEventListener("change", update))
	}, [])

	return viewport
}
