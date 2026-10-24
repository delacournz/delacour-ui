import { Calendar } from "@delacour/react-native-ui/calendar";
import { Direction } from "@delacour/react-native-ui/direction";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Localized messages",
	caption: "Arabic calendar labels with right-to-left layout. Month and day names still follow Intl.",
};

export function Demo(): ReactElement {
	return (
		<Direction dir="rtl">
			<View className="w-full">
				<Calendar
					locale="ar-EG"
					messages={{
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
					}}
				/>
			</View>
		</Direction>
	);
}
