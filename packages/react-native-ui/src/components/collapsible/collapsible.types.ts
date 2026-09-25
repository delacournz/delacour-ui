import type { TextProps } from "react-native";

/**
 * The shape of the trigger's two text lines, `Title` and `Description`.
 *
 * Shared by both parts and by the trigger, which wraps bare string children in a
 * `Collapsible.Title` — three modules, so it lives in a leaf.
 */
export type CollapsibleTextProps = TextProps & { className?: string };
