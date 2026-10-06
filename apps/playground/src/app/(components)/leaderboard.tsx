import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { leaderboardDemos } from "@/demos/leaderboard";

export default function LeaderboardGallery(): ReactElement {
	return <DemoGallery demos={leaderboardDemos} title="Leaderboard" />;
}
