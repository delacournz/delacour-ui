import { LinearGradient } from "expo-linear-gradient";
import { type ReactElement, type ReactNode, useState } from "react";
import {
	Image,
	type ImageProps,
	type ImageSourcePropType,
	type ImageURISource,
	StyleSheet,
	View,
	type ViewProps,
} from "react-native";
import { IconImages1 } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { usePostPart } from "./post.context";
import {
	POST_SCRIM_COLOR,
	type PostMediaScrim,
	postVariants,
	resolveMediaScrim,
	resolvePostLayout,
	resolveScrimStops,
} from "./post.variants";

/** The frame's shape when the caller names none — a little wider than tall, so a feed of them reads as rows. */
const POST_MEDIA_ASPECT_RATIO = 16 / 10;
/** The transparent end of a scrim: the scrim's own black at zero alpha, so the fade never greys through white. */
const POST_SCRIM_CLEAR = "rgba(0, 0, 0, 0)";

export type PostMediaProps = Omit<ViewProps, "children"> & {
	/** The picture. */
	source?: ImageSourcePropType;
	/** What the picture shows, read by a screen reader. `""` marks it decorative and skips it. */
	alt?: string;
	/** Width over height. The card's height never depends on the picture's own size. @default 16 / 10 */
	aspectRatio?: number;
	/** Which edges darken under type laid over the picture. Defaults by variant — `"top"` in `media`. */
	scrim?: PostMediaScrim;
	/** Opens the picture — the app's viewer or lightbox. */
	onPress?: PressableProps["onPress"];
	/** Replaces the `Image`; the frame, corners, aspect ratio and scrim stay. The slot for a gallery or a video. */
	children?: ReactNode;
	/** Passed to the `Image`. */
	imageProps?: Omit<ImageProps, "source" | "accessibilityLabel">;
	className?: string;
};

/** A stable key for a source, so a new inline `{ uri }` object is not a new picture but a new URI is. */
function sourceKeyOf(source: ImageSourcePropType | undefined): string {
	if (source === undefined) return "";
	if (typeof source === "number") return `asset:${source}`;
	if (isSourceList(source)) return source.map((entry) => entry.uri ?? "").join("|");
	return source.uri ?? "";
}

/** `Array.isArray` does not narrow a `readonly` array out of a union, so the list case is named. */
function isSourceList(source: ImageURISource | readonly ImageURISource[]): source is readonly ImageURISource[] {
	return Array.isArray(source);
}

/**
 * A post's picture, in a frame of fixed shape.
 *
 * The frame's height comes from `aspectRatio`, never from the picture, so a
 * tall photo and a wide one make the same card and a feed does not jump as
 * pictures arrive. A muted fill sits under the image while it loads, and an
 * image glyph takes its place if it fails — same frame, no layout shift.
 *
 * `children` replace the `Image` inside the same framed, scrimmed box: that is
 * where an app drops a gallery, a carousel or a video. Post imports none of
 * them.
 *
 * In `compact` — a timeline row with no picture — it renders nothing, and says
 * so in development.
 */
export function PostMedia({
	source,
	alt,
	aspectRatio = POST_MEDIA_ASPECT_RATIO,
	scrim,
	onPress,
	children,
	imageProps,
	className,
	style,
	...props
}: PostMediaProps): ReactElement | null {
	const { variant } = usePostPart("Post.Media");
	const slots = postVariants({ variant });
	const sourceKey = sourceKeyOf(source);
	const [failedKey, setFailedKey] = useState<string | null>(null);
	const stops = resolveScrimStops(resolveMediaScrim(variant, scrim));

	if (!resolvePostLayout(variant).hasMedia) {
		if (__DEV__) {
			console.warn(`Post.Media renders nothing in the "${variant}" variant — a timeline row has no picture.`);
		}
		return null;
	}

	const isDecorative = alt === "";
	const hasFailed = source !== undefined && failedKey === sourceKey;

	const picture =
		children ??
		(hasFailed || source === undefined ? (
			<View className={slots.mediaFallback()}>
				<Icon className={slots.mediaFallbackIcon()} color="muted-foreground" icon={IconImages1} />
			</View>
		) : (
			<Image
				accessibilityIgnoresInvertColors
				resizeMode="cover"
				{...imageProps}
				className={cn(slots.mediaImage(), imageProps?.className)}
				onError={(event) => {
					setFailedKey(sourceKey);
					imageProps?.onError?.(event);
				}}
				source={source}
			/>
		));

	const frame = (
		<>
			{picture}
			{stops.top ? (
				<View className={slots.mediaScrim({ className: "top-0" })} pointerEvents="none">
					<LinearGradient colors={[POST_SCRIM_COLOR, POST_SCRIM_CLEAR]} style={StyleSheet.absoluteFill} />
				</View>
			) : null}
			{stops.bottom ? (
				<View className={slots.mediaScrim({ className: "bottom-0" })} pointerEvents="none">
					<LinearGradient colors={[POST_SCRIM_CLEAR, POST_SCRIM_COLOR]} style={StyleSheet.absoluteFill} />
				</View>
			) : null}
		</>
	);

	const a11y = isDecorative
		? { accessible: false, importantForAccessibility: "no-hide-descendants" as const }
		: { accessibilityLabel: alt, accessibilityRole: "image" as const, accessible: alt !== undefined };

	// A `Pressable` takes no `style`, and the frame's shape is a runtime number no
	// class can carry, so a pressable picture is the same framed `View` with a
	// press target laid over the whole of it.
	if (onPress) {
		return (
			<View className={slots.media({ className })} style={[{ aspectRatio }, style]} {...props}>
				<Pressable
					className={slots.mediaPress()}
					feedback="fade"
					onPress={onPress}
					{...a11y}
					accessibilityRole={isDecorative ? undefined : "imagebutton"}
				>
					{frame}
				</Pressable>
			</View>
		);
	}

	return (
		<View className={slots.media({ className })} style={[{ aspectRatio }, style]} {...a11y} {...props}>
			{frame}
		</View>
	);
}
PostMedia.displayName = "DelacourUI.Post.Media";
