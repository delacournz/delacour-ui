import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Direction } from "@delacour/react-native-ui/direction";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Localized messages",
	caption: "Arabic labels and selection announcements for single dates, ranges, and multiple dates.",
	align: "stretch",
};

const messages = {
	accessibilityLabel: "التاريخ",
	triggerHint: "يفتح التقويم",
	placeholderSingle: "اختر تاريخًا",
	placeholderRange: "من – إلى",
	placeholderMultiple: "اختر تواريخ",
	rangeEnd: "النهاية",
	title: "اختر تاريخًا",
	done: "تم",
	clear: "مسح",
	close: "إغلاق",
	notSet: "غير محدد",
	fromDateNoEnd: (date: string) => `من ${date}، لم يتم اختيار النهاية`,
	rangeValue: (start: string, end: string) => `من ${start} إلى ${end}`,
	multipleValues: (dates: readonly string[]) => dates.join(" و"),
	multipleCount: (count: number) => `${count} تواريخ`,
	selected: (value: string) => `تم اختيار ${value}`,
	calendar: {
		today: "اليوم",
		rangeStart: "بداية النطاق",
		rangeEnd: "نهاية النطاق",
		previousMonth: "الشهر السابق",
		nextMonth: "الشهر التالي",
		previousYear: "السنة السابقة",
		nextYear: "السنة التالية",
		previousPage: "السابق",
		nextPage: "التالي",
		openMonthYearPicker: "فتح اختيار الشهر والسنة",
		openYearList: "فتح قائمة السنوات",
		returnToMonth: "العودة إلى الشهر",
	},
};

export function Demo(): ReactElement {
	const [days, setDays] = useState<readonly CalendarDate[]>([]);
	return (
		<Direction dir="rtl">
			<View className="w-full gap-3">
				<DatePicker locale="ar-EG" messages={messages} />
				<DatePicker locale="ar-EG" messages={messages} mode="range" />
				<DatePicker locale="ar-EG" messages={messages} mode="multiple" onValueChange={setDays} value={days} />
			</View>
		</Direction>
	);
}
