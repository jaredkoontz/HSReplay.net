import i18n from "i18next";
import UserData from "./UserData";

export const I18N_NAMESPACE_FRONTEND = "frontend";
export const I18N_NAMESPACE_HEARTHSTONE = "hearthstone";

UserData.create();
const lang = UserData.getLocale();

i18n.init({
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
});

for (const fn of ["global"]) {
	import(`i18n/${lang}/${fn}.json`).then(module => {
		i18n.addResourceBundle(lang, I18N_NAMESPACE_HEARTHSTONE, module);
	});
}

export default i18n;
