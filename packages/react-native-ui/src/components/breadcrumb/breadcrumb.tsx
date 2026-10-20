import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { type BreadcrumbContextValue, BreadcrumbProvider } from "./breadcrumb.context";
import { BREADCRUMB_DEFAULT_SIZE, type BreadcrumbSize, breadcrumbVariants } from "./breadcrumb.variants";
import { BreadcrumbEllipsis } from "./breadcrumb-ellipsis";
import { BreadcrumbItem } from "./breadcrumb-item";
import { BreadcrumbLink } from "./breadcrumb-link";
import { BreadcrumbList } from "./breadcrumb-list";
import { BreadcrumbPage } from "./breadcrumb-page";
import { BreadcrumbSeparator } from "./breadcrumb-separator";

export type BreadcrumbProps = ViewProps & {
	/** `sm` sets the labels on the caption step, `md` on the body step. */
	size?: BreadcrumbSize;
	/** Replaces the chevron between crumbs — a string is drawn as muted text. */
	separator?: ReactNode;
	className?: string;
	children?: ReactNode;
};

function BreadcrumbRoot({
	size = BREADCRUMB_DEFAULT_SIZE,
	separator,
	className,
	children,
	...props
}: BreadcrumbProps): ReactElement {
	const context = useMemo<BreadcrumbContextValue>(() => ({ separator, size }), [separator, size]);

	return (
		<BreadcrumbProvider value={context}>
			<View className={breadcrumbVariants({ size }).root({ className })} {...props}>
				{children}
			</View>
		</BreadcrumbProvider>
	);
}

/**
 * The path to the current screen — `Settings › Account › Security`. Every crumb
 * before the last navigates back to that level; the last is the current page,
 * plain text.
 *
 * `Breadcrumb.List` inserts the separators, so a trail is only its items. A
 * long one collapses its middle into an ellipsis with `maxItems`, or scrolls
 * with `overflow="scroll"`. Links take an `onPress` — there is no router
 * coupling.
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <Breadcrumb.List>
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Link onPress={goHome}>Home</Breadcrumb.Link>
 *     </Breadcrumb.Item>
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Page>Security</Breadcrumb.Page>
 *     </Breadcrumb.Item>
 *   </Breadcrumb.List>
 * </Breadcrumb>
 * ```
 *
 * @example
 * ```tsx
 * <Breadcrumb size="sm">
 *   <Breadcrumb.List maxItems={3} onEllipsisPress={(hidden) => openSheet(hidden)}>
 *     {trail.map((crumb, i) => (
 *       <Breadcrumb.Item key={crumb.id}>
 *         {i === trail.length - 1 ? (
 *           <Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
 *         ) : (
 *           <Breadcrumb.Link onPress={() => go(crumb)}>{crumb.title}</Breadcrumb.Link>
 *         )}
 *       </Breadcrumb.Item>
 *     ))}
 *   </Breadcrumb.List>
 * </Breadcrumb>
 * ```
 */
export const Breadcrumb = Object.assign(BreadcrumbRoot, {
	/** The trail — counts its items, inserts separators, collapses or scrolls. */
	List: BreadcrumbList,
	/** One crumb, holding a `Link` or the `Page`. */
	Item: BreadcrumbItem,
	/** A level above the current page; pressing it goes back there. */
	Link: BreadcrumbLink,
	/** The current page — the last crumb, never pressable. */
	Page: BreadcrumbPage,
	/** The mark between two crumbs. Inserted automatically; write one to change a single gap. */
	Separator: BreadcrumbSeparator,
	/** The dots standing in for collapsed levels. Placed automatically by a collapsing list. */
	Ellipsis: BreadcrumbEllipsis,
	displayName: "DelacourUI.Breadcrumb",
});
