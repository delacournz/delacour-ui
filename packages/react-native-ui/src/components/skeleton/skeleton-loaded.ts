import { useEffect, useRef } from "react";
import { useAnnounce } from "../../hooks/use-announce";
import { resolveSkeletonLoadedMessage } from "./skeleton.variants";

/**
 * Tells a screen reader that a labelled skeleton's content has arrived.
 *
 * A busy status going away is silent, so a user who heard "Loading inbox" gets
 * no word that the inbox is there. This speaks once on the loading to loaded
 * edge, through the announcement route — nothing on screen carries the text, so
 * no live region is involved. It never speaks on mount, and an unlabelled
 * skeleton never speaks.
 */
export function useSkeletonLoadedAnnouncement({
	isLoading,
	label,
	loadedLabel,
	announce: enabled = true,
}: {
	isLoading: boolean;
	label?: string;
	loadedLabel?: string;
	announce?: boolean;
}): void {
	const speak = useAnnounce();
	const wasLoading = useRef(isLoading);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only a change of the loading flag can announce; label and options are read as rendered
	useEffect(() => {
		const message = resolveSkeletonLoadedMessage({ label, loadedLabel, wasLoading: wasLoading.current, isLoading });
		wasLoading.current = isLoading;
		if (message) speak(message, { enabled });
	}, [isLoading]);
}
