import type { ReactElement } from "react";
import { Text } from "@registry/ui/text";
import { useAccordionPart } from "./accordion.context";
import type { AccordionTextProps } from "./accordion.types";
import { accordionVariants } from "./accordion.variants";

/**
 * The trigger's primary line — what the item is called.
 *
 * Carries its own colour and type scale, read from the accordion's context: a
 * React Native `View` does not cascade colour to a `Text` descendant, so the
 * trigger cannot set it on their behalf.
 */
export function AccordionTitle({ className, ...props }: AccordionTextProps): ReactElement {
	const { size } = useAccordionPart("Accordion.Title");
	return <Text className={accordionVariants({ size }).title({ className })} {...props} />;
}
AccordionTitle.displayName = "DelacourUI.Accordion.Title";
