/**
 * The spacing and motion the app's own chrome shares.
 *
 * The library's tokens live in `theme.css` and reach a component as a class;
 * these are the handful the playground adds on top for its own screens —
 * the gap between the blocks on a scroll area, the gap inside one, the height
 * of a strip's specimen and the crossfade a swapped label plays. Each was a
 * literal copied into several files, and every copy was one edit away from
 * disagreeing with the rest. `tokens.test.ts` fails by file name when one is
 * written out again.
 *
 * The demos are exempt: they are published source, and a reader copying one
 * should not need a file that does not exist in their app.
 */

/** The gap between the blocks on a scroll area — a `ListGroup`, a strip, a paragraph. */
export const LIST_GAP = "gap-6";
/** `LIST_GAP` as points, for the one place that has to give the gap back in a style. */
export const LIST_GAP_POINTS = 24;
/** The gap inside a block — a heading and the group under it. */
export const SECTION_GAP = "gap-2";

/** The height of a strip's specimen box, so the theme rows share one rhythm. */
export const SPECIMEN_HEIGHT = 56;

/**
 * A label crossfade, in milliseconds.
 *
 * The exchange happens at the trough: out first, and only then the new text
 * in. Out is quicker than in, because the eye forgives a label leaving faster
 * than it forgives one arriving late. Both are opacity only, which is what
 * keeps them acceptable under Reduce Motion — nothing translates or scales.
 */
export const FADE = { out: 90, in: 140 } as const;
