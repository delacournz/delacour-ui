import type { ReactElement } from "react";
import { type ImageSourcePropType, View, type ViewProps } from "react-native";
import { IconCheckCircle2 } from "../../icons/central";
import { Avatar } from "../avatar";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { usePostPart } from "./post.context";
import { formatRelativeTime, resolveAuthorA11yLabel } from "./post.utils";
import { postVariants, resolvePostAvatarSize, resolvePostLayout } from "./post.variants";

export type PostAuthorProps = Omit<ViewProps, "children" | "style"> & {
	/** The person's display name. */
	name: string;
	/** `@aria` — on the name's line in `compact`, under it everywhere else. */
	handle?: string;
	/** When it was posted. Printed relative to `now`; ignored when `timestamp` is given. */
	date?: Date;
	/** The caller's own wording for the time. Wins over `date`. */
	timestamp?: string;
	/** The face. Initials of `name` show while it loads and if it fails. */
	avatar?: ImageSourcePropType;
	/** Initials override, passed to the `Avatar`. */
	fallback?: string;
	/** Draws a check after the name, and says "verified". */
	verified?: boolean;
	/** Opens the profile. Without it the author is a single static stop for a screen reader. */
	onPress?: PressableProps["onPress"];
	/** The clock `date` is measured against. Defaults to the time of render — inject one for stories and tests. */
	now?: Date;
	className?: string;
};

/**
 * Who posted, when — a face, a name, an optional verified check, a handle and a
 * relative time.
 *
 * The whole block is one accessibility element whose label is built by
 * `resolveAuthorA11yLabel`, so VoiceOver says "Aria Whitlock, @aria, verified, 3
 * minutes ago" in one stop instead of four, and the time as words rather than
 * "3m".
 *
 * With an `onPress` it is a `Pressable` that fades — the profile tap is a target
 * of its own, separate from the card's.
 */
export function PostAuthor({
	name,
	handle,
	date,
	timestamp,
	avatar,
	fallback,
	verified = false,
	onPress,
	now,
	accessibilityLabel,
	className,
	...props
}: PostAuthorProps): ReactElement {
	const { variant, size } = usePostPart("Post.Author");
	const { handleInline } = resolvePostLayout(variant);
	const slots = postVariants({ variant, size });
	const relative = date ? formatRelativeTime(date, now ?? new Date()) : null;
	const shortTime = timestamp ?? relative?.short ?? "";
	const spokenTime = timestamp ?? relative?.spoken ?? "";
	const label = accessibilityLabel ?? resolveAuthorA11yLabel({ name, handle, verified, spokenTime });
	const meta = [handle, shortTime].filter((part): part is string => Boolean(part)).join(" · ");

	const content = (
		<>
			<Avatar fallback={fallback} name={name} size={resolvePostAvatarSize(size, variant)} source={avatar} />
			<View className={slots.authorText()}>
				<View className={slots.authorLine()}>
					<Text className={slots.authorName()} numberOfLines={1}>
						{name}
					</Text>
					{verified ? <Icon className={slots.authorVerified()} color="info" icon={IconCheckCircle2} /> : null}
					{handleInline && meta ? (
						<Text className={slots.authorHandle()} numberOfLines={1}>
							{meta}
						</Text>
					) : null}
				</View>
				{!handleInline && meta ? (
					<Text className={slots.authorMeta()} numberOfLines={1}>
						{meta}
					</Text>
				) : null}
			</View>
		</>
	);

	if (onPress) {
		return (
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				className={slots.author({ className })}
				feedback="fade"
				onPress={onPress}
				{...props}
			>
				{content}
			</Pressable>
		);
	}

	return (
		<View accessibilityLabel={label} accessible className={slots.author({ className })} {...props}>
			{content}
		</View>
	);
}
PostAuthor.displayName = "DelacourUI.Post.Author";
