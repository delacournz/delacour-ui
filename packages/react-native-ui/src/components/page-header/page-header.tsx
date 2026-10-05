import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../../lib/cn";
import { useScreenContext } from "../screen/screen.context";
import { Surface } from "../surface";
import { useSurfaceContext } from "../surface/surface.context";
import { resolveSurfacePlane, resolveSurfaceVariant } from "../surface/surface.variants";
import { type PageHeaderContextValue, PageHeaderProvider } from "./page-header.context";
import {
	type PageHeaderAlign,
	type PageHeaderVariant,
	pageHeaderVariants,
	resolvePageHeaderAvatarSize,
	resolvePageHeaderTopPadding,
} from "./page-header.variants";
import { PageHeaderActions } from "./page-header-actions";
import { PageHeaderAvatar } from "./page-header-avatar";
import { PageHeaderContent } from "./page-header-content";
import { PageHeaderCover } from "./page-header-cover";
import { PageHeaderDescription } from "./page-header-description";
import { PageHeaderMeta } from "./page-header-meta";
import { PageHeaderStat } from "./page-header-stat";
import { PageHeaderStats } from "./page-header-stats";
import { PageHeaderTitle } from "./page-header-title";

export type PageHeaderProps = Omit<ViewProps, "children"> & {
	/**
	 * `card` is an isolated `Surface` — a row in a list of people. `page` has no surface and its
	 * cover bleeds to the screen edges, including under the status bar. Default `page`.
	 */
	variant?: PageHeaderVariant;
	/** Where the face and the text sit: `center` over the cover's middle, `start` on the leading edge. Default `center`. */
	align?: PageHeaderAlign;
	className?: string;
	children?: ReactNode;
};

function PageHeaderRoot({
	variant = "page",
	align = "center",
	className,
	style,
	children,
	...props
}: PageHeaderProps): ReactElement {
	const [hasCover, setHasCover] = useState(false);
	const registerCover = useCallback((isMounted: boolean) => setHasCover(isMounted), []);
	const screen = useScreenContext();
	const isInScreen = screen !== null;
	const parentPlane = useSurfaceContext()?.plane ?? null;
	const { top } = useSafeAreaInsets();

	const plane =
		variant === "card"
			? resolveSurfacePlane({ parentPlane, variant: resolveSurfaceVariant({ parentPlane }) })
			: parentPlane;
	const avatarSize = resolvePageHeaderAvatarSize(align);
	const context = useMemo<PageHeaderContextValue>(
		() => ({ variant, align, hasCover, avatarSize, plane }),
		[variant, align, hasCover, avatarSize, plane]
	);

	const slots = pageHeaderVariants({ variant, align, isBleeding: variant === "page" && isInScreen });
	const paddingTop = resolvePageHeaderTopPadding({ variant, hasCover, isInScreen, safeAreaTop: top });

	// A card is a `Surface`, so anything nested inside it steps to the next fill;
	// a page header paints nothing and leaves the plane it sits on alone.
	return (
		<PageHeaderProvider registerCover={registerCover} value={context}>
			{variant === "card" ? (
				<Surface className={cn(slots.root(), className)} padding="none" style={style} {...props}>
					{children}
				</Surface>
			) : (
				<View
					className={cn(slots.root(), className)}
					style={paddingTop > 0 ? [{ paddingTop }, style] : style}
					{...props}
				>
					{children}
				</View>
			)}
		</PageHeaderProvider>
	);
}

/**
 * The head of a profile or place screen — a cover, a face lifted over its edge,
 * a title block, actions and a strip of numbers.
 *
 * For a *someone* or a *somewhere*: a person, a team, a venue, a playlist. It is
 * not a screen title — that is `Screen.Navbar` — and it is not wrapped in
 * `Screen.Header`: pass it to a scrollable's `header` directly.
 *
 * **Every part is optional and drawn in source order.** The root inspects no
 * children. The one thing it learns is whether a `PageHeader.Cover` is mounted —
 * the cover registers itself through context — which is what lifts
 * `PageHeader.Avatar` over the cover's lower edge.
 *
 * **`page` reaches the edges; `card` is a surface.** A page header bleeds through
 * a `Screen`'s gutter and its cover runs under the status bar and an overlay
 * navbar. A card is a clipped `Surface` sized for a list.
 *
 * @example
 * <Screen.ScrollArea
 *   header={
 *     <PageHeader>
 *       <PageHeader.Cover source={{ uri: team.cover }} />
 *       <PageHeader.Avatar isVerified name={team.name} source={{ uri: team.logo }} />
 *       <PageHeader.Content>
 *         <PageHeader.Title>{team.name}</PageHeader.Title>
 *         <PageHeader.Meta icon={IconPin}>Auckland, NZ</PageHeader.Meta>
 *         <PageHeader.Description>{team.bio}</PageHeader.Description>
 *       </PageHeader.Content>
 *       <PageHeader.Actions>
 *         <Button>Follow</Button>
 *       </PageHeader.Actions>
 *       <PageHeader.Stats isDivided>
 *         <PageHeader.Stat label="Followers" onPress={openFollowers} value={1234} />
 *         <PageHeader.Stat label="Posts" value={87} />
 *       </PageHeader.Stats>
 *     </PageHeader>
 *   }
 * />
 *
 * @example
 * <PageHeader align="start" variant="card">
 *   <PageHeader.Avatar name={person.name} source={person.photo} />
 *   <PageHeader.Content>
 *     <PageHeader.Title>{person.name}</PageHeader.Title>
 *   </PageHeader.Content>
 * </PageHeader>
 */
export const PageHeader = Object.assign(PageHeaderRoot, {
	/** A picture or a gradient across the top; reaches under the status bar in `page`. */
	Cover: PageHeaderCover,
	/** The face, ringed in the header's ground and lifted over the cover. */
	Avatar: PageHeaderAvatar,
	/** The title block — title, meta and description, on the gutter. */
	Content: PageHeaderContent,
	/** The name, on one line, announced as a heading. */
	Title: PageHeaderTitle,
	/** Muted body copy, three lines by default. */
	Description: PageHeaderDescription,
	/** A small muted fact with an optional glyph — a place, a join date. */
	Meta: PageHeaderMeta,
	/** A wrapping row of buttons. */
	Actions: PageHeaderActions,
	/** A strip of stats, stacked or inline, optionally divided. */
	Stats: PageHeaderStats,
	/** One number and its label; pressable when given `onPress`. */
	Stat: PageHeaderStat,
	displayName: "DelacourUI.PageHeader",
});
