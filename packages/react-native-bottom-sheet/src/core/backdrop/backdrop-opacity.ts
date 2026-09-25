/**
 * The overlay's opacity at an index: `0` up to `disappearsOn`, rising
 * linearly to `opacity` at `appearsOn`, and a plateau above — a higher detent
 * is no darker. Fed the keyboard-free index, so a keyboard lift never dims
 * the app behind the sheet.
 *
 * `appearsOn ≤ disappearsOn` is a step at `appearsOn` rather than a division
 * by zero.
 */
export function backdropOpacity(index: number, disappearsOn: number, appearsOn: number, opacity: number): number {
	"worklet";
	if (index >= appearsOn) return opacity;
	if (index <= disappearsOn) return 0;
	return ((index - disappearsOn) / (appearsOn - disappearsOn)) * opacity;
}

/** Whether the overlay should take taps — anywhere above the index it disappears at. */
export function backdropInteractive(index: number, disappearsOn: number): boolean {
	"worklet";
	return index > disappearsOn;
}
