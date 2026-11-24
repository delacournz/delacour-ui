import { type ReactElement, useEffect, useMemo } from "react";
import { View } from "react-native";
import type { SupportLabels } from "../../lib/labels";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useSupportLabels, useSupportTopics } from "./support.context";
import { resolveTopicA11yLabel } from "./support.utils";
import { SUPPORT_TOPIC_ICON_TOKEN, supportVariants } from "./support.variants";

export type SupportTopicProps = Omit<PressableProps, "asChild" | "children" | "disabled" | "onPress"> & {
	/** What `Support.Topics` reports when this one is picked. */
	value: string;
	/** The topic's glyph — an `<Icon>`. */
	icon?: ReactElement;
	label: string;
	description?: string;
	isDisabled?: boolean;
	/**
	 * The spoken strings, laid over `DelacourProvider`'s `labels`, which sit over English. `accessibilityLabel` still wins.
	 */
	labels?: Partial<SupportLabels>;
	className?: string;
};

/**
 * One topic in a `Support.Topics` group — a card row announced as a `radio` with its checked state
 * and a label of `"Billing. Invoices, refunds and plans"`.
 *
 * Selection swaps the border and fill and snaps; there is no sliding highlight, which would imply
 * an order the topics do not have. A `selection` haptic ticks on press.
 */
export function SupportTopic({
	value,
	icon,
	label,
	description,
	isDisabled = false,
	haptic = "selection",
	feedback = "fade",
	accessibilityLabel,
	accessibilityState,
	labels: labelsProp,
	className,
	...props
}: SupportTopicProps): ReactElement {
	const labels = useSupportLabels(labelsProp);
	const { value: selected, select, registerDisabled } = useSupportTopics();
	const isSelected = selected === value;
	const slots = supportVariants({ selected: isSelected, isDisabled });
	const iconClassName = slots.topicIcon();
	const iconDefaults = useMemo(() => ({ className: iconClassName, color: SUPPORT_TOPIC_ICON_TOKEN }), [iconClassName]);

	useEffect(() => {
		registerDisabled(value, isDisabled);
		return () => registerDisabled(value, false);
	}, [isDisabled, registerDisabled, value]);

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? resolveTopicA11yLabel(label, description, labels)}
			accessibilityRole="radio"
			accessibilityState={{ ...accessibilityState, checked: isSelected }}
			className={slots.topic({ className })}
			disabled={isDisabled}
			feedback={feedback}
			haptic={haptic}
			onPress={() => select(value)}
			{...props}
		>
			{icon ? <IconDefaultsProvider value={iconDefaults}>{icon}</IconDefaultsProvider> : null}
			<View className={slots.topicContent()}>
				<Text className={slots.topicTitle()}>{label}</Text>
				{description ? <Text className={slots.topicDescription()}>{description}</Text> : null}
			</View>
			<View className={slots.topicIndicator()}>
				{isSelected ? <View className={slots.topicIndicatorDot()} /> : null}
			</View>
		</Pressable>
	);
}
SupportTopic.displayName = "DelacourUI.Support.Topic";
