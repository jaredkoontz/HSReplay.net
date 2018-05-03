module.exports = {
	options: {
		// use strings as keys
		defaultNs: "frontend",
		nsSeparator: false,
		keySeparator: false,
		lngs: ["en"],
		resource: {
			loadPath: "{{lng}}/{{ns}}.json",
			savePath: "{{lng}}/{{ns}}.json",
		},
		func: {
			list: ["t"],
			extensions: [".js", ".jsx", ".ts", ".tsx"],
		},
		defaultValue: (language, namespace, key) => key,
	},
};
