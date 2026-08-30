import { Icon } from "@delacour/native-ui/icon";
import { IconChevronDownSmall } from "@delacour/native-ui/icons/central";
import { Pressable } from "@delacour/native-ui/pressable";
import type { ScreenScrollViewRef } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { AnimatedRef, DerivedValue } from "react-native-reanimated";
import { DemoPageLabel } from "@/components/demo-pager/demo-page-label";
import { DemoRail } from "@/components/demo-pager/demo-rail";

export type DemoHeaderProps = {
	title: string;
	activeIndex: number;
	ids: readonly string[];
	progress: DerivedValue<number>;
	scrollRef: AnimatedRef<ScreenScrollViewRef>;
	pageHeight: number;
	onOpenIndex: () => void;
};

/**
 * Where you are, pinned above the pages.
 *
 * **Outside the scroll area, not inside it.** It sits between the navbar and
 * the pager as a sibling, so it takes its own space in the flow and never
 * moves. A sticky element inside a paging scroll view would have to fight the
 * snap it is describing.
 *
 * The row reads left to right as one sentence: this demo, that far through the
 * set. The counter is padded to match the index sheet's own numbering, so "the
 * third of eighteen" is the same phrase in both places — and it is what keeps
 * the row from being a name against a void, which is how it read when the rail
 * carried the position alone.
 *
 * **The name is the control.** It opens the index, which is why the chevron is
 * beside it and why there is no floating button in the corner any more: a
 * gallery with a name already on screen does not need a second, wordless way to
 * ask what else there is.
 *
 * The rail draws the header's bottom edge rather than sitting above a separate
 * hairline. A sticky header needs a rule to hold it off the content and a
 * gallery needs a position indicator; drawing one mark for both is what keeps
 * this to a single row of chrome.
 *
 * The one-point negative margin covers the navbar's own hairline, which is
 * why there is a single rule under this block rather than two with a strip of
 * chrome stranded between them. `Screen.Navbar` draws that line from a view
 * inside its background, so no prop can turn it off — and here it divides
 * nothing, because the header is opaque and no content ever passes under it.
 */
export function DemoHeader({
	title,
	activeIndex,
	ids,
	progress,
	scrollRef,
	pageHeight,
	onOpenIndex,
}: DemoHeaderProps): ReactElement {
	const pad = (value: number): string => String(value).padStart(2, "0");

	return (
		<View className="bg-background">
			<Pressable
				accessibilityHint="Opens the list of demos"
				accessibilityLabel={title}
				accessibilityRole="button"
				className="flex-row items-center gap-2 px-screen-gutter py-2"
				feedback="fade"
				haptic="selection"
				onPress={onOpenIndex}
				testID="demo-index-trigger"
			>
				<DemoPageLabel title={title} />
				<Icon color="muted-foreground" icon={IconChevronDownSmall} size="sm" />
				<View className="flex-1" />
				<Text.Caption color="muted">{`${pad(activeIndex + 1)} / ${pad(ids.length)}`}</Text.Caption>
			</Pressable>
			<DemoRail ids={ids} pageHeight={pageHeight} progress={progress} scrollRef={scrollRef} />
		</View>
	);
}
