import i18n, { InitOptions } from "i18next";
import CustomCallbackBackend from "i18next-callback-backend";
import UserData from "./UserData";

export const I18N_NAMESPACE_FRONTEND = "frontend";
export const I18N_NAMESPACE_HEARTHSTONE = "hearthstone";

// just used while we feature flag frontend translations
UserData.create();

i18n.use(CustomCallbackBackend).init({
	// keys as strings
	defaultNS: I18N_NAMESPACE_FRONTEND,
	fallbackNS: false,
	fallbackLng: false,
	keySeparator: false,
	lowerCaseLng: true,
	nsSeparator: false,

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
		if (namespace === I18N_NAMESPACE_HEARTHSTONE) {
			const promises = [];
			for (const hearthstoneNS of ["global"]) {
				promises.push(
					import(`i18n/${language}/hearthstone/${hearthstoneNS}.json`),
				);
			}
			try {
				const modules = await Promise.all(promises);
				for (const module of modules) {
					if (!module) {
						continue;
					}
					Object.assign(translations, module);
				}
			} catch (e) {
				console.error(e);
			}
		} else if (UserData.hasFeature("frontend-translations")) {
			try {
				Object.assign(
					translations,
					await import(`i18n/${language}/${namespace}.json`),
				);
			} catch (e) {
				console.error(e);
			}
		}
		callback(null, translations);
	},
} as InitOptions);

export default i18n;
