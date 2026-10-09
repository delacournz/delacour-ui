import { Children, type ReactElement, type ReactNode, use, useEffect, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { TextClassProvider } from "../text/text.context";
import { type FabContextValue, FabProvider } from "./fab.context";
import type { FabSharedProps } from "./fab.types";
import {
	FAB_DEFAULT_OFFSET,
	FAB_FOREGROUND_TOKEN,
	type FabPlacement,
	fabVariants,
	resolveFabPlacementStyle,
} from "./fab.variants";
import { FabAction } from "./fab-action";
import { FabGroup } from "./fab-group";
import { FabLabel } from "./fab-label";

export type FabProps = Omit<PressableProps, "busy" | "children" | "disabled" | "haptic"> &
	FabSharedProps & {
		/** A stadium holding a `Fab.Label` beside the icon, rather than a circle. */
		isExtended?: boolean;
		/**
		 * Pins the fab to the bottom of its nearest positioned ancestor. Omitted,
		 * the fab sits in flow like any other view.
		 */
		placement?: FabPlacement;
		/** Required in practice for a round fab — there is no text to read. */
		accessibilityLabel?: string;
		children?: ReactNode;
	};

function FabRoot({
	size = "md",
	variant = "primary",
	isExtended = false,
	placement,
	offset = FAB_DEFAULT_OFFSET,
	isSafeAreaAware = true,
	isDisabled = false,
	haptic = false,
	feedback = "scale",
	accessibilityLabel,
	className,
	children,
	...props
}: FabProps): ReactElement {
	const insets = use(SafeAreaInsetsContext);

	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		if (!isExtended && !accessibilityLabel) {
			console.warn(
				"Fab: a round fab has no text for a screen reader to read. Pass `accessibilityLabel`, or `isExtended` with a `Fab.Label`."
			);
		}
	}, [isExtended, accessibilityLabel]);

	const context = useMemo<FabContextValue>(
		() => ({ size, variant, isExtended, isDisabled }),
		[size, variant, isExtended, isDisabled]
	);

	const slots = fabVariants({ size, variant, isExtended, isDisabled });
	const iconClassName = slots.icon();
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: FAB_FOREGROUND_TOKEN[variant] }),
		[iconClassName, variant]
	);

	const button = (
		<FabProvider value={context}>
			<Pressable
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="button"
				className={slots.root({ className })}
				disabled={isDisabled}
				feedback={feedback}
				haptic={haptic}
				{...props}
			>
				<IconDefaultsProvider value={iconDefaults}>
					<TextClassProvider value={slots.label()}>{wrapTextChildren(children)}</TextClassProvider>
				</IconDefaultsProvider>
			</Pressable>
		</FabProvider>
	);

	if (!placement) return button;

	const style = resolveFabPlacementStyle({
		placement,
		offset,
		insetBottom: isSafeAreaAware ? (insets?.bottom ?? 0) : 0,
	});

	return (
		<View pointerEvents="box-none" style={style}>
			{button}
		</View>
	);
}

/**
 * Wraps bare text children in a `Fab.Label` — React Native cannot render a
 * string outside a `<Text>`.
 */
function wrapTextChildren(children: ReactNode): ReactNode {
	return Children.map(children, (child) =>
		typeof child === "string" || typeof child === "number" ? <FabLabel>{child}</FabLabel> : child
	);
}

/**
 * One primary action floating over the screen it belongs to — "New note" over
 * a list.
 *
 * The icon is composed, the way a `Button`'s is: the fab publishes its icon
 * size and its variant's foreground through `IconDefaultsProvider`, so a bare
 * `<Icon icon={IconPlusLarge} />` comes out right with nothing said.
 *
 * `placement` pins it to the bottom of its nearest positioned ancestor, lifted
 * by `offset` and, unless told otherwise, the bottom safe-area inset. Omitted,
 * the fab sits in flow. Pad the bottom of a list it floats over by the fab's
 * height plus its offset, or the last row hides behind it.
 *
 * `Fab.Group` turns the trigger into a dial of related actions that unfold
 * above it.
 *
 * @example
 * <Fab accessibilityLabel="New note" onPress={compose} placement="bottom-end">
 *   <Icon icon={IconPlusLarge} />
 * </Fab>
 *
 * @example
 * <Fab isExtended onPress={write} placement="bottom-end">
 *   <Icon icon={IconPencil} />
 *   <Fab.Label>Write</Fab.Label>
 * </Fab>
 *
 * @example
 * <Fab.Group accessibilityLabel="Add something" icon={IconPlusLarge}>
 *   <Fab.Action icon={IconImages} label="Photo" onPress={addPhoto} />
 *   <Fab.Action icon={IconTrashCan} isDestructive label="Empty drafts" onPress={empty} />
 * </Fab.Group>
 */
export const Fab = Object.assign(FabRoot, {
	/** An extended fab's text, coloured for the fab's variant. */
	Label: FabLabel,
	/** A trigger that unfolds a dial of related actions, over a scrim. */
	Group: FabGroup,
	/** One action in a `Fab.Group`'s dial: a small round button and a label chip. */
	Action: FabAction,
	displayName: "DelacourUI.Fab",
});
