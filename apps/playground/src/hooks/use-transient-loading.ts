import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A loading flag that switches itself back off.
 *
 * The interesting part of `isLoading` is the transition in *and* out — a flag
 * that stays on only ever exercises half of it.
 */
export function useTransientLoading(durationMs = 2500): [boolean, () => void] {
	const [isLoading, setIsLoading] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[]
	);

	const start = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		setIsLoading(true);
		timer.current = setTimeout(() => setIsLoading(false), durationMs);
	}, [durationMs]);

	return [isLoading, start];
}
