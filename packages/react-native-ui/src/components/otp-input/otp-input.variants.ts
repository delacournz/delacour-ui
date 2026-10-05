import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { InputSize, InputVariant } from "../input/input.variants";

export const OTP_DEFAULT_SIZE: InputSize = "md";
export const OTP_DEFAULT_VARIANT: InputVariant = "primary";

/**
 * The caret's blink: visible for `holdMs`, a `fadeMs` fade out, hidden for `holdMs`, a fade back.
 * Close to the platform caret's own rhythm, so the drawn caret does not read as a different thing
 * from the one in every other field on the screen.
 */
export const OTP_CARET_BLINK = { holdMs: 450, fadeMs: 100 } as const;

/**
 * Styling for every part of a one-time-code field.
 *
 * A cell is a lone `Input` box cut square: the same `border-input bg-card` / `bg-secondary` per
 * variant, the same `--spacing-input-*` edge and `--text-input-*` character, the same corner ramp
 * (`rounded-md` at `sm`, `rounded-lg` above) and the same ring on focus. `otp-input.variants.test.ts`
 * pins the fill and border against `inputVariants` itself, so a retuned field drags the cells along.
 *
 * A cell is `w-input-*` **and** `shrink`. Twelve cells at `md` are wider than a phone; shrinking
 * lets the row fit the space it is given, and a row that fits is worth more than a square corner
 * case. The row never wraps — a code broken over two lines reads as two codes.
 *
 * `isDisabled` fades the root once rather than each cell, so a separator fades with the cells.
 *
 * Free of React Native imports so it stays unit-testable — see AGENTS.md.
 */
export const otpInputVariants = tv({
	slots: {
		/** The positioning box: the cell row with the hidden field laid over it. */
		root: "relative self-start",
		/** The visible row of groups and separators. Hidden from touch and from assistive technology. */
		row: "shrink flex-row items-center",
		/**
		 * The one real `TextInput`, stretched over the row so a tap anywhere lands on it. Its text,
		 * caret and selection are transparent rather than the view being `opacity-0`, which some
		 * iOS versions treat as hidden and stop offering a code from Messages for.
		 */
		field: "absolute inset-0 bg-transparent p-0 text-transparent",
		group: "shrink flex-row items-center",
		slot: "shrink items-center justify-center overflow-hidden border",
		char: "text-center font-sans text-foreground",
		placeholder: "text-center font-sans text-muted-foreground",
		/** A short rule between groups. Not keyed to the type scale: it marks a gap, not a glyph. */
		separator: "h-px w-3 rounded-full bg-border",
		caret: "w-px rounded-full bg-primary",
	},
	variants: {
		variant: {
			primary: { slot: "border-input bg-card" },
			secondary: { slot: "border-transparent bg-secondary" },
		},
		size: {
			sm: {
				row: "gap-1.5",
				group: "gap-1.5",
				slot: "h-input-sm w-input-sm rounded-md",
				char: "text-input-sm",
				placeholder: "text-input-sm",
				caret: "h-4",
			},
			md: {
				row: "gap-2",
				group: "gap-2",
				slot: "h-input-md w-input-md rounded-lg",
				char: "text-input-md",
				placeholder: "text-input-md",
				caret: "h-5",
			},
			lg: {
				row: "gap-2.5",
				group: "gap-2.5",
				slot: "h-input-lg w-input-lg rounded-lg",
				char: "text-input-lg",
				placeholder: "text-input-lg",
				caret: "h-6",
			},
		},
		// The empty `false` branches are load-bearing typing — `tv` types a map with only `true` as
		// `true` rather than `boolean`. See button.variants.ts.
		isActive: { true: { slot: "border-ring" }, false: {} },
		isInvalid: { true: { slot: "border-destructive", caret: "bg-destructive" }, false: {} },
		isFilled: { true: {}, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		// Focus is transient and invalid is reported, so invalid outranks it — the rule `Input`
		// follows, for the same reason: a cell that went grey the moment it was tapped would drop
		// the only signal that the code is wrong, exactly while it is being retyped.
		{ isActive: true, isInvalid: true, class: { slot: "border-destructive" } },
	],
	defaultVariants: {
		variant: OTP_DEFAULT_VARIANT,
		size: OTP_DEFAULT_SIZE,
		isActive: false,
		isInvalid: false,
		isFilled: false,
		isDisabled: false,
	},
});

export type OtpSlotClasses = { slot: string; char: string; placeholder: string; caret: string };

/**
 * The four classes one cell draws with. A caller's `className` lands on the cell's box and wins.
 *
 * Pure, so the whole matrix is reachable from `bun test`.
 */
export function resolveOtpSlotClasses({
	className,
	...state
}: {
	variant?: InputVariant;
	size?: InputSize;
	isActive?: boolean;
	isInvalid?: boolean;
	isFilled?: boolean;
	className?: string;
}): OtpSlotClasses {
	const slots = otpInputVariants(state);
	return {
		caret: slots.caret(),
		char: slots.char(),
		placeholder: slots.placeholder(),
		slot: slots.slot({ className }),
	};
}

export type OtpInputVariantProps = VariantProps<typeof otpInputVariants>;
