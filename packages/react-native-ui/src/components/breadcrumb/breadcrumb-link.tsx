import { Children, type ReactElement, type ReactNode } from "react";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useBreadcrumbPart } from "./breadcrumb.context";
import { BREADCRUMB_LINK_HIT_SLOP, BREADCRUMB_TEXT_SIZE, breadcrumbVariants } from "./breadcrumb.variants";
import { BreadcrumbGlyph } from "./breadcrumb-glyph";

export type BreadcrumbLinkProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled"> & {
	children: ReactNode;
	/** The link cannot be pressed, and fades. */
	isDisabled?: boolean;
	/** Classes for the label `Text` a string child is wrapped in. */
	textClassName?: string;
};

/**
 * A crumb for a level above the current page — pressing it goes back there.
 *
 * Takes an `onPress`, never a route: the library has no navigation dependency.
 * Bare text is wrapped in a muted `Text` at the breadcrumb's size; an `Icon`
 * beside it inherits the glyph size and colour.
 *
 * Announced as a link, named by its text. `fade` feedback rather than a scale
 * — a spring on a word in a row of words reads as a jitter — and no underline,
 * which is a pointer affordance. `hitSlop` lifts the one-line target to 44
 * points; both are ordinary props a caller can override.
 */
export function BreadcrumbLink({
	children,
	className,
	textClassName,
	isDisabled = false,
	feedback = "fade",
	hitSlop,
	...props
}: BreadcrumbLinkProps): ReactElement {
	const { size } = useBreadcrumbPart("Breadcrumb.Link");
	const slots = breadcrumbVariants({ isDisabled, size });

	return (
		<Pressable
			accessibilityRole="link"
			className={slots.link({ className })}
			disabled={isDisabled}
			feedback={feedback}
			hitSlop={hitSlop ?? BREADCRUMB_LINK_HIT_SLOP[size]}
			{...props}
		>
			<BreadcrumbGlyph size={size}>
				{Children.map(children, (child) =>
					typeof child === "string" || typeof child === "number" ? (
						<Text className={slots.linkLabel({ className: textClassName })} size={BREADCRUMB_TEXT_SIZE[size]}>
							{child}
						</Text>
					) : (
						child
					)
				)}
			</BreadcrumbGlyph>
		</Pressable>
	);
}
BreadcrumbLink.displayName = "DelacourUI.Breadcrumb.Link";
