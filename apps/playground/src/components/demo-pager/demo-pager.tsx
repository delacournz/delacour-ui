import { Screen } from "@delacour/native-ui/screen";
import { useRouter } from "expo-router";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { DemoIndexSheet } from "@/components/demo-pager/demo-index-sheet";
import { DemoPage } from "@/components/demo-pager/demo-page";
import { DemoPageLabel } from "@/components/demo-pager/demo-page-label";
import { DemoRail } from "@/components/demo-pager/demo-rail";
import { useDemoPager } from "@/components/demo-pager/use-demo-pager";
import type { DemoEntry } from "@/demos/types";

const NO_INNER_SCROLL: ReadonlySet<string> = new Set();

export type DemoPagerProps = {
	title: string;
	subtitle?: string;
	demos: readonly DemoEntry[];
};

/**
 * A component's demos, one to a page.
 *
 * The frame every gallery sits in, and the reason it is a pager rather than a
 * scroll of sections: a gallery is looked at, not read. Stacked, eighteen demos
 * each under a heading and a paragraph make a page nobody reaches the bottom
 * of, and no single demo is ever alone on screen long enough to be studied.
 * Paged, the component is the only thing competing for attention and the
 * chrome's whole job is to say where you are and let you move.
 *
 * `meta.caption` and `meta.note` are deliberately not rendered. They still ride
 * on the demo — the documentation site reads them through the capture
 * pipeline's source extractor — but a paragraph of prose above a control is the
 * thing this screen exists to remove.
 *
 * **Both pieces of chrome are `static`, and that is load-bearing.** An overlay
 * navbar or footer is reserved by spacer views inside the scroll content, which
 * would put every page after the first behind the navbar when it snapped.
 * Static chrome takes its space in the flow instead, so the scroll view's own
 * frame is the clear band and `pagingEnabled` lands each demo exactly centred.
 *
 * The title and subtitle ride the back button, the way they did before the
 * gallery was paged: they stay put while the pages move, and the whole block
 * shares the control's tap target.
 */
export function DemoPager({ title, subtitle, demos }: DemoPagerProps): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar placement="static">
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>{title}</Screen.Navbar.Title>
						{subtitle ? <Screen.Navbar.Subtitle>{subtitle}</Screen.Navbar.Subtitle> : null}
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			<DemoPagerBody demos={demos} />
		</Screen>
	);
}

/**
 * The scrolling half, split out so it can read the screen's own context.
 *
 * **`keyboardAware` is deliberately off**, even on a gallery whose demos hold
 * text fields. That mode scrolls the focused field clear of the keyboard, which
 * is exactly wrong under `pagingEnabled`: the scroll lands mid-page and the
 * pager immediately snaps it back, leaving the field under the keyboard anyway.
 * The stage moves for the keyboard instead — see `DemoPage`.
 *
 * With both pieces of chrome static the scroll area's spacers resolve to zero,
 * so the pages align to whole multiples of the frame. The bottom spacer still
 * grows for the keyboard, which is harmless: it sits after the last page.
 *
 * Paging is suspended while any page's inner scroll sits off its top. A tall
 * demo that has been scrolled into would otherwise hand its next drag to the
 * pager and jump to the following demo mid-read.
 *
 * Nothing renders until the frame has been measured. A page sizes itself from
 * that measurement, so rendering first would paint one frame of every demo in
 * the gallery stacked at its natural height — the old layout, for a sixtieth of
 * a second, on the way into the new one. An empty background for that frame is
 * both cheaper and quieter.
 */
function DemoPagerBody({ demos }: { demos: readonly DemoEntry[] }): ReactElement {
	const { activeIndex, onFrameLayout, pageHeight, progress, scrollRef, scrollToIndex } = useDemoPager(demos.length);
	const [innerScrolled, setInnerScrolled] = useState(NO_INNER_SCROLL);

	const onInnerScrollChange = useCallback((id: string, isScrolled: boolean) => {
		setInnerScrolled((current) => {
			if (current.has(id) === isScrolled) return current;
			const next = new Set(current);
			if (isScrolled) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);

	const ids = useMemo(() => demos.map((demo) => demo.id), [demos]);
	const active = demos[activeIndex] ?? demos[0];

	return (
		<>
			<Screen.ScrollArea
				className="flex-1"
				onLayout={onFrameLayout}
				pagingEnabled
				ref={scrollRef}
				scrollEnabled={innerScrolled.size === 0}
			>
				{pageHeight > 0
					? demos.map((demo, index) => (
							<DemoPage
								entry={demo}
								height={pageHeight}
								index={index}
								key={demo.id}
								onInnerScrollChange={onInnerScrollChange}
								progress={progress}
							/>
						))
					: null}
			</Screen.ScrollArea>
			<Screen.Footer placement="static">
				<View className="flex-row items-center gap-2">
					<View className="min-w-0 flex-1 flex-row items-center gap-1">
						<DemoRail ids={ids} pageHeight={pageHeight} progress={progress} scrollRef={scrollRef} />
						<DemoPageLabel title={active?.title ?? ""} />
					</View>
					<DemoIndexSheet activeIndex={activeIndex} demos={demos} onSelect={scrollToIndex} />
				</View>
			</Screen.Footer>
		</>
	);
}
