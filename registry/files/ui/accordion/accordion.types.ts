import type { TextProps } from "react-native";

/**
 * The shape of a trigger's two text lines, `Title` and `Description`.
 *
 * Shared by both parts, and by the root's trigger, which wraps bare string
 * children in a `Accordion.Title` — three modules, so it lives in a leaf rather
 * than in one of them arbitrarily. `ListGroupTextProps` is the same type for the
 * same reason.
 */
export type AccordionTextProps = TextProps & { className?: string };
