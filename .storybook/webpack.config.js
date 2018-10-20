const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const exportedSettings = {
	STATIC_URL: "/static/",
	JOUST_STATIC_URL: "https://joust.hearthsim.net/branches/master/",
	SUNWELL_URL: "https://sunwell.hearthsim.net/branches/master/",
	HEARTHSTONE_ART_URL: "https://art.hearthstonejson.com/v1",
	JOUST_RAVEN_DSN_PUBLIC: process.env.JOUST_RAVEN_DSN_PUBLIC,
	JOUST_RAVEN_ENVIRONMENT: process.env.NODE_ENV,
	INFLUX_DATABASE_JOUST: process.env.INFLUX_DATABASE_JOUST,
	SITE_EMAIL: "contact@hsreplay.net",
};
const settings = {};
for (const [key, val] of Object.entries(exportedSettings)) {
	settings[key] = JSON.stringify(val);
}

const isProduction = process.env.NODE_ENV === "production";
const extractSCSS = new ExtractTextPlugin(
	isProduction ? "[name].[contenthash].css" : "[name].css",
);

module.exports = (baseConfig, env, defaultConfig) => {
	defaultConfig.resolve.extensions.push(".ts", ".tsx", ".js");
	defaultConfig.resolve.alias.d3 = "d3/build/d3.js";
	defaultConfig.resolve.alias.i18n = path.resolve(__dirname, "../locale");

	defaultConfig.module.rules.push({
		test: /\.tsx?$/,
		exclude: /node_modules/,
		use: [{
			loader: "babel-loader",
			options: {
				presets: [
					"react", [
						"env", {
							targets: {
								browsers: [
									"ie >= 11",
									"last 2 chrome versions",
									"last 2 firefox versions",
									"last 2 edge versions",
									"safari >= 9",
								],
							},
							modules: false,
						},
					],
				],
				plugins: [
					"syntax-dynamic-import",
					"transform-object-rest-spread",
				],
			},
		}, {
			loader: "ts-loader",
			options: {
				silent: true,
			},
		}],
	});
	defaultConfig.module.rules.push({
		test: /\.scss$/,
		exclude: /node_modules/,
		use: extractSCSS.extract([{
			loader: "css-loader",
			options: {
				minimize: true,
				sourceMap: true,
			},
		}, {
			loader: "sass-loader",
			options: {
				sourceMap: true,
			},
		}]),
	});

	defaultConfig.plugins.push(extractSCSS);
	defaultConfig.plugins.push(new webpack.DefinePlugin(settings));
	defaultConfig.plugins.push(new webpack.DefinePlugin({
		"process.env": {
			NODE_ENV: JSON.stringify(
				isProduction ? "production" : "development",
			),
		},
	}));

	return defaultConfig;
};
