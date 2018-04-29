const fs = require("fs");
const path = require("path");

const KEY_SEPARATOR = "__KEY_SEPARATOR__";

module.exports = {
	options: {
		// use strings as keys
		defaultNs: "frontend",
		nsSeparator: false,
		keySeparator: KEY_SEPARATOR,
		func: false,
		lngs: ["en"],
		resource: {
			loadPath: "{{lng}}/{{ns}}.json",
			savePath: "{{lng}}/{{ns}}.json",
		},
	},
	transform: function customTransform(file, enc, done) {
		"use strict";
		const parser = this.parser;
		const content = fs.readFileSync(file.path, enc);

		parser.parseFuncFromString(content, { list: ["t"] }, (key, options) => {
			const base = "hsreplaynet/static/scripts/src";
			const fileContext = path.relative(
				path.join(__dirname, base),
				file.path,
			);

			parser.set([fileContext, key].join(KEY_SEPARATOR), {
				defaultValue: key,
			});
		});

		done();
	},
};
