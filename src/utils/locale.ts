import { getI18nConfig } from "emdash";
import { DEFAULT_LOCALE } from "../i18n";

/**
 * The default locale from the site's Astro `i18n` config, if it names a
 * language this runtime can format. Callers fall back to English when it's
 * undefined.
 */
export function getSiteLocale(): string | undefined {
	const locale = getI18nConfig()?.defaultLocale;
	if (!locale) return undefined;
	try {
		return Intl.DateTimeFormat.supportedLocalesOf(locale)[0];
	} catch {
		// Malformed tags such as "pt_BR" throw instead of matching nothing.
		return undefined;
	}
}

/** Formats a date in the site's locale, falling back to the default. */
export function formatDate(date: Date, month: "long" | "short"): string {
	return date.toLocaleDateString(getSiteLocale() ?? DEFAULT_LOCALE, {
		year: "numeric",
		month,
		day: "numeric",
	});
}
