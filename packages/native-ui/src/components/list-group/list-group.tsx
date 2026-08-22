import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import { IconChevronRight } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { Pressable, type PressableFeedback, type PressableProps } from "../pressable";
import { Separator } from "../separator";
import { type ListGroupContextValue, ListGroupProvider, useListGroupContext } from "./list-group.context";
import {
	LIST_GROUP_FOREGROUND_TOKEN,
	LIST_GROUP_ICON_SIZE,
	LIST_GROUP_SUFFIX_ICON_SIZE,
	LIST_GROUP_SUFFIX_ICON_TOKEN,
	type ListGroupSize,
	type ListGroupVariant,
	listGroupDividerVariants,
	listGroupItemContentVariants,
	listGroupItemDescriptionVariants,
	listGroupItemPrefixVariants,
	listGroupItemSuffixVariants,
	listGroupItemTitleVariants,
	listGroupItemVariants,
	listGroupVariants,
} from "./list-group.variants";

function useListGroupPart(component: string): ListGroupContextValue {
	const context = useListGroupContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <ListGroup>.`);
	}
	return context;
}

export type ListGroupProps = ViewProps & {
	variant?: ListGroupVariant;
	size?: ListGroupSize;
	/** Draw a divider between adjacent children. On by default. */
	isDivided?: boolean;
	className?: string;
	children?: ReactNode;
};

/**
 * A surface grouping related rows under one rounded, clipped container.
 *
 * `size` and `variant` reach the sub-components through context, so a row's
 * title picks its own text colour and type scale. That indirection is not
 * incidental: a React Native `View` does not cascade colour to a `Text`
 * descendant the way a DOM element would.
 *
 * Dividers are inserted between adjacent children rather than written out at
 * every call site, inset to line up with the rows' own padding. A `Separator`
 * placed by hand is respected — no divider is added on either side of it — so a
 * caller can still control one gap without turning the whole feature off.
 *
 * @example
 * <ListGroup>
 *   <ListGroup.Item onPress={openProfile}>
 *     <ListGroup.ItemPrefix>
 *       <Icon icon={IconUser} />
 *     </ListGroup.ItemPrefix>
 *     <ListGroup.ItemContent>
 *       <ListGroup.ItemTitle>Personal info</ListGroup.ItemTitle>
 *       <ListGroup.ItemDescription>Name, email, phone</ListGroup.ItemDescription>
 *     </ListGroup.ItemContent>
 *     <ListGroup.ItemSuffix />
 *   </ListGroup.Item>
 * </ListGroup>
 */
export function ListGroup({
	variant = "default",
	size = "md",
	isDivided = true,
	className,
	children,
	...props
}: ListGroupProps): ReactElement {
	const context = useMemo<ListGroupContextValue>(() => ({ size, variant }), [size, variant]);

	const content = useMemo(() => (isDivided ? withDividers(children, size) : children), [children, isDivided, size]);

	return (
		<ListGroupProvider value={context}>
			<View className={listGroupVariants({ className, size, variant })} {...props}>
				{content}
			</View>
		</ListGroupProvider>
	);
}

/**
 * Inserts a divider between adjacent children.
 *
 * A pair is skipped when either side already is a `Separator`, so a hand-placed
 * divider is never doubled. `Children.toArray` drops the nulls and booleans a
 * conditional child leaves behind, so a row rendered only some of the time does
 * not strand a divider where nothing follows it.
 */
function withDividers(children: ReactNode, size: ListGroupSize): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];

	for (const [index, child] of items.entries()) {
		if (index > 0 && !isSeparator(items[index - 1]) && !isSeparator(child)) {
			output.push(<Separator className={listGroupDividerVariants({ size })} key={`divider-${index}`} />);
		}
		output.push(child);
	}

	return output;
}

function isSeparator(node: ReactNode): boolean {
	return isValidElement(node) && node.type === Separator;
}

export type ListGroupItemProps = Omit<PressableProps, "children" | "disabled" | "feedback"> & {
	/**
	 * How the row moves under a press. Defaults to `fade`: a full-bleed row that
	 * scales reads as the whole card flexing rather than as one row responding.
	 */
	feedback?: PressableFeedback;
	isDisabled?: boolean;
	children?: ReactNode;
};

/**
 * One row of a list group.
 *
 * Plain string or number children are wrapped in a title inside a content
 * column; pass the compound parts when a row needs a prefix, a description or a
 * suffix. React Native cannot render a string outside a `<Text>`, so the wrap is
 * not a convenience — without it `<ListGroup.Item>Wi-Fi</ListGroup.Item>` would
 * crash.
 */
function ListGroupItem({
	feedback = "fade",
	isDisabled = false,
	className,
	children,
	...props
}: ListGroupItemProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.Item");
	const content = useMemo(() => wrapTextChildren(children), [children]);

	return (
		<Pressable
			className={listGroupItemVariants({ className, isDisabled, size })}
			disabled={isDisabled}
			feedback={feedback}
			{...props}
		>
			{content}
		</Pressable>
	);
}

/**
 * Wraps bare text children in a title inside a content column.
 *
 * Consecutive strings and numbers are collected into a single title rather than
 * one each — `Row {index}` is one piece of text, and wrapping the parts
 * separately would space them apart by the row's gap.
 */
function wrapTextChildren(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(
			<ListGroupItemContent key={`content-${output.length}`}>
				<ListGroupItemTitle>{run.join("")}</ListGroupItemTitle>
			</ListGroupItemContent>
		);
		run = [];
	};

	for (const child of items) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		output.push(child);
	}
	flushRun();

	return output;
}

export type ListGroupSlotProps = ViewProps & { className?: string; children?: ReactNode };

/**
 * The leading slot of a row.
 *
 * Its subtree inherits the list group's icon size and the foreground token, so a
 * bare `<Icon icon={IconWifi} />` comes out right with nothing said at the call
 * site — the same cascade a `Button` gives its icons.
 */
function ListGroupItemPrefix({ className, children, ...props }: ListGroupSlotProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemPrefix");
	const iconDefaults = useMemo(
		() => ({ color: LIST_GROUP_FOREGROUND_TOKEN, size: LIST_GROUP_ICON_SIZE[size] }),
		[size]
	);

	return (
		<View className={listGroupItemPrefixVariants({ className })} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{children}</IconDefaultsProvider>
		</View>
	);
}

/** The text column of a row, taking whatever width the prefix and suffix leave. */
function ListGroupItemContent({ className, ...props }: ListGroupSlotProps): ReactElement {
	return <View className={listGroupItemContentVariants({ className })} {...props} />;
}

export type ListGroupIconProps = {
	/** Edge length in points. Defaults to the list group's suffix icon size. */
	size?: number;
	/** A theme colour token or a literal. Defaults to `muted-foreground`. */
	color?: string;
};

export type ListGroupItemSuffixProps = ListGroupSlotProps & {
	/** Tunes the default chevron. Ignored once the suffix has children of its own. */
	iconProps?: ListGroupIconProps;
};

/**
 * The trailing slot of a row, showing a chevron unless given content.
 *
 * The chevron is a hint that the row leads somewhere, so it sits on the muted
 * token and a step below the leading icon rather than competing with either.
 */
function ListGroupItemSuffix({ className, iconProps, children, ...props }: ListGroupItemSuffixProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemSuffix");
	const hasContent = Children.toArray(children).length > 0;

	return (
		<View className={listGroupItemSuffixVariants({ className })} {...props}>
			{hasContent ? (
				children
			) : (
				<Icon
					color={iconProps?.color ?? LIST_GROUP_SUFFIX_ICON_TOKEN}
					icon={IconChevronRight}
					size={iconProps?.size ?? LIST_GROUP_SUFFIX_ICON_SIZE[size]}
				/>
			)}
		</View>
	);
}

export type ListGroupTextProps = TextProps & { className?: string };

function ListGroupItemTitle({ className, ...props }: ListGroupTextProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemTitle");
	return <Text className={listGroupItemTitleVariants({ className, size })} {...props} />;
}

function ListGroupItemDescription({ className, ...props }: ListGroupTextProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemDescription");
	return <Text className={listGroupItemDescriptionVariants({ className, size })} {...props} />;
}

ListGroup.Item = ListGroupItem;
ListGroup.ItemPrefix = ListGroupItemPrefix;
ListGroup.ItemContent = ListGroupItemContent;
ListGroup.ItemTitle = ListGroupItemTitle;
ListGroup.ItemDescription = ListGroupItemDescription;
ListGroup.ItemSuffix = ListGroupItemSuffix;
