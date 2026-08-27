import {
	DELACOUR_BOTTOM_CENTRE_Y,
	DELACOUR_CANVAS,
	DELACOUR_CARD_COLOUR,
	DELACOUR_CENTRE_X,
	DELACOUR_CORNER_RATIO,
	DELACOUR_RECT_X,
	DELACOUR_SQUARE,
	DELACOUR_STROKE,
	DELACOUR_STROKE_COLOUR,
	DELACOUR_TOP_CENTRE_Y,
	delacourRectY,
} from "@delacour/brand";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

export type DelacourIconProps = {
	/** Edge length in pixels. The icon is square. */
	size?: number;
	className?: string;
};

/**
 * The Delacour app icon, inline: the `#18181B` card with the amber mark on it.
 *
 * Drawn from `@delacour/brand`'s constants rather than pointing an `<img>` at
 * `/favicon.svg`, so a logo in the nav bar cannot lag the favicon by a deploy —
 * the raster set and this element rasterise from the same numbers, and
 * `packages/brand`'s own test is what keeps those honest.
 *
 * The corners are rounded here because nothing else rounds them. On a home
 * screen iOS and Android apply their own mask and the art stays square; in a
 * page it is just a square unless the radius is in the art.
 *
 * The colours are brand literals, not theme tokens: this is the icon, and it
 * looks the same in both themes.
 *
 * @example
 * <DelacourIcon size={20} />
 */
export function DelacourIcon({ className, size = 24 }: DelacourIconProps): ReactElement {
	const radius = DELACOUR_CANVAS * DELACOUR_CORNER_RATIO;

	return (
		<svg
			aria-label="Delacour"
			className={cn("shrink-0", className)}
			height={size}
			role="img"
			viewBox={`0 0 ${DELACOUR_CANVAS} ${DELACOUR_CANVAS}`}
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect fill={DELACOUR_CARD_COLOUR} height={DELACOUR_CANVAS} rx={radius} width={DELACOUR_CANVAS} />
			<g
				fill="none"
				stroke={DELACOUR_STROKE_COLOUR}
				strokeLinejoin="miter"
				strokeMiterlimit={10}
				strokeWidth={DELACOUR_STROKE}
			>
				{[DELACOUR_TOP_CENTRE_Y, DELACOUR_BOTTOM_CENTRE_Y].map((centreY) => (
					<rect
						height={DELACOUR_SQUARE}
						key={centreY}
						transform={`rotate(45 ${DELACOUR_CENTRE_X} ${centreY})`}
						width={DELACOUR_SQUARE}
						x={DELACOUR_RECT_X}
						y={delacourRectY(centreY)}
					/>
				))}
			</g>
		</svg>
	);
}
