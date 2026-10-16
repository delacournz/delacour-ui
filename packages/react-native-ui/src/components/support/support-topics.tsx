import { type ReactElement, type ReactNode, useCallback, useMemo, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type SupportTopicsContextValue, SupportTopicsProvider } from "./support.context";
import { resolveNextTopic } from "./support.utils";
import { supportVariants } from "./support.variants";
import { SupportSection } from "./support-section";

export type SupportTopicsProps = Omit<ViewProps, "children"> & {
	title?: string;
	description?: string;
	/** The selected topic. Controlled. */
	value?: string | null;
	/** The topic selected at first, while uncontrolled. */
	defaultValue?: string | null;
	onValueChange?: (value: string) => void;
	children: ReactNode;
	className?: string;
};

/**
 * What the problem is about — one request goes to one queue, so exactly one topic is picked.
 *
 * A `radiogroup` of `Support.Topic` cards, controlled or uncontrolled through
 * `useControllableState`. Pressing the selected topic keeps it: a request needs a queue, so a topic
 * is never toggled off. Its own state rather than `Radio.Group`'s, because a topic is a card row
 * with room for a description, not a labelled circle.
 */
export function SupportTopics({
	title,
	description,
	value: valueProp,
	defaultValue = null,
	onValueChange,
	className,
	children,
	...props
}: SupportTopicsProps): ReactElement {
	const [value, setValue] = useControllableState<string | null>({
		value: valueProp,
		defaultValue,
		onChange: (next) => {
			if (next !== null) onValueChange?.(next);
		},
	});
	const disabled = useRef(new Set<string>());

	const select = useCallback(
		(pressed: string) => {
			const next = resolveNextTopic(value, pressed, { disabledValues: [...disabled.current] });
			if (next !== null && next !== value) setValue(next);
		},
		[setValue, value]
	);

	const registerDisabled = useCallback((topic: string, isDisabled: boolean) => {
		if (isDisabled) disabled.current.add(topic);
		else disabled.current.delete(topic);
	}, []);

	const context = useMemo<SupportTopicsContextValue>(
		() => ({ value, select, registerDisabled }),
		[value, select, registerDisabled]
	);

	return (
		<SupportTopicsProvider value={context}>
			<SupportSection className={className} description={description} title={title} {...props}>
				<View accessibilityLabel={title} accessibilityRole="radiogroup" className={supportVariants().topics()}>
					{children}
				</View>
			</SupportSection>
		</SupportTopicsProvider>
	);
}
SupportTopics.displayName = "DelacourUI.Support.Topics";
