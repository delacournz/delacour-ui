import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { type PreviewEntry, type PreviewId, type PreviewMedia, previews } from "@/previews/manifest";

export type PreviewProps = {
	id: PreviewId;
	/** Show the generated snippet beside the media. Default true. */
	code?: boolean;
	/** `split` puts the code beside the media on large screens; `stacked` puts it below. */
	layout?: "split" | "stacked";
	/** Override the manifest's title, or pass `null` for no caption. */
	title?: string | null;
};

/**
 * A component preview: media captured from a simulator, and the code that
 * produced it.
 *
 * The library ships raw `.tsx` compiled by Uniwind's **Metro** transform, so
 * these components cannot render on the web at all — see this app's AGENTS.md.
 * The media here is the real component photographed on a real device, which is
 * a more honest illustration than a react-native-web reproduction would be
 * anyway.
 *
 * Both the picture and the snippet come from one demo file in the playground,
 * so neither can drift from the other or from the component they show.
 */
export function Preview({ id, code = true, layout = "split", title }: PreviewProps): ReactElement {
	const entry: PreviewEntry | undefined = previews[id];

	if (!entry) {
		throw new Error(
			`Unknown preview "${id}". Run \`bun run previews\` from the repo root, ` +
				"or check apps/web/src/previews/manifest.ts for the ids that exist."
		);
	}

	const caption = title === undefined ? entry.title : title;
	const split = code && layout === "split";

	return (
		<figure
			className={
				split
					? "not-prose my-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start"
					: "not-prose my-6 flex flex-col gap-4"
			}
		>
			<div className="flex flex-col gap-2">
				<PreviewFrame entry={entry} />
				{caption === null ? null : <figcaption className="text-sm text-fd-muted-foreground">{caption}</figcaption>}
			</div>
			{code ? <DynamicCodeBlock code={entry.code} lang="tsx" /> : null}
		</figure>
	);
}

/**
 * The surface the media sits on.
 *
 * A `device` capture is the whole screen, so it gets a phone bezel. A `stage`
 * capture is the component alone on the app's own background, so it gets a
 * plain card — a component floating inside a phone silhouette reads as a
 * screenshot of somebody's app rather than as the component itself.
 *
 * The captured background is the library's `background` token, which is the
 * same value `app.css` transcribes onto `--color-fd-background`, so the media
 * meets the page with no colour seam.
 */
function PreviewFrame({ entry }: { entry: PreviewEntry }): ReactElement {
	if (entry.frame === "device") {
		return (
			<div className="flex justify-center">
				<div className="group/preview rounded-[2.5rem] border border-fd-border bg-fd-card p-[6px] shadow-lg">
					<div className="overflow-hidden rounded-[2.1rem]">
						<ThemedPreview entry={entry} className="block h-auto w-full max-w-[280px]" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="group/preview overflow-hidden rounded-xl border border-fd-border bg-fd-background">
			<ThemedPreview entry={entry} className="block h-auto w-full" />
		</div>
	);
}

/**
 * Both themes, swapped by CSS.
 *
 * Fumadocs redefines Tailwind's `dark` variant as `&:where(.dark, .dark *)` and
 * drives it with a class on `<html>`, so this needs no hook and no
 * mounted-guard — which is what keeps it free of the hydration flash a
 * `useTheme()` swap would have. The hidden branch is `display: none`, so the
 * browser never fetches it.
 *
 * `width`/`height` are the media's intrinsic pixels, so the box is reserved
 * before the image loads and the page does not jump.
 */
export function ThemedPreview({ entry, className }: { entry: PreviewEntry; className: string }): ReactElement {
	return (
		<>
			<MediaFor className={`${className} dark:hidden`} entry={entry} media={entry.light} />
			<MediaFor className={`${className} hidden dark:block`} entry={entry} media={entry.dark} />
		</>
	);
}

function MediaFor({
	className,
	entry,
	media,
}: {
	className: string;
	entry: PreviewEntry;
	media: PreviewMedia;
}): ReactElement {
	if (media.video) return <PreviewVideo className={className} entry={entry} src={media.video} poster={media.poster} />;

	return (
		<img
			alt={entry.title}
			className={className}
			decoding="async"
			height={entry.height}
			loading="lazy"
			src={media.poster}
			width={entry.width}
		/>
	);
}

/**
 * A looping clip of the component being used.
 *
 * Plays only while it is on screen, and starts from the observer rather than
 * from `autoplay`. That distinction is what makes `preload="none"` mean
 * anything: an `autoplay` video is fetched even with `display: none`, so the
 * off-theme copy of every clip would download on page load. Left to the
 * observer, a hidden branch never intersects, never plays and never loads.
 *
 * The same mechanism keeps the components index cheap — a card per component,
 * and only the ones actually on screen decoding.
 *
 * Honours `prefers-reduced-motion`, which for a silent looping animation is not
 * a nicety: this is exactly the kind of endless movement that setting exists to
 * stop. Those visitors get the poster and a play button.
 *
 * Everything here is in an effect. This app server-renders, so touching
 * `window` or `matchMedia` at module scope or during render would break the
 * server build outright.
 */
function PreviewVideo({
	className,
	entry,
	poster,
	src,
}: {
	className: string;
	entry: PreviewEntry;
	poster: string;
	src: string;
}): ReactElement {
	const video = useRef<HTMLVideoElement>(null);
	const [paused, setPaused] = useState(false);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);
		setPaused(query.matches);

		const onChange = (event: MediaQueryListEvent): void => {
			setReduced(event.matches);
			setPaused(event.matches);
		};
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		const element = video.current;
		if (!element || reduced) return;

		const observer = new IntersectionObserver(
			([visible]) => {
				if (visible?.isIntersecting) void element.play().catch(() => undefined);
				else element.pause();
			},
			{ threshold: 0.2 }
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [reduced]);

	const toggle = (): void => {
		const element = video.current;
		if (!element) return;
		if (element.paused) void element.play().catch(() => undefined);
		else element.pause();
	};

	const replay = (): void => {
		const element = video.current;
		if (!element) return;
		element.currentTime = 0;
		void element.play().catch(() => undefined);
	};

	return (
		<div className="relative">
			<video
				aria-label={entry.title}
				className={className}
				height={entry.height}
				loop
				muted
				onPause={() => setPaused(true)}
				onPlay={() => setPaused(false)}
				playsInline
				poster={poster}
				preload="none"
				ref={video}
				src={src}
				width={entry.width}
			/>
			<div className="absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/preview:opacity-100">
				<PreviewButton label={paused ? "Play" : "Pause"} onClick={toggle}>
					{paused ? "▶" : "❙❙"}
				</PreviewButton>
				<PreviewButton label="Replay" onClick={replay}>
					↺
				</PreviewButton>
			</div>
		</div>
	);
}

function PreviewButton({
	children,
	label,
	onClick,
}: {
	children: ReactElement | string;
	label: string;
	onClick: () => void;
}): ReactElement {
	return (
		<button
			aria-label={label}
			className="rounded-md bg-fd-background/80 px-2 py-1 text-fd-muted-foreground text-xs backdrop-blur transition-colors hover:text-fd-foreground"
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}
