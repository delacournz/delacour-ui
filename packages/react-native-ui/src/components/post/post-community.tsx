import type { ReactElement, ReactNode } from "react";
import { type ImageSourcePropType, View, type ViewProps } from "react-native";
import { Avatar } from "../avatar";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { usePostPart } from "./post.context";
import { postVariants, resolvePostAvatarSize } from "./post.variants";

export type PostCommunityProps = Omit<ViewProps, "children" | "style"> & {
	/** `r/reactnative`. */
	name: string;
	/** The community's face. Its initials show while it loads and if it fails. */
	avatar?: ImageSourcePropType;
	/** The line under the name — `5h ago · u/ada`. A string is styled; a node is rendered as-is. */
	meta?: ReactNode;
	/** Opens the community. */
	onPress?: PressableProps["onPress"];
	className?: string;
};

/**
 * Where a post was made, for a ranked community feed — the header a `vote`
 * card leads with in place of an author.
 *
 * One accessibility element, like `Post.Author`: the name and a string `meta`
 * are read in one stop.
 */
export function PostCommunity({
	name,
	avatar,
	meta,
	onPress,
	accessibilityLabel,
	className,
	...props
}: PostCommunityProps): ReactElement {
	const { variant, size } = usePostPart("Post.Community");
	const slots = postVariants({ variant, size });
	const label = accessibilityLabel ?? (typeof meta === "string" ? `${name}, ${meta}` : name);

	const content = (
		<>
			<Avatar name={name} size={resolvePostAvatarSize(size, variant)} source={avatar} />
			<View className={slots.authorText()}>
				<Text className={slots.communityName()} numberOfLines={1}>
					{name}
				</Text>
				{typeof meta === "string" ? (
					<Text className={slots.authorMeta()} numberOfLines={1}>
						{meta}
					</Text>
				) : (
					meta
				)}
			</View>
		</>
	);

	if (onPress) {
		return (
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				className={slots.community({ className })}
				feedback="fade"
				onPress={onPress}
				{...props}
			>
				{content}
			</Pressable>
		);
	}

	return (
		<View accessibilityLabel={label} accessible className={slots.community({ className })} {...props}>
			{content}
		</View>
	);
}
PostCommunity.displayName = "DelacourUI.Post.Community";
