import { type ReactElement, type ReactNode, useState } from "react";
import { type NativeSyntheticEvent, type TextLayoutEventData, View } from "react-native";
import { Text, type TextProps } from "../text";
import { usePostPart } from "./post.context";
import { type BodyToken, resolveBodyClamp, tokenizePostBody } from "./post.utils";
import { postVariants } from "./post.variants";

export type PostBodyProps = Omit<TextProps, "children" | "numberOfLines"> & {
	/** A string is split into text, `#tags`, `@mentions` and links; a node is rendered as-is. */
	children: string | ReactNode;
	/** Clamp the body to this many lines. */
	numberOfLines?: number;
	/** Offer "more" when the clamped body overflows, and "less" once it is open. */
	expandable?: boolean;
	/** A tag was pressed — receives it without the `#`. Without a handler a tag is coloured text. */
	onTagPress?: (tag: string) => void;
	/** A mention was pressed — receives it without the `@`. */
	onMentionPress?: (handle: string) => void;
	/** A link was pressed — receives the URL. */
	onLinkPress?: (url: string) => void;
	className?: string;
};

/** The handler a token answers to, if the caller gave one. */
function handlerFor(
	token: Exclude<BodyToken, { type: "text" }>,
	handlers: Pick<PostBodyProps, "onTagPress" | "onMentionPress" | "onLinkPress">
): (() => void) | undefined {
	const { onTagPress, onMentionPress, onLinkPress } = handlers;
	if (token.type === "tag" && onTagPress) return () => onTagPress(token.value);
	if (token.type === "mention" && onMentionPress) return () => onMentionPress(token.value);
	if (token.type === "link" && onLinkPress) return () => onLinkPress(token.value);
	return undefined;
}

/**
 * A post's text, with its tags, mentions and links picked out.
 *
 * A string body goes through `tokenizePostBody` and each token becomes a
 * nested `Text` — coloured always, pressable and announced as a link only when
 * the caller handed it a handler. A node body is rendered untouched, for a
 * caller with its own rich text.
 *
 * `expandable` with `numberOfLines` measures the body unclamped in an
 * invisible twin laid over it, because a clamped `Text` reports only the lines
 * it drew. "More" appears only when the twin has more lines than the clamp —
 * a short post offers nothing to tap into.
 */
export function PostBody({
	children,
	numberOfLines,
	expandable = false,
	onTagPress,
	onMentionPress,
	onLinkPress,
	className,
	testID,
	...props
}: PostBodyProps): ReactElement {
	const { variant, size } = usePostPart("Post.Body");
	const slots = postVariants({ variant, size });
	const [isExpanded, setIsExpanded] = useState(false);
	const [isTruncated, setIsTruncated] = useState(false);
	const clamp = resolveBodyClamp({ numberOfLines, expandable, isTruncated, isExpanded });

	const content =
		typeof children === "string"
			? tokenizePostBody(children).map((token, index) => {
					const key = `${index}-${token.type}`;
					if (token.type === "text") return token.value;
					const onPress = handlerFor(token, { onTagPress, onMentionPress, onLinkPress });
					return (
						<Text
							accessibilityRole={onPress ? "link" : undefined}
							className={slots.bodyTag()}
							key={key}
							onPress={onPress}
						>
							{token.raw}
						</Text>
					);
				})
			: children;

	const measure = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
		if (numberOfLines === undefined) return;
		setIsTruncated(event.nativeEvent.lines.length > numberOfLines);
	};

	const isMeasured = expandable && numberOfLines !== undefined;
	const toggle = clamp.showMore || clamp.showLess;

	return (
		<View className={slots.bodyFrame()}>
			<Text className={slots.body({ className })} numberOfLines={clamp.numberOfLines} testID={testID} {...props}>
				{content}
			</Text>
			{isMeasured ? (
				<Text
					accessibilityElementsHidden
					className={slots.bodyMeasure({ className: slots.body({ className }) })}
					importantForAccessibility="no-hide-descendants"
					onTextLayout={measure}
					pointerEvents="none"
				>
					{content}
				</Text>
			) : null}
			{toggle ? (
				<Text
					accessibilityRole="button"
					className={slots.bodyToggle()}
					onPress={() => setIsExpanded((open) => !open)}
					suppressHighlighting
					testID={testID ? `${testID}-more` : "post-body-more"}
				>
					{clamp.showMore ? "more" : "less"}
				</Text>
			) : null}
		</View>
	);
}
PostBody.displayName = "DelacourUI.Post.Body";
