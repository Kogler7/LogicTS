export function dropSurplus(src: number | null, unit: number = 1) {
	if (src === null) return null;
	return Math.floor(src * unit) / unit;
}