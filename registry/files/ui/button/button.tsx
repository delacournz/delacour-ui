import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { Icon, IconDefaultsProvider } from "@registry/ui/icon";
import { Pressable, type PressableProps } from "@registry/ui/pressable";
import { Spinner } from "@registry/ui/spinner";
import { TextClassProvider } from "@registry/ui/text/text.context";
import { type ButtonContextValue, ButtonProvider } from "./button.context";
import {
	BUTTON_FOREGROUND_TOKEN,
	type ButtonLayout,
	type ButtonSize,
	type ButtonSpinnerPlacement,
	type ButtonVariant,
	buttonVariants,
	resolveButtonLayout,
	resolveSpinnerSwapIndex,
} from "./button.variants";
import { ButtonEndContent } from "./button-end-content";
import { ButtonLabel } from "./button-label";
import { ButtonStartContent } from "./button-start-content";

export type ButtonProps = Omit<PressableProps, "busy" | "children" | "disabled" | "pressedOpacity" | "pressedScale"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	/** Square footprint for a button whose only content is an icon. */
	isIconOnly?: boolean;
	isDisabled?: boolean;
	/** Work is in flight: a spinner is composed in and presses are blocked. */
	isLoading?: boolean;
	/** Where the spinner sits. `only` replaces the content, keeping the footprint. */
	spinnerPlacement?: ButtonSpinnerPlacement;
	/** Fade the button while loading, the way `isDisabled` does. Off by default. */
	isDimmedWhileLoading?: boolean;
	children?: ReactNode;
};

function ButtonRoot({
	variant = "primary",
	size = "md",
	isIconOnly = false,
	isDisabled = false,
	isLoading = false,
	isDimmedWhileLoading = false,
	spinnerPlacement = "start",
	feedback = "scale",
	accessibilityLabel,
	className,
	children,
	...props
}: ButtonProps): ReactElement {
	const context = useMemo<ButtonContextValue>(
		() => ({ variant, size, isDisabled, isLoading }),
		[variant, size, isDisabled, isLoading]
	);

	const layout = useMemo(
		() => resolveButtonLayout({ isIconOnly, isLoading, spinnerPlacement }),
		[isIconOnly, isLoading, spinnerPlacement]
	);

	const content = useMemo(() => composeContent(children, layout), [children, layout]);

	const slots = buttonVariants({
		isDimmedWhileLoading,
		isDisabled,
		isIconOnly: layout.isIconOnly,
		isLoading,
		size,
		variant,
	});

	// Icons and spinners composed into the button adopt these unless told otherwise.
	const iconClassName = slots.icon();
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: BUTTON_FOREGROUND_TOKEN[variant] }),
		[iconClassName, variant]
	);

	const label = accessibilityLabel ?? (layout.isSpinnerOnly ? textOf(children) : undefined);

	return (
		<ButtonProvider value={context}>
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				busy={isLoading}
				className={slots.root({ className })}
				disabled={isDisabled}
				feedback={feedback}
				{...props}
			>
				<IconDefaultsProvider value={iconDefaults}>
					<TextClassProvider value={slots.label()}>{content}</TextClassProvider>
				</IconDefaultsProvider>
			</Pressable>
		</ButtonProvider>
	);
}

/**
 * Composes the spinner into the button's children.
 *
 * A loading button **replaces** its icon rather than showing both. Adding a
 * spinner alongside would push the label sideways the moment work started and
 * pull it back when it finished; swapping costs no layout at all, because the
 * spinner and the icon are drawn at the same `size-icon-*` token — the button
 * publishes one class and both read it.
 *
 * `start` takes the first icon and `end` the last, so the spinner lands on the
 * side the caller asked for even when the button holds an icon at both ends.
 * With no icon to take, the spinner is inserted instead and the root's own
 * `gap` spaces it off the label.
 *
 * `only` drops the children: the button has already collapsed to a square, so a
 * label would have nowhere to sit.
 *
 * The spinner is emitted bare — it reads its size and colour from the button's
 * context, so nothing is passed here.
 */
function composeContent(children: ReactNode, layout: ButtonLayout): ReactNode {
	if (layout.isSpinnerOnly) return <Spinner />;
	if (layout.spinnerSide === null) return wrapTextChildren(children);

	const items = Children.toArray(wrapTextChildren(children));
	const swapAt = resolveSpinnerSwapIndex(items.map(isIcon), layout.spinnerSide);

	if (swapAt !== null) {
		return items.map((child, index) => (index === swapAt ? <Spinner key="spinner" /> : child));
	}

	return layout.spinnerSide === "start" ? (
		<>
			<Spinner />
			{items}
		</>
	) : (
		<>
			{items}
			<Spinner />
		</>
	);
}

/**
 * Whether a child is an `Icon` the spinner can stand in for.
 *
 * Only a bare `Icon` qualifies. A `Button.StartContent` wraps arbitrary content
 * whose height the button does not know, so replacing one could resize the
 * button — the thing this swap exists to avoid.
 */
function isIcon(child: ReactNode): boolean {
	return isValidElement(child) && child.type === Icon;
}

/**
 * The button's own text, for use as an accessibility label.
 *
 * `spinnerPlacement="only"` takes the label out of the tree, so the name a
 * screen reader was reading has to be carried onto the root instead. Reaches
 * one level into a `Button.Label`; anything more deeply nested needs an
 * explicit `accessibilityLabel`.
 */
function textOf(children: ReactNode): string | undefined {
	const parts: string[] = [];

	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			parts.push(String(child));
			continue;
		}
		if (!isValidElement(child) || child.type !== ButtonLabel) continue;
		const nested = (child.props as { children?: ReactNode }).children;
		if (typeof nested === "string" || typeof nested === "number") parts.push(String(nested));
	}

	return parts.length > 0 ? parts.join("") : undefined;
}

/**
 * Wraps bare text children in a `Button.Label`.
 *
 * React Native cannot render a string outside a `<Text>`, so `<Button>Save</Button>`
 * would otherwise crash. Consecutive strings and numbers are collected into a
 * single label rather than one each — `Row {index}` is one piece of text, and
 * wrapping the parts separately would space them apart by the button's gap.
 */
function wrapTextChildren(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(<ButtonLabel key={`label-${output.length}`}>{run.join("")}</ButtonLabel>);
		run = [];
	};

	for (const child of items) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		output.push(child);
	}
	flushRun();

	return output;
}

/**
 * A pressable action, composed from parts rather than configured by flags.
 *
 * `variant`, `size` and the button's state reach the sub-components through
 * context, so `Button.Label` picks its own text colour. That indirection is not
 * incidental: a React Native `View` does not cascade colour to a `Text`
 * descendant the way a DOM element would, so a colour set on the root is lost.
 *
 * Plain string or number children are wrapped in a `Button.Label`
 * automatically; pass the compound parts when a layout needs more control.
 *
 * Icons are composed in, not passed as props. Anything in the subtree inherits
 * the button's icon size and its variant's colour, so an `Icon` needs nothing
 * but the glyph — and a `Spinner` needs nothing at all.
 *
 * Text works the same way: the button publishes its label treatment through a
 * `TextClassProvider`, so a bare `<Text>` composed in comes out at the label's
 * colour and type scale without being told to.
 *
 * `isLoading` blocks presses and announces the button as busy, but does not dim
 * it: a spinner already says the press landed. `isDimmedWhileLoading` opts into
 * the faded treatment.
 *
 * A button is a `Pressable`, so `feedback`, `haptic` and the rest are inherited
 * rather than restated here. Only the default differs: `scale`, the spring the
 * rest of the library's controls press with.
 *
 * @example
 * <Button haptic="selection" onPress={next}>
 *   <Button.Label>Continue</Button.Label>
 *   <Icon icon={IconArrowRight} />
 * </Button>
 *
 * @example
 * <Button isLoading={isSaving} onPress={save}>Save</Button>
 *
 * @example
 * <Button accessibilityLabel="Favourite" isIconOnly variant="ghost">
 *   <Icon icon={IconHeart} />
 * </Button>
 */
export const Button = Object.assign(ButtonRoot, {
	/** The button's text. Picks its colour and type scale from the button's variant and size. */
	Label: ButtonLabel,
	/** A centred wrapper for leading content that is not an `Icon`. */
	StartContent: ButtonStartContent,
	/** A centred wrapper for trailing content that is not an `Icon`. */
	EndContent: ButtonEndContent,
	displayName: "DelacourUI.Button",
});
