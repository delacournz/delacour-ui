import type { DesignSystemConfig } from "@delacour/design-system/config";
import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setAxis } from "@/design-system/store";

/** What one single-line `ListGroup.Item` occupies, measured on device. */
const AXIS_ROW_HEIGHT = 56;
/** What a row carrying a description occupies — Style's eight, and Radius's `default`. */
export const AXIS_TWO_LINE_ROW_HEIGHT = 68;
/**
 * The grabber, the title block, and the scroll content's own top padding.
 *
 * Measured from the sheet's own top edge, which is NOT where the accessibility
 * tree puts it — that frame starts below the grabber, and taking the number
 * from there loses the ~24pt the grabber occupies and shortens every sheet by
 * enough to put its last row back under the home indicator.
 */
const AXIS_CHROME_HEIGHT = 76;
const MIN_FRACTION = 0.32;
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
	/** Rows the body draws, for sizing the sheet to its own content. */
	rowCount: number;
	/** Points one row occupies. Raise it for two-line rows. @default AXIS_ROW_HEIGHT */
	rowHeight?: number;
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
 * **Sized to its own content, capped.** A fixed percentage is wrong at both ends
 * of this set: Radius has five rows and would open onto half a screen of
 * nothing, Font has twenty-nine and would open already needing a scroll. The
 * same computed snap point `DemoIndexSheet` uses, for the same reason — the
 * four fractions are deliberately duplicated there rather than shared, because
 * the two sheets size different content and are meant to drift apart.
 *
 * Three things here are load-bearing, and each is a silent failure:
 *
 * - `enableDynamicSizing={false}` with an explicit snap point is what
 *   `BottomSheet.ScrollView` needs. A dynamically sized sheet grows to whatever
 *   its content measures and has no height for its scrollable to fill, so a
 *   twenty-nine-row font list simply runs off the top of the screen.
 * - The title block and the scroll view are **siblings**. `BottomSheet.Content`
 *   is a static padded box, so a scroll view inside one inherits no bounded
 *   height and quietly stops scrolling partway down the list.
 * - The title block is a plain `View` rather than `Content` for a second
 *   reason: `Content` pays the sheet's safe-area bottom inset, which under a
 *   title opens a home-indicator-sized hole between the heading and the first
 *   row. The scroll view owns that inset, and owning it once is the point.
 *
 * Children need no gutter of their own — the scroll view's content container is
 * already `gap-4 px-screen-gutter pt-2`.
 */
export function AxisSheet({
	title,
	description,
	rowCount,
	rowHeight,
	isOpen,
	onOpenChange,
	children,
}: AxisSheetProps): ReactElement {
	const insets = useSafeAreaInsets();
	const { height } = useWindowDimensions();

	// Memoised, unlike DemoIndexSheet's: an axis sheet re-renders on every
	// config change, and a fresh array identity makes gorhom re-derive its snap
	// points underneath a sheet that is open at the time.
	//
	// `insets.bottom` is a term, not a rounding allowance. The scroll view pays
	// the home-indicator inset as padding INSIDE its content, so a snap point
	// that budgets only for the rows leaves that padding below the fold: the
	// list scrolls where it should have fitted, and at rest the last row sits
	// under the indicator. Rounding up rather than to nearest for the same
	// reason — a sheet a point taller than its content shows a sliver of empty
	// space, a sheet a point shorter clips a row.
	const snapPoints = useMemo(() => {
		const content = AXIS_CHROME_HEIGHT + rowCount * (rowHeight ?? AXIS_ROW_HEIGHT) + insets.bottom;
		const fraction = Math.min(Math.max(content / height, MIN_FRACTION), MAX_FRACTION);
		return [`${Math.ceil(fraction * 100)}%`];
	}, [rowCount, rowHeight, insets.bottom, height]);

	return (
		<BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container enableDynamicSizing={false} snapPoints={snapPoints}>
					<View className="gap-1 px-screen-gutter pt-2 pb-2">
						<BottomSheet.Title>{title}</BottomSheet.Title>
						{description ? <BottomSheet.Description>{description}</BottomSheet.Description> : null}
					</View>
					<BottomSheet.ScrollView className="flex-1">{children}</BottomSheet.ScrollView>
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
