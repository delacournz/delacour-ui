import { DEFAULT_DOCS_SITE_URL } from "@/design-system/preset-url";

/**
 * Where the app's privacy policy lives: a page on the documentation site, the
 * same one both store listings name.
 *
 * App Review wants the link inside the app as well as on the listing, which is
 * why the home screen carries a row for it. It always opens production, even
 * from a dev build — unlike the theme footer, whose whole point is reaching the
 * page you are working on. `privacy-url.test.ts` holds the path to the site's
 * `privacyRoute`.
 */
export const PRIVACY_POLICY_PATH = "/privacy";
export const PRIVACY_POLICY_URL = `${DEFAULT_DOCS_SITE_URL}${PRIVACY_POLICY_PATH}`;
