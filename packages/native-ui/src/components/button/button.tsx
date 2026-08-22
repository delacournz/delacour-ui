import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import { cn } from "../../lib/cn";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableFeedback, type PressableProps } from "../pressable";
import { Spinner } from "../spinner";
import { type ButtonContextValue, ButtonProvider, useButtonContext } from "./button.context";
import {
	BUTTON_FOREGROUND_TOKEN,
	BUTTON_ICON_SIZE,
	type ButtonLayout,
	type ButtonSize,
	type ButtonSpinnerPlacement,
	type ButtonVariant,
	buttonLabelVariants,
	buttonVariants,
	resolveButtonLayout,
} from "./button.variants";

/**
 * How the button reacts to a press.
 *
 * A deliberate subset of the pressable vocabulary: press feedback on a button
 * is the spring scale and nothing else. Narrowed from `PressableFeedback`
 * rather than spelled out again, so a rename there cannot leave this behind.
 */
export type ButtonFeedback = Extract<PressableFeedback, "scale" | "none">;

function useButtonPart(component: string): ButtonContextValue {
	const context = useButtonContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Button>.`);
	}
	return context;
}

export type ButtonProps = Omit<PressableProps, "busy" | "children" | "disabled" | "pressedScale" | "pressedOpacity"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	/** Square footprint for a button whose only content is an icon. */
	isIconOnly?: boolean;
	isDisabled?: boolean;
	/** Work is in flight: a spinner is composed in and presses are blocked. */
	isLoading?: boolean;
	/** Where the spinner sits. `only` replaces the content and squares the button. */
	spinnerPlacement?: ButtonSpinnerPlacement;
	/** Fade the button while loading, the way `isDisabled` does. Off by default. */
	isDimmedWhileLoading?: boolean;
	feedback?: ButtonFeedback;
	children?: ReactNode;
};

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
 * `isLoading` blocks presses and announces the button as busy, but does not dim
 * it: a spinner already says the press landed. `isDimmedWhileLoading` opts into
 * the faded treatment.
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
export function Button({
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

	// Icons and spinners composed into the button adopt these unless told otherwise.
	const iconDefaults = useMemo(
		() => ({ size: BUTTON_ICON_SIZE[size], color: BUTTON_FOREGROUND_TOKEN[variant] }),
		[size, variant]
	);

	const label = accessibilityLabel ?? (layout.isSpinnerOnly ? textOf(children) : undefined);

	return (
		<ButtonProvider value={context}>
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				busy={isLoading}
				className={cn(
					"overflow-hidden",
					buttonVariants({
						className,
						isDimmedWhileLoading,
						isDisabled,
						isIconOnly: layout.isIconOnly,
						isLoading,
						size,
						variant,
					})
				)}
				disabled={isDisabled}
				feedback={feedback}
				{...props}
			>
				<IconDefaultsProvider value={iconDefaults}>{content}</IconDefaultsProvider>
			</Pressable>
		</ButtonProvider>
	);
}

/**
 * Composes the spinner around the button's children.
 *
 * `only` drops the children: the button has already collapsed to a square, so a
 * label would have nowhere to sit. Every other placement leaves the children
 * untouched and lets the root's own `gap` space the spinner off them, exactly
 * as it does for a composed `Icon`.
 *
 * The spinner is emitted bare — it reads its size and colour from the button's
 * context, so nothing is passed here.
 */
function composeContent(children: ReactNode, layout: ButtonLayout): ReactNode {
	if (layout.isSpinnerOnly) return <Spinner />;

	const wrapped = wrapTextChildren(children);

	if (layout.spinnerSide === "start") {
		return (
			<>
				<Spinner />
				{wrapped}
			</>
		);
	}

	if (layout.spinnerSide === "end") {
		return (
			<>
				{wrapped}
				<Spinner />
			</>
		);
	}

	return wrapped;
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

export type ButtonLabelProps = TextProps & { className?: string };

function ButtonLabel({ className, ...props }: ButtonLabelProps): ReactElement {
	const { variant, size } = useButtonPart("Button.Label");
	return <Text className={buttonLabelVariants({ className, size, variant })} {...props} />;
}

export type ButtonSlotProps = ViewProps & { className?: string };

function ButtonStartContent({ className, ...props }: ButtonSlotProps): ReactElement {
	return <View className={cn("items-center justify-center", className)} {...props} />;
}

function ButtonEndContent({ className, ...props }: ButtonSlotProps): ReactElement {
	return <View className={cn("items-center justify-center", className)} {...props} />;
}

Button.Label = ButtonLabel;
Button.StartContent = ButtonStartContent;
Button.EndContent = ButtonEndContent;
