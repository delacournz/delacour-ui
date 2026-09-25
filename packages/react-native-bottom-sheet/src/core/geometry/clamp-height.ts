/**
 * A height held within `[closedHeight, maxHeight]`. `NaN` and an inverted
 * range both collapse to the closed height: one bad frame written into `base`
 * would otherwise freeze the sheet with nothing on screen to say why.
 */
export function clampHeight(height: number, closedHeight: number, maxHeight: number): number {
	"worklet";
	if (Number.isNaN(height) || maxHeight < closedHeight) return closedHeight;
	if (height < closedHeight) return closedHeight;
	if (height > maxHeight) return maxHeight;
	return height;
}
