import type { ReactElement } from "react";
import { Text } from "../text";
import { useCollapsiblePart } from "./collapsible.context";
import type { CollapsibleTextProps } from "./collapsible.types";
import { collapsibleVariants } from "./collapsible.variants";

/**
 * The trigger's secondary line, a step down in scale and on the muted token.
 *
 * Stacks under the title inside the column the trigger assembles, so the two
 * need no wrapper part between them.
 */
export function CollapsibleDescription({ className, ...props }: CollapsibleTextProps): ReactElement {
	const { size } = useCollapsiblePart("Collapsible.Description");
	return <Text className={collapsibleVariants({ size }).description({ className })} {...props} />;
}
CollapsibleDescription.displayName = "DelacourUI.Collapsible.Description";
