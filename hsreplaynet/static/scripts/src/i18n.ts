import i18n from "i18next";

const I18N_NAMESPACE = "frontend";

i18n.init({
	// keys as strings
	defaultNS: I18N_NAMESPACE,
	fallbackLng: false,
	keySeparator: false,
	nsSeparator: false,

	// not required using i18next-react
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
