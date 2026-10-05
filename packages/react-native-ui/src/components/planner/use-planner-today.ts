import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { msUntilNextMidnight, toDayKey } from "./planner-dates";

function startOfToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Local midnight today, kept current.
 *
 * A timer is armed for the next local midnight — measured against that
 * midnight, so a 23- or 25-hour day still lands on 00:00 — and re-armed each
 * time it fires. A timer does not run while the app is suspended, so returning
 * to the foreground re-reads the clock and re-arms it too. The same `Date` is
 * kept while the day has not changed, so nothing downstream re-renders for it.
 */
export function usePlannerToday(): Date {
	const [today, setToday] = useState(startOfToday);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;

		const refresh = (): void => {
			const next = startOfToday();
			setToday((current) => (toDayKey(current) === toDayKey(next) ? current : next));
		};
		const arm = (): void => {
			if (timer !== undefined) clearTimeout(timer);
			timer = setTimeout(() => {
				refresh();
				arm();
			}, msUntilNextMidnight(new Date()));
		};

		arm();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state !== "active") return;
			refresh();
			arm();
		});

		return () => {
			if (timer !== undefined) clearTimeout(timer);
			subscription.remove();
		};
	}, []);

	return today;
}
