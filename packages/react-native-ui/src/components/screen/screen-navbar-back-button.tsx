import type { ReactElement } from "react";
import { useLabels } from "../../hooks/use-labels";
import { useMinimumHitSlop } from "../../hooks/use-minimum-hit-target";
import { IconChevronLeft, IconCrossSmall } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useScreenContext } from "./screen.context";
import { resolveBackButtonHitTarget, screenVariants } from "./screen.variants";

/** Which affordance the control reads as: going back, or closing a modal. */
export const SCREEN_BACK_BUTTON_GLYPHS = ["chevron", "close"] as const;

export type ScreenBackButtonGlyph = (typeof SCREEN_BACK_BUTTON_GLYPHS)[number];

export type ScreenNavbarBackButtonProps = Omit<PressableProps, "onPress"> & {
	/** `chevron` for a push, `close` for a modal. */
	glyph?: ScreenBackButtonGlyph;
	/**
	 * What going back does. Required: this library takes no navigation
	 * dependency, so the screen wires its own router — `() => router.back()`.
	 */
	onPress: () => void;
	/**
	 * Runs before `onPress`. Returning `false` cancels the navigation, for an
	 * unsaved-changes prompt.
	 */
	onBeforeBack?: () => boolean;
};

const GLYPH: Record<ScreenBackButtonGlyph, typeof IconChevronLeft> = {
	chevron: IconChevronLeft,
	close: IconCrossSmall,
};

/**
 * The navbar's leading control. Its name is `accessibilityLabel`, else `labels.back` from the
 * enclosing screen.
 *
 * Takes an `onPress` rather than calling a router itself. `react-native-ui` has no
 * navigation dependency and should not gain one for a chevron — the screen
 * already knows how it was pushed, and an app on a different router still gets
 * to use this.
 *
 * Children render beside the glyph, so a title can share the control's tap
 * target — which is what makes the whole "‹ Settings" row pressable rather than
 * just the chevron.
 *
 * @example
 * <Screen.Navbar.BackButton onPress={() => router.back()}>
 *   <Screen.Navbar.Title>Settings</Screen.Navbar.Title>
 * </Screen.Navbar.BackButton>
 */
export function ScreenNavbarBackButton({
	glyph = "chevron",
	onPress,
	onBeforeBack,
	className,
	children,
	accessibilityLabel,
	hitSlop,
	...props
}: ScreenNavbarBackButtonProps): ReactElement {
	const standalone = useLabels("screen");
	const labels = useScreenContext()?.labels ?? standalone;
	const slop = useMinimumHitSlop(resolveBackButtonHitTarget());

	function handlePress(): void {
		if (onBeforeBack && !onBeforeBack()) return;
		onPress();
	}

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? labels.back}
			accessibilityRole="button"
			className={screenVariants().backButton({ className })}
			feedback="fade"
			hitSlop={hitSlop ?? slop}
			onPress={handlePress}
			{...props}
		>
			<IconDefaultsProvider value={{ className: "size-icon-lg", color: "foreground" }}>
				<Icon icon={GLYPH[glyph]} />
				{children}
			</IconDefaultsProvider>
		</Pressable>
	);
}
ScreenNavbarBackButton.displayName = "DelacourUI.Screen.Navbar.BackButton";
