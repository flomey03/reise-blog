/**
 * Language resolution for the site UI.
 *
 * The locale comes only from the browser's Accept-Language header. Astro
 * matches it against `i18n.locales` from astro.config.mjs and exposes the
 * result as `Astro.preferredLocale`. There is no URL prefix, no cookie and no
 * switcher: the visitor never has to configure anything, and content stays
 * German regardless of the UI language.
 *
 * The dictionaries are the single source of truth. astro.config.mjs derives
 * its locale list from them, so adding a language needs no config edit. The
 * `Translations` type is derived from the dictionaries as well, which means a
 * missing key in a new language fails `astro check` instead of showing up as
 * an `undefined` in the browser.
 */
import { de } from "./de";

export const DEFAULT_LOCALE = "de";

/** Every dictionary the site can serve. Keys must match i18n.locales. */
export const dictionaries = { de };

export type Locale = keyof typeof dictionaries;
export type Translations = (typeof dictionaries)[Locale];

export interface I18n {
	locale: Locale;
	t: Translations;
}

/**
 * Resolve the UI language for one request.
 *
 * `preferred` is `Astro.preferredLocale`: the best match from Accept-Language
 * or `undefined` when the browser asks for a language we do not have yet.
 * Either way we fall back to the default, so callers always get a complete
 * dictionary and never have to handle a missing locale.
 */
export function getI18n(preferred: string | undefined): I18n {
	if (preferred && preferred in dictionaries) {
		const locale = preferred as Locale;
		return { locale, t: dictionaries[locale] };
	}
	return { locale: DEFAULT_LOCALE, t: dictionaries[DEFAULT_LOCALE] };
}
