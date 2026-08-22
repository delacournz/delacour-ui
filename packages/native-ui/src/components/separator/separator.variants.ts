import { tv, type VariantProps } from "tailwind-variants";

export const SEPARATOR_ORIENTATIONS = ["horizontal", "vertical"] as const;

export type SeparatorOrientation = (typeof SEPARATOR_ORIENTATIONS)[number];

/**
 * Styling for a separator.
 *
 * The line is a filled box rather than a border, so a caller can inset it with
 * a plain `mx-*` / `my-*` without fighting a border's own box model — which is
 * how `ListGroup` positions the dividers it inserts between its rows.
 *
 * The long axis is `self-stretch`, never `w-full` / `h-full`. Yoga resolves a
 * percentage length against the parent's content box and then adds the margins
 * on top, so an inset `w-full` line starts 16pt in and runs 16pt past the far
 * edge — a gap down one side and none down the other. Stretching subtracts the
 * margins instead, which is what an inset divider actually needs.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const separatorVariants = tv({
	base: "self-stretch bg-border",
	variants: {
		orientation: {
			horizontal: "h-px",
			vertical: "w-px",
		},
	},
	defaultVariants: {
		orientation: "horizontal",
	},
});

export type SeparatorVariantProps = VariantProps<typeof separatorVariants>;
