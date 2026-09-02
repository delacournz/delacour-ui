/**
 * The opacity one slice draws at, given which slice is selected.
 *
 * With no selection every slice draws at `opacity`. With one, the selected
 * slice keeps `opacity` and every other slice draws at `opacity × dim` — a
 * selection that changed nothing on screen would look like a tap that missed.
 * `dim` of `1` turns the effect off without needing a second code path.
 */
export function sliceOpacity(index: number, selectedIndex: number | null, opacity: number, dim: number): number {
	if (selectedIndex === null || selectedIndex === index) return opacity;
	return opacity * dim;
}
