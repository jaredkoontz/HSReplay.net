import {
	distanceInWords,
	distanceInWordsStrict,
	distanceInWordsToNow,
	format as fnsFormat,
} from "date-fns";
import fnsDe from "date-fns/locale/de";
import fnsEn from "date-fns/locale/en";
import fnsFr from "date-fns/locale/fr";
import fnsIt from "date-fns/locale/it";
import fnsJa from "date-fns/locale/ja";
import fnsKo from "date-fns/locale/ko";
import fnsPl from "date-fns/locale/pl";
import fnsPt from "date-fns/locale/pt";
import fnsRu from "date-fns/locale/ru";
import fnsTh from "date-fns/locale/th";
import fnsZhCn from "date-fns/locale/zh_cn";
import fnsZhTw from "date-fns/locale/zh_tw";
import i18n, { InitOptions } from "i18next";
import CustomCallbackBackend from "i18next-callback-backend";
import ICU from "i18next-icu";
import de from "i18next-icu/locale-data/de";
import en from "i18next-icu/locale-data/en";
import es from "i18next-icu/locale-data/es";
import fr from "i18next-icu/locale-data/fr";
import it from "i18next-icu/locale-data/it";
import ja from "i18next-icu/locale-data/ja";
import ko from "i18next-icu/locale-data/ko";
import pl from "i18next-icu/locale-data/pl";
import pt from "i18next-icu/locale-data/pt";
import ru from "i18next-icu/locale-data/ru";
import th from "i18next-icu/locale-data/th";
import zh from "i18next-icu/locale-data/zh";
import numbro from "numbro";
import numbroDe from "numbro/languages/de-DE";
import numbroEn from "numbro/languages/en-GB";
import numbroEs from "numbro/languages/es-ES";
import numbroEsMx from "numbro/languages/es-MX";
import numbroFr from "numbro/languages/fr-FR";
import numbroIt from "numbro/languages/it-IT";
import numbroJa from "numbro/languages/ja-JP";
import numbroKo from "numbro/languages/ko-KR";
import numbroPl from "numbro/languages/pl-PL";
import numbroPt from "numbro/languages/pt-PT";
import numbroRu from "numbro/languages/ru-RU";
import numbroTh from "numbro/languages/th-TH";
import numbroZhCn from "numbro/languages/zh-CN";
import numbroZhTw from "numbro/languages/zh-TW";
import UserData from "./UserData";

export const I18N_NAMESPACE_FRONTEND = "frontend";
export const I18N_NAMESPACE_HEARTHSTONE = "hearthstone";

const numbroLocales = {
	de: "de-DE",
	en: "en-GB",
	es: "es-ES",
	fr: "fr-FR",
	it: "it-IT",
	ja: "ja-JP",
	ko: "ko-KR",
	pl: "pl-PL",
	pt: "pt-PT",
	ru: "ru-RU",
	th: "th-TH",
	zh: "zh-CN",
};

// just used while we feature flag frontend translations
UserData.create();

[
	numbroDe,
	numbroEn,
	numbroEs,
	numbroEsMx,
	numbroFr,
	numbroIt,
	numbroJa,
	numbroKo,
	numbroPl,
	numbroPt,
	numbroRu,
	numbroTh,
	numbroZhCn,
	numbroZhTw,
].forEach(locale => {
	numbro.registerLanguage(locale);
});

function getFnsLocale(): string {
	const locale = UserData.getLocale();

	return (
		{
			de: fnsDe,
			en: fnsEn,
			fr: fnsFr,
			it: fnsIt,
			ja: fnsJa,
			ko: fnsKo,
			pl: fnsPl,
			pt: fnsPt,
			ru: fnsRu,
			th: fnsTh,
			"zh-hans": fnsZhCn,
			"zh-hant": fnsZhTw,
		}[locale] || fnsEn
	);
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

if (UserData.hasFeature("frontend-translations")) {
	i18n.use(CustomCallbackBackend);
}

// prettier-ignore
i18n
	.use(ICU)
	.init({
		// keys as strings
		defaultNS: I18N_NAMESPACE_FRONTEND,
		fallbackNS: false,
		fallbackLng: false,
		keySeparator: false,
		lowerCaseLng: true,
		nsSeparator: false,

		// initial namespaces to load
		ns: ["frontend", "hearthstone"],

		// i18next-icu
		i18nFormat: {
			/* We cannot load these dynamically right now due to the different
			file names. There's not a lot data behind these though, so we just
			hardcode the languages we support for now. */
			localeData: [de, en, es, fr, it, ja, ko, pl, pt, ru, th, zh],
		},

		// not required using i18next-react
		interpolation: {
			escapeValue: false,
		},

		// CustomCallbackBackend
		customLoad: async (language, namespace, callback) => {
			numbro.setLanguage(numbroLocales[language]);
			const translations = {};
			if (namespace === "translation") {
				// default fallback namespace, do not load
				callback(null, translations);
				return;
			}
			if (namespace === I18N_NAMESPACE_HEARTHSTONE) {
				try {
					/* By specifying the same webpackChunkName, all the files for one language are
				merged into a single module. This results in one network request per language */
					const modules = await Promise.all([
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/${language}/hearthstone/global.json`),
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/${language}/hearthstone/gameplay.json`),
						import(/* webpackChunkName: "i18n/[index]" */ `i18n/${language}/hearthstone/presence.json`),
					]);
					for (const module of modules) {
						if (!module) {
							continue;
						}
						Object.assign(translations, module);
					}
				} catch (e) {
					console.error(e);
				}
			} else if (
				namespace === I18N_NAMESPACE_FRONTEND &&
				UserData.hasFeature("frontend-translations")
			) {
				try {
					Object.assign(
						translations,
						await import(/* webpackChunkName: "i18n/[index]" */ `i18n/${language}/frontend.json`),
					);
				} catch (e) {
					console.error(e);
				}
			}
			// pass translations to i18next
			callback(null, translations);
		},
	} as InitOptions);

export default i18n;
