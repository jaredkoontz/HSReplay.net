import i18n from "i18next";

i18n
	.init({
		// keys as strings
		nsSeparator: false,
		keySeparator: false,
		fallbackLng: false,

		// not required using i18next-react
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
