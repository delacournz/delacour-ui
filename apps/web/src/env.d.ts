/** The build-time variables this app reads. All optional; see `src/lib/analytics/config.ts`. */
interface ImportMetaEnv {
	readonly VITE_UMAMI_HOST?: string;
	readonly VITE_UMAMI_WEBSITE_ID?: string;
	readonly VITE_GA_ID?: string;
}
