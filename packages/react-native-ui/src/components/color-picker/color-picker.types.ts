/** The notation a picker reports its value in. */
export type ColorFormat = "hex" | "rgb" | "hsl";

/** Where the picker's surface lives: on the page, or in a sheet behind a trigger row. */
export type ColorPickerPresentation = "inline" | "sheet";

/**
 * The picker's model. `h` is 0–360 degrees; `s`, `v` and `a` are 0–1.
 *
 * Saturation and brightness rather than RGB because they are the two axes the
 * area is dragged along, and because they can hold a hue a grey has no RGB for.
 */
export type Hsva = { h: number; s: number; v: number; a: number };

/** `r`, `g` and `b` are 0–255; `a` is 0–1. */
export type Rgba = { r: number; g: number; b: number; a: number };

/** `h` is 0–360 degrees; `s`, `l` and `a` are 0–1. */
export type Hsla = { h: number; s: number; l: number; a: number };

/** The channels an assistive action or a track can step. */
export type HsvaChannel = "hue" | "saturation" | "brightness" | "alpha";
