import type { ViewProps } from "react-native";

/**
 * The shape of a badge's plain `View` parts.
 *
 * Shared by `Badge.StartContent`, `Badge.EndContent` and `Badge.Anchor`, none of
 * which takes anything a `View` does not, so it lives in a leaf rather than in
 * one of the three files arbitrarily.
 */
export type BadgeSlotProps = ViewProps & { className?: string };
