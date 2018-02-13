"use strict";

const path = require("path");
const webpack = require("webpack");
const BundleTracker = require("webpack-bundle-tracker");
const fs = require("fs");
const spawnSync = require("child_process").spawnSync;
const url = require("url");
const _ = require("lodash");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const exportSettings = [
	"STATIC_URL",
	"JOUST_STATIC_URL",
	"SUNWELL_URL",
	"HEARTHSTONE_ART_URL",
	"JOUST_RAVEN_DSN_PUBLIC",
	"JOUST_RAVEN_ENVIRONMENT",
	"HEARTHSTONEJSON_URL"
];
const influxKey = "INFLUX_DATABASES";
const python = process.env.PYTHON || "python";
const settingsCmd = [path.resolve(__dirname, "hsreplaynet/settings.py")];
let proc = spawnSync(python, settingsCmd.concat(exportSettings, [influxKey]), {
	encoding: "utf-8"
});
console.log(proc.stderr);
const exportedSettings = JSON.parse(proc.stdout);

// verify exported settings are actually available
for (let key in exportSettings) {
	const setting = exportSettings[key];
	const value = exportedSettings[setting];
	if (typeof value === "undefined") {
		throw new Error("Unknown setting " + setting);
	}
}

const buildInfluxEndpoint = db =>
	url.format({
		protocol: db.SSL ? "https" : "http",
		hostname: db.HOST,
		port: "" + db.PORT || 8086,
		pathname: "/write",
		query: {
			db: db.NAME,
			u: db.USER,
			p: db.PASSWORD,
			precision: "s"
		}
	});

const joustDb = exportedSettings[influxKey]
	? exportedSettings[influxKey]["joust"]
	: undefined;
const settings = exportSettings.reduce(
	(obj, current) => {
		obj[current] = JSON.stringify(exportedSettings[current]);
		return obj;
	},
	{
		INFLUX_DATABASE_JOUST: joustDb
			? JSON.stringify(buildInfluxEndpoint(joustDb))
			: undefined
	}
);

const isProduction = process.env.NODE_ENV === "production";

const plugins = [];
if (isProduction) {
	const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
	plugins.push(
		new UglifyJSPlugin({
			parallel: true
		})
	);
} else {
	const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
	plugins.push(new HardSourceWebpackPlugin());
}

module.exports = env => {
	env = env || {};

	// define entry points and groups with common code
	const makeEntry = name =>
		path.join(__dirname, "hsreplaynet/static/scripts/src/entries/", name);
	const entries = {
		my_replays: makeEntry("my_replays"),
		replay_detail: makeEntry("replay_detail"),
		replay_embed: makeEntry("replay_embed"),
		stats: {
			card_detail: makeEntry("card_detail"),
			cards: makeEntry("cards"),
			deck_detail: makeEntry("deck_detail"),
			decks: makeEntry("decks"),
			my_decks: makeEntry("my_decks"),
			my_highlights: makeEntry("my_highlights"),
			meta_overview: makeEntry("meta_overview"),
			trending: makeEntry("trending"),
			archetype_detail: makeEntry("archetype_detail")
		},
		premium_detail: makeEntry("premium_detail"),
		discover: makeEntry("discover"),
		card_editor: makeEntry("card_editor"),
		victory_widgets: makeEntry("victory_widgets"),
		articles: makeEntry("articles"),
		premium_modal: makeEntry("premium_modal"),
		home: makeEntry("home"),
		vendor: [
			"babel-polyfill",
			"whatwg-fetch",
			makeEntry("export-react"),
			"hearthstonejson-client",
			makeEntry("polyfills")
		]
	};

	// flatten the entry points for config
	const entriesFlat = {};
	const groups = [];
	for (const group in entries) {
		const values = entries[group];
		if (typeof values === "string" || Array.isArray(values)) {
			entriesFlat[group] = values;
		} else if (typeof values === "object") {
			groups.push(group);
			for (const key in values) {
				entriesFlat[key] = values[key];
			}
		}
	}

	// define a CommonsChunkPlugin for each group
	const commons = groups.map(
		group =>
			new webpack.optimize.CommonsChunkPlugin({
				names: group,
				chunks: Object.keys(entries[group]),
				minChunks: 3
			})
	);

	entriesFlat["main"] = path.join(
		__dirname,
		"hsreplaynet/static/styles",
		"main.scss"
	);
	const extractSCSS = new ExtractTextPlugin("main.css");

	return {
		context: __dirname,
		entry: entriesFlat,
		output: {
			path: path.join(__dirname, "build", "generated", "webpack"),
			filename: "[name].js"
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
			alias: {
				// we need to this to get the fully bundled d3, instead of the independent module
				d3: "d3/build/d3.js"
			}
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: "babel-loader",
							options: {
								presets: [
									"react",
									[
										"env",
										{
											targets: {
												browsers: [
													"ie >= 11",
													"last 2 chrome versions",
													"last 2 firefox versions",
													"last 2 edge versions",
													"safari >= 9"
												]
											},
											modules: false
										}
									]
								],
								cacheDirectory: path.join(
									__dirname,
									".cache",
									"babel-loader"
								)
							}
						},
						{
							loader: "ts-loader",
							options: {
								silent: true
							}
						}
					]
				},
				{
					test: /\.scss$/,
					exclude: /node_modules/,
					use: extractSCSS.extract([
						{
							loader: "css-loader",
							options: {
								minimize: true
							}
						},
						"sass-loader"
					])
				}
			]
		},
		externals: {
			jquery: "jQuery",
			joust: "Joust",
			sunwell: "Sunwell"
		},
		plugins: [
			new BundleTracker({
				path: __dirname,
				filename: "./build/webpack-stats.json"
			}),
			new webpack.DefinePlugin(settings),
			new webpack.DefinePlugin({
				"process.env": {
					NODE_ENV: JSON.stringify(
						isProduction ? "production" : "development"
					)
				}
			}),
			extractSCSS,
			new webpack.optimize.CommonsChunkPlugin({
				name: "vendor",
				minChunks: Infinity
			})
		]
			.concat(commons)
			.concat(plugins),
		watchOptions: {
			// required in the Vagrant setup due to Vagrant inotify not working
			poll: 1000
		},
		stats: {
			modules: false
		}
	};
};
