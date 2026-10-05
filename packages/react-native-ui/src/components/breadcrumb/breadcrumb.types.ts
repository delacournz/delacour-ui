import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/**
 * The shape of a breadcrumb's plain-view parts.
 *
 * Shared by `Breadcrumb.Item` and extended by `Breadcrumb.Separator` and
 * `Breadcrumb.Ellipsis`, so it lives in a leaf rather than in one of them
 * arbitrarily.
 */
export type BreadcrumbSlotProps = ViewProps & { className?: string; children?: ReactNode };
