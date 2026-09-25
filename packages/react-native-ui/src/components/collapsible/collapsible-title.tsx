import type { ReactElement } from "react";
import { Text } from "../text";
import { useCollapsiblePart } from "./collapsible.context";
import type { CollapsibleTextProps } from "./collapsible.types";
import { collapsibleVariants } from "./collapsible.variants";

/**
 * The trigger's primary line — what the section is called.
 *
 * Carries its own colour and type scale, read from the collapsible's context: a
 * React Native `View` does not cascade colour to a `Text` descendant.
 */
export function CollapsibleTitle({ className, ...props }: CollapsibleTextProps): ReactElement {
	const { size } = useCollapsiblePart("Collapsible.Title");
	return <Text className={collapsibleVariants({ size }).title({ className })} {...props} />;
}
CollapsibleTitle.displayName = "DelacourUI.Collapsible.Title";
