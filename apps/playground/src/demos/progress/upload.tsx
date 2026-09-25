import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconFileJpg, IconFilePdf, IconFileZip } from "@delacour/react-native-ui/icons/central";
import { Progress, type ProgressColor } from "@delacour/react-native-ui/progress";
import { type ComponentProps, type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An upload queue",
	note: "A composed card: each row's bar is fed by a ticking upload, counts in megabytes through formatOptions, and turns success when it lands or destructive when it fails. Start, pause and retry are ordinary state — the bar only ever renders the value it is handed.",
	capture: { align: "stretch" },
};

type Status = { kind: "waiting" } | { kind: "uploading" } | { kind: "paused" } | { kind: "failed" } | { kind: "done" };

type Upload = {
	id: string;
	name: string;
	icon: ComponentProps<typeof Icon>["icon"];
	sizeMb: number;
	sentMb: number;
	/** Where a simulated connection drops, so the failed state is reachable. */
	failsAtMb?: number;
	status: Status;
};

const INITIAL: Upload[] = [
	{ icon: IconFilePdf, id: "brief", name: "Brief.pdf", sentMb: 4.2, sizeMb: 4.2, status: { kind: "done" } },
	{ icon: IconFileJpg, id: "hero", name: "Hero shot.jpg", sentMb: 3.1, sizeMb: 8.4, status: { kind: "paused" } },
	{
		failsAtMb: 14,
		icon: IconFileZip,
		id: "assets",
		name: "Assets.zip",
		sentMb: 0,
		sizeMb: 24,
		status: { kind: "waiting" },
	},
];

const MEGABYTES = { maximumFractionDigits: 1, style: "unit", unit: "megabyte" } as const;
const TICK_MS = 120;
const MB_PER_TICK = 0.3;

const COLORS: Record<Status["kind"], ProgressColor> = {
	waiting: "default",
	uploading: "primary",
	paused: "warning",
	failed: "destructive",
	done: "success",
};

const STATUS_LABELS: Record<Status["kind"], string> = {
	waiting: "Waiting",
	uploading: "Uploading",
	paused: "Paused",
	failed: "Failed",
	done: "Done",
};

function advance(upload: Upload): Upload {
	if (upload.status.kind !== "uploading") return upload;
	const sentMb = Math.min(upload.sizeMb, upload.sentMb + MB_PER_TICK);
	if (upload.failsAtMb !== undefined && sentMb >= upload.failsAtMb) {
		return { ...upload, failsAtMb: undefined, sentMb: upload.failsAtMb, status: { kind: "failed" } };
	}
	return { ...upload, sentMb, status: sentMb >= upload.sizeMb ? { kind: "done" } : upload.status };
}

function UploadRow({ upload, onToggle }: { upload: Upload; onToggle: () => void }): ReactElement {
	const { kind } = upload.status;
	const action = kind === "uploading" ? "Pause" : kind === "failed" ? "Retry" : kind === "done" ? null : "Start";

	return (
		<View className="flex-row items-center gap-3 px-4 py-3">
			<Icon icon={upload.icon} />
			<Progress
				accessibilityLabel={`${upload.name}, ${STATUS_LABELS[kind]}`}
				className="flex-1"
				color={COLORS[kind]}
				formatOptions={MEGABYTES}
				maxValue={upload.sizeMb}
				size="sm"
				testID={`upload-${upload.id}`}
				value={upload.sentMb}
			>
				<Progress.Header>
					<Progress.Label>{upload.name}</Progress.Label>
					<Progress.Output>{({ formatted }) => `${STATUS_LABELS[kind]} · ${formatted}`}</Progress.Output>
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
			<View className="w-16 items-end">
				{action === null ? null : (
					<Button onPress={onToggle} size="sm" testID={`upload-${upload.id}-action`} variant="ghost">
						<Button.Label>{action}</Button.Label>
					</Button>
				)}
			</View>
		</View>
	);
}

export function Demo(): ReactElement {
	const [uploads, setUploads] = useState(INITIAL);
	const isRunning = uploads.some((upload) => upload.status.kind === "uploading");

	useEffect(() => {
		if (!isRunning) return;
		const timer = setInterval(() => setUploads((current) => current.map(advance)), TICK_MS);
		return () => clearInterval(timer);
	}, [isRunning]);

	const toggle = (id: string): void => {
		setUploads((current) =>
			current.map((upload) => {
				if (upload.id !== id) return upload;
				return upload.status.kind === "uploading"
					? { ...upload, status: { kind: "paused" } }
					: { ...upload, status: { kind: "uploading" } };
			})
		);
	};

	return (
		<View className="gap-3">
			<View className="overflow-hidden rounded-lg border border-border bg-card">
				{uploads.map((upload, index) => (
					<View className={index > 0 ? "border-border border-t" : undefined} key={upload.id}>
						<UploadRow onToggle={() => toggle(upload.id)} upload={upload} />
					</View>
				))}
			</View>
			<Button onPress={() => setUploads(INITIAL)} size="sm" testID="upload-reset" variant="secondary">
				<Button.Label>Reset queue</Button.Label>
			</Button>
		</View>
	);
}
