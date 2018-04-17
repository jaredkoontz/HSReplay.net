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

		// debug messages
		debug: true,
	})
	.addResourceBundle("de", "translation", {
		"Game Mode": "Spielmodus",
		"Ranked Standard": "Standard (gewertet)",
		"Ranked Wild": "Wild (gewertet)",
		Arena: "Arena",
	});

export default i18n;
