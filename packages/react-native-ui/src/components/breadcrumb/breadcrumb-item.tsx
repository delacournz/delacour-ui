import type { ReactElement } from "react";
import { View } from "react-native";
import { useBreadcrumbPart } from "./breadcrumb.context";
import type { BreadcrumbSlotProps } from "./breadcrumb.types";
import { breadcrumbVariants } from "./breadcrumb.variants";

export type BreadcrumbItemProps = BreadcrumbSlotProps;

/**
 * One crumb — holds a `Breadcrumb.Link` for a level above, or a
 * `Breadcrumb.Page` for the current one.
 *
 * Write items as direct children of `Breadcrumb.List` (a `.map()` is fine): the
 * list counts them to place separators and decide what collapses, and an item
 * behind a wrapper component is not counted.
 */
export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps): ReactElement {
	const { size } = useBreadcrumbPart("Breadcrumb.Item");
	return <View className={breadcrumbVariants({ size }).item({ className })} {...props} />;
}
BreadcrumbItem.displayName = "DelacourUI.Breadcrumb.Item";
