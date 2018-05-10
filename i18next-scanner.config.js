module.exports = {
	options: {
		// use strings as keys
		nsSeparator: false,
		keySeparator: false,
		// settings
		defaultNs: "frontend",
		lngs: ["en"],
		resource: {
			loadPath: "{{lng}}/{{ns}}.json",
			savePath: "{{lng}}/{{ns}}.json",
		},
		func: {
			list: ["t"],
			extensions: [".js", ".jsx", ".ts", ".tsx"],
		},
		trans: {
			component: "Trans",
			i18nKey: false,
			extensions: [".jsx", ".tsx"],
			fallbackKey: (ns, value) => value,
		},
		defaultValue: (language, namespace, key) => key,
	},
};
