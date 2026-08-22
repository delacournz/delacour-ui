import { Children, createContext, type ReactElement, type ReactNode, use, useMemo } from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import { cn } from "../../lib/cn";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import {
	BUTTON_FOREGROUND_TOKEN,
	BUTTON_ICON_SIZE,
	type ButtonSize,
	type ButtonVariant,
	buttonLabelVariants,
	buttonVariants,
} from "./button.variants";

/** How the button reacts to a press. */
export type ButtonFeedback = "scale" | "none";

type ButtonContextValue = {
	variant: ButtonVariant;
	size: ButtonSize;
	isDisabled: boolean;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);

/**
 * Reads the enclosing button's variant, size and disabled state.
 *
 * Lets a custom child style itself to match without the button having to pass
 * props down through every slot.
 */
export function useButton(): ButtonContextValue {
	const context = use(ButtonContext);
	if (!context) {
		throw new Error("useButton must be called inside a <Button>.");
	}
	return context;
}

function useButtonPart(component: string): ButtonContextValue {
	const context = use(ButtonContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Button>.`);
	}
	return context;
}

export type ButtonProps = Omit<PressableProps, "children" | "disabled" | "pressedScale" | "pressedOpacity"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	/** Square footprint for a button whose only content is an icon. */
	isIconOnly?: boolean;
	isDisabled?: boolean;
	feedback?: ButtonFeedback;
	children?: ReactNode;
};

const FEEDBACK_SCALE: Record<ButtonFeedback, number> = {
	scale: 0.97,
	none: 1,
};

/**
 * A pressable action, composed from parts rather than configured by flags.
 *
 * `variant`, `size` and `isDisabled` reach the sub-components through context,
 * so `Button.Label` picks its own text colour. That indirection is not
 * incidental: a React Native `View` does not cascade colour to a `Text`
 * descendant the way a DOM element would, so a colour set on the root is lost.
 *
 * Plain string or number children are wrapped in a `Button.Label`
 * automatically; pass the compound parts when a layout needs more control.
 *
 * Icons are composed in, not passed as props. Anything in the subtree inherits
 * the button's icon size and its variant's colour, so an `Icon` needs nothing
 * but the glyph.
 *
 * @example
 * <Button haptic="selection" onPress={next}>
 *   <Button.Label>Continue</Button.Label>
 *   <Icon icon={IconArrowRight} />
 * </Button>
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
	feedback = "scale",
	className,
	children,
	...props
}: ButtonProps): ReactElement {
	const context = useMemo<ButtonContextValue>(() => ({ variant, size, isDisabled }), [variant, size, isDisabled]);

	const content = useMemo(() => wrapTextChildren(children), [children]);

	// Icons composed into the button adopt these unless told otherwise.
	const iconDefaults = useMemo(
		() => ({ size: BUTTON_ICON_SIZE[size], color: BUTTON_FOREGROUND_TOKEN[variant] }),
		[size, variant]
	);

	return (
		<ButtonContext value={context}>
			<Pressable
				accessibilityRole="button"
				className={cn("overflow-hidden", buttonVariants({ className, isDisabled, isIconOnly, size, variant }))}
				disabled={isDisabled}
				pressedOpacity={1}
				pressedScale={FEEDBACK_SCALE[feedback]}
				{...props}
			>
				<IconDefaultsProvider value={iconDefaults}>{content}</IconDefaultsProvider>
			</Pressable>
		</ButtonContext>
	);
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
