export type InputInsideSheetInput = {
	/** The focused input's top, in window coordinates. */
	inputY: number;
	inputHeight: number;
	/** The sheet's top edge, in window coordinates — `containerTop + position`. */
	sheetTop: number;
	/** The bottom edge of the sheet's container, in window coordinates. */
	containerBottom: number;
};

/**
 * Whether a focused input lies inside the sheet, which is the geometry
 * fallback for keyboard ownership under `keyboardScope: "inside"`.
 *
 * Any vertical overlap counts: an input the list scrolled half under the
 * sheet's top edge is still the sheet's input. An unmeasured frame on either
 * side claims nothing.
 */
export function isInputInsideSheet(input: InputInsideSheetInput): boolean {
	"worklet";
	if (!(input.inputHeight > 0) || input.inputY < 0) return false;
	if (input.sheetTop < 0 || input.containerBottom <= 0) return false;
	const inputBottom = input.inputY + input.inputHeight;
	return inputBottom > input.sheetTop && input.inputY < input.containerBottom;
}
