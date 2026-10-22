import { expect, test } from "@delacour/warden-e2e";

test("data explorer keeps IDs selected across query changes and retries", async ({ device, screen }) => {
	await device.openLink("dlc-ui-playground://preview?component=table&demo=data-explorer&theme=dark");
	await screen.getByTestId("data-explorer-row-INV-00001").waitFor({ state: "visible" });
	await screen.getByTestId("data-explorer-row-INV-00001").tap();
	await expect(screen.getByText("1 selected", { exact: true })).toBeVisible();
	await screen.getByTestId("data-explorer-sort-amount").tap();
	await screen.getByText("Next page", { exact: true }).tap();
	await screen.getByTestId("data-explorer-filter-paid").tap();
	await expect(screen.getByText("1 selected", { exact: true })).toBeVisible();
	await screen.getByTestId("data-explorer-reset-demo").tap();
	await screen.getByTestId("data-explorer-row-INV-00001").waitFor({ state: "visible" });
	await screen.getByTestId("data-explorer-select-page").tap();
	await expect(screen.getByText("20 selected", { exact: true })).toBeVisible();
	await screen.getByText("Archive", { exact: true }).tap();
	await expect(screen.getByText("Archive failed. Retry the action.", { exact: true })).toBeVisible();
	await screen.getByText("Retry archive", { exact: true }).tap();
	await expect(screen.getByText("0 selected", { exact: true })).toBeVisible();
	await screen.getByText("Next page", { exact: true }).tap();
	await expect(screen.getByText("21–40 of 9,980", { exact: true })).toBeVisible();
	await screen.getByTestId("data-explorer-simulate-error").tap();
	await expect(screen.getByText("The request failed. Previous results are stale.", { exact: true })).toBeVisible();
	await screen.getByTestId("data-explorer-retry-query").tap();
	await expect(screen.getByText("The request failed. Previous results are stale.", { exact: true })).toBeHidden();
});
