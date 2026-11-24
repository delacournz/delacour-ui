import { describe, expect, test } from "bun:test";
import {
	areLabelsShallowEqual,
	DELACOUR_DEFAULT_LABELS,
	type DelacourLabelOverrides,
	mergeLabelOverrides,
	resolveLabels,
} from "./labels";

describe("DELACOUR_DEFAULT_LABELS", () => {
	test("alert is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.alert;
		expect(labels.dismiss).toBe("Dismiss");
		expect(labels.announcement("Saved", "All good")).toBe("Saved. All good");
		expect(labels.announcement("Saved!", "All good")).toBe("Saved! All good");
		expect(labels.announcement("Note:", "read")).toBe("Note: read");
	});

	test("attachment is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.attachment;
		expect(labels.kind("image")).toBe("Photo");
		expect(labels.kind("file")).toBe("File");
		expect(labels.fileSize("2.4", "megabyte")).toBe("2.4 MB");
		expect(labels.fileSize("1,023", "byte")).toBe("1,023 B");
		expect(labels.spokenFileSize(1, "1", "kilobyte")).toBe("1 kilobyte");
		expect(labels.spokenFileSize(2.4, "2.4", "megabyte")).toBe("2.4 megabytes");
		expect(labels.spokenDuration({ hours: 0, minutes: 1, seconds: 5 })).toBe("1 minute 5 seconds");
		expect(labels.spokenDuration({ hours: 1, minutes: 0, seconds: 0 })).toBe("1 hour");
		expect(labels.spokenDuration({ hours: 0, minutes: 0, seconds: 0 })).toBe("0 seconds");
		expect(labels.meta(["1:05", "1 KB", "MP3"])).toBe("1:05 · 1 KB · MP3");
		expect(labels.summary(["Photo", "beach.jpg", "uploading"])).toBe("Photo, beach.jpg, uploading");
		expect(labels.notSent).toBe("not sent");
		expect(labels.uploading).toBe("uploading");
		expect(labels.uploadFailed).toBe("upload failed");
		expect(labels.remove("report.pdf")).toBe("Remove report.pdf");
		expect(labels.cancelUpload).toBe("Cancel upload");
		expect(labels.retryUpload).toBe("Retry upload");
		expect(labels.uploadFailedAnnouncement("a.pdf", "Network lost")).toBe("Upload failed, a.pdf, Network lost");
		expect(labels.position(2, 5)).toBe("2 of 5");
		expect(labels.group).toBe("Attachments");
	});

	test("avatar is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.avatar;
		expect(labels.button).toBe("Avatar");
		expect(labels.overflow(37)).toBe("37 more");
		expect(labels.overflowText(37, 99)).toBe("+37");
		expect(labels.overflowText(120, 99)).toBe("99+");
	});

	test("badge, chip, contextMenu and dialog are today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.badge.remove).toBe("Remove");
		expect(DELACOUR_DEFAULT_LABELS.chip.remove).toBe("Remove");
		expect(DELACOUR_DEFAULT_LABELS.contextMenu.show).toBe("Show menu");
		expect(DELACOUR_DEFAULT_LABELS.dialog.close).toBe("Close");
	});

	test("bottomSheet is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.bottomSheet;
		expect(labels.close).toBe("Close");
		expect(labels.overlay).toBe("Close");
		expect(labels.handle).toBe("Bottom sheet");
		expect(labels.closed).toBe("Closed");
		expect(labels.snapPoint(2, 3)).toBe("Snap point 2 of 3");
	});

	test("breadcrumb is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.breadcrumb;
		expect(labels.list).toBe("Breadcrumb");
		expect(labels.currentPage).toBe("current page");
		expect(labels.ellipsis(undefined, true)).toBe("Show hidden levels");
		expect(labels.ellipsis(1, true)).toBe("Show 1 hidden level");
		expect(labels.ellipsis(3, true)).toBe("Show 3 hidden levels");
		expect(labels.ellipsis(undefined, false)).toBe("Hidden levels");
		expect(labels.ellipsis(1, false)).toBe("1 hidden level");
		expect(labels.ellipsis(4, false)).toBe("4 hidden levels");
	});

	test("calendar is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.calendar;
		expect(labels.previousMonth).toBe("Previous month");
		expect(labels.nextYear).toBe("Next year");
		expect(labels.previous).toBe("Previous");
		expect(labels.next).toBe("Next");
		expect(labels.openMonths).toBe("Opens the month and year picker");
		expect(labels.openYears).toBe("Opens the year list");
		expect(labels.returnToMonth).toBe("Returns to the month");
		expect(labels.yearSpan("2020", "2031")).toBe("2020 – 2031");
		expect(labels.caption("Date of birth", "October 2026")).toBe("Date of birth, October 2026");
		expect(labels.day("Monday 5 October 2026", [labels.today, labels.rangeStart])).toBe(
			"Monday 5 October 2026, Today, Range start"
		);
		expect(labels.day("Monday 5 October 2026", [])).toBe("Monday 5 October 2026");
		expect(labels.rangeEnd).toBe("Range end");
		expect(labels.openRange("5 Oct 2026")).toBe("5 Oct 2026 –");
		expect(labels.range("5 Oct 2026", "9 Oct 2026")).toBe("5 Oct 2026 – 9 Oct 2026");
	});

	test("carousel is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.carousel;
		expect(labels.previous).toBe("Previous slide");
		expect(labels.next).toBe("Next slide");
		expect(labels.position(2, 5)).toBe("2 of 5");
	});

	test("chart is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.chart;
		expect(labels.noData).toBe("Chart, no data.");
		expect(labels.range("Jan", "Jun")).toBe("Jan to Jun");
		expect(labels.summary("Jan to Jun", ["A: no data.", "B: no data."])).toBe(
			"Chart, Jan to Jun. A: no data. B: no data."
		);
		expect(labels.seriesNoData("Desktop")).toBe("Desktop: no data.");
		expect(labels.seriesSummary("Desktop", "1", "9", "4")).toBe("Desktop: lowest 1, highest 9, latest 4.");
		expect(
			labels.readout("Jan", [labels.readoutRow("Desktop", "186"), labels.readoutRow("Mobile", labels.noValue)])
		).toBe("Jan: Desktop 186, Mobile no value");
		expect(labels.readout("", ["Desktop 186"])).toBe("Desktop 186");
		expect([labels.open, labels.high, labels.low, labels.close]).toEqual(["Open", "High", "Low", "Close"]);
		expect(labels.pieNoData).toBe("Pie chart, no data.");
		expect(labels.pieSummary([labels.pieSummarySlice("Direct", labels.piePercent(42)), "Search 58%"])).toBe(
			"Pie chart. Direct 42%, Search 58%."
		);
		expect(labels.pieSlice("Direct", "1,200", "42%")).toBe("Direct, 1,200, 42%");
	});

	test("colorPicker is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.colorPicker;
		expect(labels.area).toBe("Saturation and brightness");
		expect(labels.hexInput).toBe("Hex colour");
		expect(labels.partInField("Accent", labels.hue)).toBe("Accent, hue");
		expect(labels.partInField("Accent", labels.area)).toBe("Accent, saturation and brightness");
		expect([labels.brighter, labels.darker]).toEqual(["Brighter", "Darker"]);
		expect(labels.areaValue(60, 80)).toBe("Saturation 60 percent, brightness 80 percent");
		expect(labels.hueValue(210, labels.hueName("blue"))).toBe("Hue 210 degrees, blue");
		expect(labels.opacityValue(50)).toBe("Opacity 50 percent");
		expect(labels.trigger(labels.colour, "#f59e0b")).toBe("Colour, #f59e0b, opens picker");
	});

	test("combobox is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.combobox;
		expect(labels.create("Atlantis")).toBe("Use “Atlantis”");
		expect(labels.createAccessibility("Atlantis")).toBe("Add Atlantis");
		expect(labels.empty).toBe("No results");
		expect(labels.search).toBe("Search");
		expect(labels.searchInField("Country", "Search")).toBe("Country, Search");
		expect(labels.clearSearch).toBe("Clear search");
		expect(labels.clear).toBe("Clear");
		expect(labels.triggerHint).toBe("Opens a searchable list of options");
		expect(labels.results(1)).toBe("1 result");
		expect(labels.results(0)).toBe("0 results");
		expect(labels.selected(3)).toBe("3 selected");
		expect(labels.limitReached).toBe("Limit reached");
		expect(labels.done).toBe("Done");
		expect(labels.removeChip("Fiji")).toBe("Remove Fiji");
		expect(labels.moreChips(2)).toBe("2 more");
		expect(labels.moreChipsShort(2)).toBe("+2");
	});

	test("compare is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.compare;
		expect(labels.showingOnly(labels.after)).toBe("Showing only after");
		expect(labels.share(50, labels.before)).toBe("50 percent before");
	});

	test("countdown is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.countdown;
		expect([labels.days, labels.hours, labels.minutes, labels.seconds]).toEqual([
			"Days",
			"Hours",
			"Minutes",
			"Seconds",
		]);
		expect(labels.dayCount(1)).toBe("1 day");
		expect(labels.hourCount(2)).toBe("2 hours");
		expect(labels.minuteCount(1)).toBe("1 minute");
		expect(labels.secondCount(30)).toBe("30 seconds");
		expect(labels.timeUp).toBe("Time is up");
		expect(labels.remaining(["2 days", "3 hours"])).toBe("2 days, 3 hours left");
		expect(labels.inlineDays(2)).toBe("2d");
	});

	test("datePicker is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.datePicker;
		expect(labels.title).toBe("Select date");
		expect([labels.done, labels.clear, labels.trigger]).toEqual(["Done", "Clear", "Date"]);
		expect(labels.triggerHint).toBe("Opens calendar");
		expect(labels.rangePlaceholder).toBe("Start – End");
		expect(labels.multiplePlaceholder).toBe("Select dates");
		expect(labels.rangeEnd).toBe("End");
		expect(labels.dateCount(5)).toBe("5 dates");
		expect(labels.dateList(["5 Oct", "6 Oct"])).toBe("5 Oct, 6 Oct");
		expect(labels.notSet).toBe("not set");
		expect(labels.rangeStarted("5 October")).toBe("From 5 October, no end chosen");
		expect(labels.range("5 October", "9 October")).toBe("5 October to 9 October");
		expect(labels.selected("5 October")).toBe("Selected 5 October");
	});

	test("dateTimePicker is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.dateTimePicker;
		expect(labels.title).toBe("Select date and time");
		expect([labels.done, labels.clear, labels.date, labels.time]).toEqual(["Done", "Clear", "Date", "Time"]);
		expect(labels.trigger).toBe("Date and time");
		expect(labels.triggerHint).toBe("Opens date and time picker");
		expect(labels.placeholder).toBe("Select date and time");
		expect(labels.emptyTime).toBe("–");
		expect(labels.timeRow("Time", labels.notSet)).toBe("Time, not set");
		expect(labels.timeWheelHint(true)).toBe("Hides the time wheel");
		expect(labels.timeWheelHint(false)).toBe("Shows the time wheel");
		expect(labels.dateTime("Monday 5 October 2026", "3:30 PM")).toBe("Monday 5 October 2026 at 3:30 PM");
		expect(labels.selected("x")).toBe("Selected x");
		expect(labels.noneSelected).toBe("No date and time selected");
	});

	test("drawer is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.drawer).toEqual({ close: "Close" });
	});

	test("fab is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.fab).toEqual({ close: "Close" });
	});

	test("feedback is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.feedback).toEqual({
			submit: "Send",
			cancel: "Cancel",
			sent: "Feedback sent",
			failed: "Couldn't send feedback",
		});
	});

	test("flipCard is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.flipCard).toEqual({
			action: "Flip card",
			front: "Front of card",
			back: "Back of card",
			showsBack: "Shows the back",
			showsFront: "Shows the front",
		});
	});

	test("flow is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.flow;
		expect(labels.zoomIn).toBe("Zoom in");
		expect(labels.zoomOut).toBe("Zoom out");
		expect(labels.fit).toBe("Fit to view");
		expect(labels.lock).toBe("Lock canvas");
		expect(labels.select).toBe("Select");
		expect([labels.moveUp, labels.moveDown, labels.moveLeft, labels.moveRight]).toEqual([
			"Move up",
			"Move down",
			"Move left",
			"Move right",
		]);
		expect(labels.delete).toBe("Delete");
		expect(labels.connect("out", "Merge", "first input")).toBe("Connect out to Merge, first input");
		expect(labels.connect(null, "Merge", null)).toBe("Connect to Merge");
	});

	test("imageViewer is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.imageViewer;
		expect(labels.open).toBe("Opens full screen image viewer");
		expect(labels.close).toBe("Close image viewer");
		expect([labels.nextImage, labels.previousImage, labels.zoomIn, labels.zoomOut, labels.resetZoom]).toEqual([
			"Next image",
			"Previous image",
			"Zoom in",
			"Zoom out",
			"Reset zoom",
		]);
		expect(labels.position(2, 5)).toBe("2 of 5");
		expect(labels.counter(2, 5)).toBe("2 / 5");
		expect(labels.loadFailed).toBe("This image could not be loaded");
	});

	test("kpi is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.kpi;
		expect(labels.up).toBe("Up");
		expect(labels.down).toBe("Down");
		expect(labels.flat).toBe("No change");
		expect(labels.percent("7.8")).toBe("7.8 percent");
		expect(labels.noTrendData).toBe("No trend data");
		expect(labels.sparkline(12, "4", "9")).toBe("Trend over 12 points, from 4 to 9");
		expect(labels.loading).toBe("Loading");
	});

	test("leaderboard is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.leaderboard;
		expect(labels.empty).toBe("No entries yet");
		expect(labels.rank(2)).toBe("Rank 2");
		expect(labels.tied).toBe("tied");
		expect(labels.moved("up", 3)).toBe("up 3 places");
		expect(labels.moved("down", 1)).toBe("down 1 place");
		expect(labels.noChange).toBe("no change");
	});

	test("map is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.map).toEqual({
			name: "Map",
			zoomIn: "Zoom in",
			zoomOut: "Zoom out",
			pointNorth: "Point north",
			recenter: "Recenter map",
			showMyLocation: "Show my location",
		});
	});

	test("markdownEditor is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.markdownEditor;
		expect(labels.actions).toEqual({
			bold: "Bold",
			bulletList: "Bulleted list",
			code: "Inline code",
			codeBlock: "Code block",
			heading: "Heading",
			italic: "Italic",
			link: "Link",
			orderedList: "Numbered list",
			quote: "Quote",
			strikethrough: "Strikethrough",
		});
		expect(labels.applied("Bold")).toBe("Bold applied");
		expect(labels.removed("Bold")).toBe("Bold removed");
		expect([labels.write, labels.preview, labels.previewPane]).toEqual(["Write", "Preview", "Preview"]);
		expect(labels.empty).toBe("Nothing to preview");
		expect(labels.bulletItem("Milk")).toBe("bullet Milk");
		expect(labels.linkText).toBe("link");
	});

	test("menu is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.menu).toEqual({ close: "Close menu", triggerHint: "Opens a menu" });
	});

	test("message is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.message;
		const types = ["sending", "sent", "delivered", "read", "failed"] as const;
		expect(types.map((type) => labels.status(type))).toEqual([
			"Sending",
			"Sent",
			"Delivered",
			"Read",
			"Failed to send",
		]);
		expect(labels.status("failed", "No signal")).toBe("Failed: No signal");
		expect(labels.you).toBe("You");
		expect(labels.typing).toBe("Typing");
		expect(labels.typingBy("Aria")).toBe("Aria is typing");
		expect(labels.moreActions).toBe("More actions");
		expect(labels.retry).toBe("Retry");
	});

	test("messageScroller is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.messageScroller;
		expect(labels.list).toBe("Conversation");
		expect(labels.jumpToLatest).toBe("Jump to latest");
		expect(labels.jumpToLatestUnread("Jump to latest", "99+")).toBe("Jump to latest, 99+ unread");
		expect(labels.loadingOlder).toBe("Loading older messages");
		expect([labels.today, labels.yesterday]).toEqual(["Today", "Yesterday"]);
		expect([0, 6].map(labels.weekday)).toEqual(["Sunday", "Saturday"]);
		expect([0, 8, 11].map(labels.month)).toEqual(["Jan", "Sep", "Dec"]);
		expect(labels.date(12, "Sep")).toBe("12 Sep");
		expect(labels.date(12, "Sep", 2025)).toBe("12 Sep 2025");
		expect(labels.unreadDivider(1)).toBe("1 new message");
		expect(labels.unreadDivider(3)).toBe("3 new messages");
		expect(labels.newMessages(1, "Aria")).toBe("New message from Aria");
		expect(labels.newMessages(1)).toBe("New message");
		expect(labels.newMessages(4, "Aria")).toBe("4 new messages");
	});

	test("motion is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.motion).toEqual({ pause: "Pause animation", resume: "Resume animation" });
	});

	test("numberInput is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.numberInput;
		expect([labels.decrease, labels.increase]).toEqual(["Decrease", "Increase"]);
		expect(labels.limit("10", "max")).toBe("10, maximum");
		expect(labels.limit("1", "min")).toBe("1, minimum");
	});

	test("otpInput is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.otpInput;
		expect(labels.defaultLabel).toBe("Verification code");
		expect(labels.progress(2, 4, "digit")).toBe("2 of 4 digits entered");
		expect(labels.progress(0, 1, "character")).toBe("0 of 1 characters entered");
		expect(labels.hint(6, "digit")).toBe("Enter the 6 digit code");
	});

	test("pageHeader is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.pageHeader;
		expect(labels.verifiedAvatar("Aria")).toBe("Aria, verified");
		expect(labels.verified).toBe("Verified");
	});

	test("pagination is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.pagination;
		expect(labels.list).toBe("Pagination");
		expect(labels.previous).toBe("Previous");
		expect(labels.next).toBe("Next");
		expect(labels.previousPage).toBe("Previous page");
		expect(labels.nextPage).toBe("Next page");
		expect(labels.page(3)).toBe("Page 3");
		expect(labels.pageOf(3, 12)).toBe("Page 3 of 12");
		expect(labels.jump(1, 5)).toBe("Jump forward 5 pages");
		expect(labels.jump(-1, 1)).toBe("Jump back 1 page");
		expect(labels.status({ from: 41, to: 60, total: 472 })).toBe("41–60 of 472");
	});
});

describe("resolveLabels", () => {
	test("no overrides gives the defaults", () => {
		expect(resolveLabels("pagination", undefined, undefined)).toEqual(DELACOUR_DEFAULT_LABELS.pagination);
	});

	test("the provider overrides a default", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant" } };
		const labels = resolveLabels("pagination", provider, undefined);
		expect(labels.next).toBe("Suivant");
		expect(labels.previous).toBe("Previous");
	});

	test("the component prop overrides the provider", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant", previous: "Précédent" } };
		const labels = resolveLabels("pagination", provider, { next: "Weiter" });
		expect(labels.next).toBe("Weiter");
		expect(labels.previous).toBe("Précédent");
	});

	test("an explicit undefined never clobbers a default or the provider", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant", previous: undefined } };
		const labels = resolveLabels("pagination", provider, { next: undefined });
		expect(labels.next).toBe("Suivant");
		expect(labels.previous).toBe("Previous");
	});

	test("function-valued labels survive the merge", () => {
		const page = (n: number): string => `Seite ${n}`;
		const labels = resolveLabels("pagination", { pagination: { page } }, undefined);
		expect(labels.page).toBe(page);
		expect(labels.page(2)).toBe("Seite 2");
		expect(labels.pageOf(2, 4)).toBe("Page 2 of 4");
	});

	test("another component's overrides do not leak", () => {
		const labels = resolveLabels("carousel", { pagination: { next: "Suivant" } }, undefined);
		expect(labels).toEqual(DELACOUR_DEFAULT_LABELS.carousel);
	});

	test("the defaults are never mutated", () => {
		resolveLabels("kpi", { kpi: { up: "Hausse" } }, { down: "Baisse" });
		expect(DELACOUR_DEFAULT_LABELS.kpi.up).toBe("Up");
		expect(DELACOUR_DEFAULT_LABELS.kpi.down).toBe("Down");
	});
});

describe("mergeLabelOverrides", () => {
	test("an inner provider overrides an outer one per key, and keeps the rest", () => {
		const outer: DelacourLabelOverrides = {
			pagination: { next: "Suivant", previous: "Précédent" },
			kpi: { up: "Hausse" },
		};
		const inner: DelacourLabelOverrides = { pagination: { next: "Weiter", previous: undefined } };
		const merged = mergeLabelOverrides(outer, inner);
		expect(merged.pagination?.next).toBe("Weiter");
		expect(merged.pagination?.previous).toBe("Précédent");
		expect(merged.kpi?.up).toBe("Hausse");
	});

	test("an absent inner map returns the outer one unchanged", () => {
		const outer: DelacourLabelOverrides = { kpi: { up: "Hausse" } };
		expect(mergeLabelOverrides(outer, undefined)).toBe(outer);
	});
});

describe("areLabelsShallowEqual", () => {
	const page = (n: number): string => `Seite ${n}`;

	test("two literals with the same keys and values are equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter", page }, { next: "Weiter", page })).toBe(true);
	});

	test("a changed value is not equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter" }, { next: "Suivant" })).toBe(false);
	});

	test("a new function is not equal, even with the same body", () => {
		expect(areLabelsShallowEqual({ page }, { page: (n: number) => `Seite ${n}` })).toBe(false);
	});

	test("an added or removed key is not equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter" }, { next: "Weiter", previous: "Zurück" })).toBe(false);
		expect(areLabelsShallowEqual({ next: "Weiter", previous: "Zurück" }, { next: "Weiter" })).toBe(false);
	});

	test("undefined against undefined is equal; against an object it is not", () => {
		expect(areLabelsShallowEqual(undefined, undefined)).toBe(true);
		expect(areLabelsShallowEqual(undefined, {})).toBe(false);
		expect(areLabelsShallowEqual({}, undefined)).toBe(false);
	});
});
