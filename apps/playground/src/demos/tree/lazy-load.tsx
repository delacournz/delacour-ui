import { Spinner } from "@delacour/react-native-ui/spinner";
import { Tree, type TreeExpandedChangeDetails } from "@delacour/react-native-ui/tree";
import { type ReactElement, useEffect, useRef, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Lazy loading",
	caption:
		"`hasChildren` marks a node a branch before its children exist, so the chevron shows from the start. Opening it fetches the children, with a spinner in `Tree.Actions` until they arrive. Northland starts loaded and open; the rest fetch on first open.",
	capture: { align: "stretch", flow: "tree/lazy-load" },
};

/** How long the pretend fetch takes, so the loading state is visible. */
const FETCH_MS = 900;

const REGIONS = ["Northland", "Auckland", "Wellington", "Canterbury"] as const;

const CITIES: Record<(typeof REGIONS)[number], readonly string[]> = {
	Northland: ["Whangārei", "Kerikeri"],
	Auckland: ["Auckland Central", "Manukau"],
	Wellington: ["Wellington", "Lower Hutt"],
	Canterbury: ["Christchurch", "Timaru"],
};

export function Demo(): ReactElement {
	const [loaded, setLoaded] = useState<Partial<Record<string, readonly string[]>>>({
		Northland: CITIES.Northland,
	});
	const [loading, setLoading] = useState<readonly string[]>([]);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		const pending = timers.current;
		return () => {
			for (const timer of pending) clearTimeout(timer);
		};
	}, []);

	const handleExpandedChange = (_: string[], { value, isExpanded }: TreeExpandedChangeDetails) => {
		if (!isExpanded || loaded[value] || loading.includes(value)) return;
		setLoading((current) => [...current, value]);
		timers.current.push(
			setTimeout(() => {
				setLoading((current) => current.filter((region) => region !== value));
				setLoaded((current) => ({ ...current, [value]: CITIES[value as (typeof REGIONS)[number]] }));
			}, FETCH_MS)
		);
	};

	return (
		<Tree defaultExpanded={["Northland"]} onExpandedChange={handleExpandedChange}>
			{REGIONS.map((region) => {
				const cities = loaded[region];
				return (
					<Tree.Item hasChildren key={region} value={region}>
						<Tree.Trigger testID={`lazy-${region}`}>
							<Tree.Label>{region}</Tree.Label>
							{loading.includes(region) ? (
								<Tree.Actions>
									<Spinner />
								</Tree.Actions>
							) : null}
						</Tree.Trigger>
						{cities ? (
							<Tree.Group>
								{cities.map((city) => (
									<Tree.Item key={city} value={`${region}/${city}`}>
										<Tree.Trigger>{city}</Tree.Trigger>
									</Tree.Item>
								))}
							</Tree.Group>
						) : null}
					</Tree.Item>
				);
			})}
		</Tree>
	);
}
