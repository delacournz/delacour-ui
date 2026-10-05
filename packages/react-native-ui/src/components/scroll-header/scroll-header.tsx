import { ScrollHeaderBar } from "./scroll-header-bar";
import { ScrollHeaderBarTitle } from "./scroll-header-bar-title";
import { ScrollHeaderCover } from "./scroll-header-cover";
import { ScrollHeaderFlatList } from "./scroll-header-flat-list";
import { ScrollHeaderInset } from "./scroll-header-inset";
import { ScrollHeaderLarge } from "./scroll-header-large";
import { ScrollHeaderRoot } from "./scroll-header-root";
import { ScrollHeaderScrollView } from "./scroll-header-scroll-view";

/**
 * A collapsing header: a large title block — optionally over a stretching cover — scrolls away
 * while a compact bar stays pinned and takes over in one crossfade, settling open or closed when
 * the scroll comes to rest.
 *
 * **It is the screen's top frame, in place of `Screen.Navbar`.** Inside a `<Screen>`, mount no
 * `Screen.Navbar` and use `ScrollHeader.ScrollView` / `.FlatList`, not `Screen.ScrollArea` —
 * otherwise the Screen's own top inset stacks on the header's. `Screen.Footer` composes fine.
 *
 * **Give the root a height.** It is `flex-1`; inside a parent with no height it collapses to
 * nothing (a dev warning says so). The parts may come in any order; exactly one scroller.
 *
 * **Nothing is cloned.** The scroller parts wire themselves; any other scroller spreads
 * `useScrollHeader().scrollProps` and renders `<ScrollHeader.Inset />` at its top. The root also
 * publishes its scroll source, so a `ScrollBlur` inside needs no `scrollSource` prop.
 *
 * `progress` (0 open → 1 collapsed, every frame) and `onCollapsedChange` (once per crossing)
 * let the rest of the screen follow along.
 *
 * @example
 * <ScrollHeader onCollapsedChange={setCollapsed}>
 *   <ScrollHeader.Bar surface="blur">
 *     <ScrollHeader.BarTitle>Library</ScrollHeader.BarTitle>
 *     <View className="ml-auto">
 *       <Button accessibilityLabel="Search" size="icon-sm" variant="secondary">
 *         <Icon icon={IconMagnifyingGlass} />
 *       </Button>
 *     </View>
 *   </ScrollHeader.Bar>
 *   <ScrollHeader.Large>
 *     <Text.Title>Library</Text.Title>
 *     <Text.Muted>128 albums</Text.Muted>
 *   </ScrollHeader.Large>
 *   <ScrollHeader.ScrollView contentContainerClassName="gap-3 px-screen-gutter">{rows}</ScrollHeader.ScrollView>
 * </ScrollHeader>
 *
 * @example
 * <ScrollHeader>
 *   <ScrollHeader.Cover source={require("./cover.jpg")} />
 *   <ScrollHeader.Bar surface="none">…</ScrollHeader.Bar>
 *   <ScrollHeader.Large>…</ScrollHeader.Large>
 *   <ScrollHeader.FlatList data={rows} renderItem={renderRow} />
 * </ScrollHeader>
 */
export const ScrollHeader = Object.assign(ScrollHeaderRoot, {
	/** The pinned bar — safe-area band plus one row of controls; its surface fades in on collapse. */
	Bar: ScrollHeaderBar,
	/** The bar's title, fading in as the Large block leaves. Announced only once collapsed. */
	BarTitle: ScrollHeaderBarTitle,
	/** The large title block; measured, display-only, scrolls away and fades out. */
	Large: ScrollHeaderLarge,
	/** A full-bleed image or gradient behind the header that stretches on pull. */
	Cover: ScrollHeaderCover,
	/** The spacer a custom scroller renders first, so its content clears the header. */
	Inset: ScrollHeaderInset,
	/** A `ScrollView` wired to the header. */
	ScrollView: ScrollHeaderScrollView,
	/** A `FlatList` wired to the header. */
	FlatList: ScrollHeaderFlatList,
	displayName: "DelacourUI.ScrollHeader",
});
