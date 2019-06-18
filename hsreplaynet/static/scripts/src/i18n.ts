import {
	distanceInWords,
	distanceInWordsStrict,
	distanceInWordsToNow,
	format as fnsFormat,
} from "date-fns";
import fnsEn from "date-fns/locale/en";
import i18n from "i18next";
import CustomCallbackBackend from "i18next-callback-backend";
import ICU from "i18next-icu";
// provide the polyfill synchronously for now
import "intl";
import "intl/locale-data/jsonp/en";
import numbro from "numbro";
import UserData from "./UserData";

export const I18N_NAMESPACE_FRONTEND = "frontend";
export const I18N_NAMESPACE_HEARTHSTONE = "hearthstone";

let dateFnsGlobalState = fnsEn;
function getFnsLocale(): object {
	return dateFnsGlobalState;
}

export function i18nDistanceInWords(
	dateToCompare: string | number | Date,
	date: string | number | Date,
	options?: object,
): string {
	options = options || {};
	options["locale"] = getFnsLocale();
	return distanceInWords(dateToCompare, date, options);
}

export function i18nDistanceInWordsStrict(
	dateToCompare: string | number | Date,
	date: string | number | Date,
	options?: object,
): string {
	options = options || {};
	options["locale"] = getFnsLocale();
	return distanceInWordsStrict(dateToCompare, date, options);
}

export function i18nDistanceInWordsToNow(
	dateToCompare: string | number | Date,
	options?: object,
): string {
	options = options || {};
	options["locale"] = getFnsLocale();
	return distanceInWordsToNow(dateToCompare, options);
}

export function i18nFormatDate(
	date: string | number | Date,
	format?: string,
): string {
	return fnsFormat(date, format, { locale: getFnsLocale() });
}

export function formatNumber(n: number, mantissa: number = 0): string {
	if (n === undefined || n === null) {
		return null;
	}
	return numbro(n).format({ thousandSeparated: true, mantissa });
}

export function formatOrdinal(n: number): string {
	if (n === undefined || n === null) {
		return null;
	}
	return numbro(n).format({ output: "ordinal" });
}

// just used while we feature flag frontend translations
UserData.create();
i18n.use(CustomCallbackBackend);

// create ICU so we can register locale-data later
const icu = new ICU();

// prettier-ignore
i18n
	.use(icu)
	.init({
		// keys as strings
		defaultNS: I18N_NAMESPACE_FRONTEND,
		fallbackNS: I18N_NAMESPACE_HEARTHSTONE,
		fallbackLng: false,
		keySeparator: false,
		lowerCaseLng: true,
		nsSeparator: false,

		// initial namespaces to load
		ns: ["frontend", "hearthstone"],
		lng: UserData.getLocale(),
		languages: Object.keys(UserData.getLanguages()),
		load: "currentOnly",

		react: {
			// improve react-i18next performance
			bindStore: false,
			bindI18n: "languageChanged",

			// we're fine briefly showing the original strings
			useSuspense: false,
		},

		// not required using i18next-react
		interpolation: {
			escapeValue: false,
		},

		// CustomCallbackBackend
		customLoad: async (language, namespace, callback) => {
			const translations = {};
			if (namespace === "translation") {
				// default fallback namespace, do not load
				callback(null, translations);
				return;
			}
			if (
				namespace === I18N_NAMESPACE_FRONTEND
			) {
				try {
					const [loadedTranslations, localeData] = await Promise.all([
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/hsreplaynet/frontend/${language}/frontend.json`),
						import(/* webpackChunkName: "i18n/[index]" */ `./locale-data/${language}.ts`),
					]);

					// load primary frontend translations
					Object.assign(translations, loadedTranslations);

					// handle ICU, numbro, date-fns
					icu.mem = {}; // clear ICU memoization cache due to plural rules
					icu.addLocaleData(localeData.icu);
					numbro.registerLanguage(localeData.numbro, true);
					dateFnsGlobalState = localeData.dateFns;
				} catch (e) {
					console.error(e);
				}
			}
			else if (namespace === I18N_NAMESPACE_HEARTHSTONE) {
				try {
					/* By specifying the same webpackChunkName, all the files for one language are
					merged into a single module. This results in one network request per language */
					const modules = await Promise.all([
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/hearthstone/${language}/global.json`),
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/hearthstone/${language}/gameplay.json`),
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/hearthstone/${language}/presence.json`),
					]);
					for (const module of modules.values()) {
						if (!module) {
							continue;
						}
						Object.assign(translations, module);
					}
				} catch (e) {
					console.error(e);
				}
			}
			// pass translations to i18next
			callback(null, translations);
		},
	} as i18n.InitOptions);

export default i18n;
