import type { ReactElement } from "react";
import { Chip, type ChipProps } from "../chip";
import { resolveReplyA11yHint } from "./support.utils";
import { resolveReplyColor } from "./support.variants";

export type SupportReplyProps = Omit<
	ChipProps,
	"children" | "color" | "defaultSelected" | "isSelected" | "onClose" | "onSelectedChange" | "variant"
> & {
	label: string;
	/** A leading glyph — an `<Icon>`. */
	icon?: ReactElement;
	/** The way out to a person. Painted primary-soft and announced with the hint "Talk to a person". */
	escalates?: boolean;
	className?: string;
};

/**
 * One suggested answer — a soft `Chip`, announced as a button. The reply that reaches a person is
 * the primary-soft one, and says so to a screen reader in its hint.
 */
export function SupportReply({
	label,
	icon,
	escalates = false,
	accessibilityHint,
	...props
}: SupportReplyProps): ReactElement {
	return (
		<Chip
			accessibilityHint={accessibilityHint ?? resolveReplyA11yHint(escalates)}
			color={resolveReplyColor(escalates)}
			variant="soft"
			{...props}
		>
			{icon ? <Chip.StartContent>{icon}</Chip.StartContent> : null}
			<Chip.Label>{label}</Chip.Label>
		</Chip>
	);
}
SupportReply.displayName = "DelacourUI.Support.Reply";
