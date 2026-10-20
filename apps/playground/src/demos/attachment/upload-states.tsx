import { Attachment, type AttachmentStatus } from "@delacour/react-native-ui/attachment";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Upload states",
	note: "The app owns the upload and hands the attachment its `status`. Uploading draws a bar — determinate with a `progress`, looping without — and remove becomes cancel. An error edges it in the destructive colour, shows the app's message and offers retry.",
	capture: { align: "stretch", flow: true, hero: true },
};

const TICK_MS = 120;
const STEP = 0.04;

function nextStatus(status: AttachmentStatus): AttachmentStatus {
	if (status.type !== "uploading") return status;
	const progress = Math.min(1, (status.progress ?? 0) + STEP);
	return progress >= 1 ? { type: "done" } : { progress, type: "uploading" };
}

export function Demo(): ReactElement {
	const [status, setStatus] = useState<AttachmentStatus>({ type: "idle" });
	const [failed, setFailed] = useState<AttachmentStatus>({
		message: "The connection dropped.",
		type: "error",
	});
	const isUploading = status.type === "uploading";

	useEffect(() => {
		if (!isUploading) return;
		const timer = setInterval(() => setStatus(nextStatus), TICK_MS);
		return () => clearInterval(timer);
	}, [isUploading]);

	return (
		<View className="gap-3">
			<Attachment
				kind="file"
				name="floor-plan.pdf"
				onRemove={() => setStatus({ type: "idle" })}
				sizeBytes={3_145_728}
				status={status}
				testID="attachment-upload-live"
			/>
			<Attachment
				kind="video"
				name="site-visit.mp4"
				onRemove={() => undefined}
				sizeBytes={41_943_040}
				status={{ type: "uploading" }}
			/>
			<Attachment
				kind="image"
				name="elevation.png"
				onRemove={() => setFailed({ message: "The connection dropped.", type: "error" })}
				onRetry={() => setFailed({ type: "done" })}
				removeTestID="attachment-upload-error-remove"
				retryTestID="attachment-upload-error-retry"
				sizeBytes={907_264}
				source={{ uri: "https://picsum.photos/seed/elevation/240" }}
				status={failed}
				testID="attachment-upload-error"
			/>
			<Button
				onPress={() => {
					setStatus({ progress: 0, type: "uploading" });
					setFailed({ message: "The connection dropped.", type: "error" });
				}}
				size="sm"
				testID="attachment-upload-start"
				variant="secondary"
			>
				<Button.Label>Upload</Button.Label>
			</Button>
		</View>
	);
}
