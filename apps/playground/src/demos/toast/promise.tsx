import { Button } from "@delacour/react-native-ui/button";
import { toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Promise",
	caption:
		"`toast.promise` shows one toast with a spinner and turns it into the success or the failure in place. Called from a plain function — no hook, no provider.",
	align: "center",
	capture: { flow: "toast/promise", frame: "device" },
};

/** Stands in for an API call: settles after a second and a half. */
function upload(shouldFail: boolean): Promise<number> {
	return new Promise((resolve, reject) => {
		setTimeout(() => (shouldFail ? reject(new Error("The server is offline")) : resolve(3)), 1500);
	});
}

/** A plain module function, the way an API client would call it. */
function uploadPhotos(shouldFail: boolean): void {
	toast
		.promise(upload(shouldFail), {
			loading: "Uploading 3 photos…",
			success: (count) => `${count} photos uploaded`,
			error: (error) => (error instanceof Error ? error.message : "Upload failed"),
		})
		.catch(() => undefined);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-1 flex-row items-center justify-center gap-3">
			<Button onPress={() => uploadPhotos(false)} testID="toast-promise-success">
				Upload
			</Button>
			<Button onPress={() => uploadPhotos(true)} testID="toast-promise-error" variant="destructive-soft">
				Upload offline
			</Button>
		</View>
	);
}
