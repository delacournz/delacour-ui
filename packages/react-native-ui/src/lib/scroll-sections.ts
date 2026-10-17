/** A section of a scrolled screen: its id and the top of its box in content coordinates. */
export type SectionOffset = { id: string; y: number };

/**
 * The section the reader is in: the last one whose top has crossed the reading line, a fixed
 * distance below the top of the viewport. Above the first section's top the first section is
 * still the answer — a screen with a header before its first section is reading that section.
 *
 * Sections are read in offset order, not registration order: `onLayout` reports in whatever
 * order the native views measure, and a section mounted late would otherwise win the tie.
 */
export function resolveActiveSection(
	sections: readonly SectionOffset[],
	scrollY: number,
	readingLine: number
): string | undefined {
	"worklet";
	if (sections.length === 0) return undefined;
	const line = scrollY + readingLine;
	let first: SectionOffset | undefined;
	let active: SectionOffset | undefined;
	for (const section of sections) {
		if (first === undefined || section.y < first.y) first = section;
		if (section.y <= line && (active === undefined || section.y >= active.y)) active = section;
	}
	return (active ?? first)?.id;
}

/**
 * How far down the content the reader is, 0 to 1. Overscroll clamps at both ends, and a screen
 * whose content fits reads as finished — there is nothing left to read.
 */
export function resolveScrollProgress(scrollY: number, contentHeight: number, viewportHeight: number): number {
	"worklet";
	const range = contentHeight - viewportHeight;
	if (range <= 0) return 1;
	return Math.min(1, Math.max(0, scrollY / range));
}

/** The scroll offset that puts a section's top on the reading line, never above the top. */
export function resolveSectionScrollTarget(y: number, readingLine: number): number {
	"worklet";
	return Math.max(0, y - readingLine);
}
