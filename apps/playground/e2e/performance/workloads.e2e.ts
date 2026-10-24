import { expect, test } from "@delacour/warden-e2e";
import { PERFORMANCE_PROTOCOL, PERFORMANCE_WORKLOAD_IDS } from "../../src/performance/protocol";

for (const workload of PERFORMANCE_WORKLOAD_IDS) {
	test(`${workload} completes the protocol`, async ({ device, screen }) => {
		await device.openLink(`dlc-ui-playground://performance?workload=${workload}`);
		await screen.getByTestId("performance-start").tap();
		await expect(screen.getByTestId("performance-status")).toContainText(`${workload}:running`);
		if (workload === "long-list") {
			const box = await screen.getByTestId("performance-list").boundingBox();
			const x = box.x + box.width / 2;
			await screen.gesture.path({
				durationMs: PERFORMANCE_PROTOCOL.durationMs,
				paths: [
					Array.from({ length: 13 }, (_, index) => ({ x, y: box.y + box.height * (index % 2 === 0 ? 0.8 : 0.2) })),
				],
			});
		}
		if (workload === "keyboard-sheet") {
			for (let cycle = 0; cycle < PERFORMANCE_PROTOCOL.keyboardCycles; cycle++) {
				await screen.getByTestId("performance-keyboard-open").tap();
				await screen.getByTestId("performance-keyboard-input").tap();
				await screen.getByTestId("performance-keyboard-input").type(PERFORMANCE_PROTOCOL.keyboardText);
				await screen.getByTestId("performance-keyboard-submit").tap();
				await expect(screen.getByTestId("performance-sheet")).toBeHidden();
			}
		}
		await expect(screen.getByTestId("performance-status")).toContainText(`${workload}:complete`, { timeout: 300_000 });
		if (workload === "keyboard-sheet" || workload === "overlay-lifecycle") {
			const count =
				workload === "keyboard-sheet" ? PERFORMANCE_PROTOCOL.keyboardCycles : PERFORMANCE_PROTOCOL.overlayCycles;
			await expect(screen.getByTestId("performance-cycles")).toContainText(
				`Cycles: ${count}; input losses: 0; closed: true`
			);
			await expect(screen.getByTestId("performance-sheet")).toBeHidden();
			await expect(screen.getByTestId("performance-dialog")).toBeHidden();
		}
	});
}

test("stop permits a fresh run", async ({ device, screen }) => {
	await device.openLink("dlc-ui-playground://performance?workload=keyboard-sheet");
	await screen.getByTestId("performance-start").tap();
	await screen.getByTestId("performance-stop").tap();
	await expect(screen.getByTestId("performance-status")).toContainText("stopped");
	await screen.getByTestId("performance-start").tap();
	await expect(screen.getByTestId("performance-status")).toContainText("running:run-2");
	await screen.getByTestId("performance-stop").tap();
});
