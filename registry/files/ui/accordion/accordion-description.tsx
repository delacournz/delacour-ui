import type { ReactElement } from "react";
import { Text } from "@registry/ui/text";
import { useAccordionPart } from "./accordion.context";
import type { AccordionTextProps } from "./accordion.types";
import { accordionVariants } from "./accordion.variants";

/**
 * The trigger's secondary line, a step down in scale and on the muted token.
 *
 * Sits under the title inside the trigger's own text column, which the trigger
 * assembles — so the two stack without a wrapper part between them.
 */
export function AccordionDescription({ className, ...props }: AccordionTextProps): ReactElement {
	const { size } = useAccordionPart("Accordion.Description");
	return <Text className={accordionVariants({ size }).description({ className })} {...props} />;
}
AccordionDescription.displayName = "DelacourUI.Accordion.Description";
