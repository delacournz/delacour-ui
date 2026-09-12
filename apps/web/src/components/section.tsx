/**
 * The one content container, as a class.
 *
 * Every section on every page outside the docs opens with it — the hero, the
 * showcase, the prose sections, the compare tables, the customiser, the 404,
 * the footer — so all of them begin and end on the same two edges. Before
 * this the site alternated a 36rem column with a 72rem grid down the same
 * scroll, and a page whose left margin moves twice reads as two pages.
 *
 * `min-w-0` is load-bearing rather than defensive: `HomeLayout` renders its
 * children into a flex *column*, and a flex item's `min-width` is `auto` —
 * its min-content — so one code fence or one long path widens the whole page
 * at phone width unless every section refuses to.
 *
 * The vertical band is not part of it. A section adds its own `py-section`,
 * `pt-section-sm`, or nothing at all where it sits against another.
 */
export const PAGE_SECTION = "mx-auto w-full min-w-0 max-w-page px-6";
