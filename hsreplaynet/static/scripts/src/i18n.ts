import i18n, { InitOptions } from "i18next";
import CustomCallbackBackend from "i18next-callback-backend";

export const I18N_NAMESPACE_FRONTEND = "frontend";
export const I18N_NAMESPACE_HEARTHSTONE = "hearthstone";

i18n.use(CustomCallbackBackend).init({
	// keys as strings
	defaultNS: I18N_NAMESPACE_FRONTEND,
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
		if (namespace === I18N_NAMESPACE_HEARTHSTONE) {
			const promises = [];
			for (const hearthstoneNS of ["global"]) {
				promises.push(import(`i18n/${language}/${hearthstoneNS}.json`));
			}
			try {
				const modules = await Promise.all(promises);
				for (const module of modules) {
					if (!module) {
						return;
					}
					Object.assign(translations, module);
				}
			} catch (e) {
				console.error(e);
			}
		}
		callback(null, translations);
	},
} as InitOptions);

export default i18n;
