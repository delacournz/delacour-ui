import type { DesignSystemConfig } from "@delacour/design-system/config";
import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { type ReactElement, type ReactNode, useCallback } from "react";
import { useWindowDimensions, View } from "react-native";
import { setAxis } from "@/design-system/store";

/**
 * The most of the window a sheet's rows may take before they scroll.
 *
 * A cap on the content the sheet sizes itself to, not a snap point: Radius has
 * five rows and opens exactly that tall, Font has twenty-nine and opens at the
 * cap with the rest scrolling inside it. The same fraction `DemoIndexSheet`
 * uses, duplicated there rather than shared, because the two sheets size
 * different content and are meant to drift apart.
 */
const MAX_FRACTION = 0.85;

/** The fill that marks the option currently applied. */
export const AXIS_SELECTED_ROW_CLASS = "rounded-lg bg-secondary";

/** What `/theme` hands every sheet, and the whole of what a sheet is told. */
export type AxisSheetControlProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

export type AxisSheetProps = AxisSheetControlProps & {
	title: string;
	description?: string;
	children: ReactNode;
};

/**
 * The shell every axis sheet wears: a title, and its options scrolling under it.
 *
 * One sheet per axis, all of them siblings on `/theme` — never nested. Two
 * `BottomSheet`s inside one another stack two scrims and two gesture handlers
 * over the same content, and the inner one's dismissal races the outer's, which
 * is what the customizer's old pane swap existed to avoid. A screen behind the
 * sheets removes the reason for the swap entirely.
 *
 * **Sized to its own content, capped.** The scroll view reports its content
 * size and that is the sheet's one detent: Radius's five rows make a short
 * sheet, Font's twenty-nine make one at `maxDynamicContentSize` that scrolls
 * inside the cap. The engine counts the handle and the safe-area band itself,
 * so nothing here measures a row or budgets for the home indicator — the
 * numbers the previous sheet computed for its snap point are gone with the
 * reason for them.
 *
 * The title block scrolls with the rows rather than sitting above them. A
 * sibling above the scroll view would be height the content measurement never
 * sees, and the last rows would land under the fold by exactly that much.
 *
 * Children need no gutter of their own — the scroll view's content container is
 * already `gap-4 px-screen-gutter pt-2`.
 */
export function AxisSheet({ title, description, isOpen, onOpenChange, children }: AxisSheetProps): ReactElement {
	const { height } = useWindowDimensions();

	return (
		<BottomSheet isOpen={isOpen} maxDynamicContentSize={height * MAX_FRACTION} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.ScrollView>
						<View className="gap-1">
							<BottomSheet.Title>{title}</BottomSheet.Title>
							{description ? <BottomSheet.Description>{description}</BottomSheet.Description> : null}
						</View>
						{children}
					</BottomSheet.ScrollView>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
AxisSheet.displayName = "Playground.AxisSheet";

/**
 * Applying one axis, and closing the sheet that chose it.
 *
 * **Choosing dismisses, where the old sheet returned to the axis list.** That
 * rule existed because the list was the sheet's other pane: not returning to it
 * meant nine trips back through the trigger. The list is a screen now, sitting
 * permanently behind every sheet, so the next axis is one tap away either way —
 * and dismissing is what lets you see the summary row you just changed repaint.
 *
 * Closing before writing, rather than after, so the dismissal animates against
 * the palette that was on screen when the row was tapped.
 */
export function useAxisChoice<Key extends keyof DesignSystemConfig>(
	key: Key,
	onOpenChange: (isOpen: boolean) => void
): (value: DesignSystemConfig[Key]) => void {
	return useCallback(
		(value: DesignSystemConfig[Key]) => {
			onOpenChange(false);
			setAxis(key, value);
		},
		[key, onOpenChange]
	);
}
