"use strict";

const path = require("path");
const webpack = require("webpack");
const BundleTracker = require("webpack-bundle-tracker");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function(env, args) {
	const isProduction = args.mode === "production";

	// TODO: unhardcode me
	const exportedSettings = {
		STATIC_URL: "/static/",
		JOUST_STATIC_URL: "https://joust.hearthsim.net/branches/master/",
		SUNWELL_URL: "https://sunwell.hearthsim.net/branches/master/",
		HEARTHSTONE_ART_URL: "https://art.hearthstonejson.com/v1",
		JOUST_RAVEN_DSN_PUBLIC: env ? env.JOUST_RAVEN_DSN_PUBLIC : "",
		JOUST_RAVEN_ENVIRONMENT: env ? env.NODE_ENV : "",
		INFLUX_DATABASE_JOUST: env ? env.INFLUX_DATABASE_JOUST : "",
	};
	const settings = {};
	for (const [key, val] of Object.entries(exportedSettings)) {
		settings[key] = JSON.stringify(val);
	}

	const entry = name =>
		path.join(__dirname, "hsreplaynet/static/scripts/src/entries/", name);
	const entries = {
		site: entry("site"),
		main: path.join(__dirname, "hsreplaynet/static/styles", "main.scss"),
		home: entry("home"),
		my_replays: entry("my_replays"),
		replay_detail: entry("replay_detail"),
		replay_embed: entry("replay_embed"),
		card_detail: entry("card_detail"),
		cards: entry("cards"),
		deck_detail: entry("deck_detail"),
		decks: entry("decks"),
		my_decks: entry("my_decks"),
		meta_overview: entry("meta_overview"),
		trending: entry("trending"),
		archetype_detail: entry("archetype_detail"),
		premium_detail: entry("premium_detail"),
		discover: entry("discover"),
		card_editor: entry("card_editor"),
		my_packs: entry("my_packs"),
	};

	return {
		context: __dirname,
		entry: entries,
		output: {
			filename: isProduction ? "[name].[chunkhash].js" : "[name].js",
			sourceMapFilename: "[file].map",
			path: path.join(__dirname, "build", "generated", "webpack"),
			publicPath: exportedSettings.STATIC_URL + "webpack/",
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
			alias: {
				// we need to this to get the fully bundled d3, instead of the independent module
				d3: "d3/build/d3.js",
				i18n: path.resolve(__dirname, "locale"),
			},
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
													"safari >= 9",
												],
											},
											modules: false,
											useBuiltins: true,
										},
									],
								],
								plugins: [
									"syntax-dynamic-import",
									"transform-object-rest-spread",
								],
								cacheDirectory: true,
							},
						},
						{
							loader: "ts-loader",
							options: {
								silent: true,
							},
						},
					],
				},
				{
					test: /\.scss$/,
					exclude: /node_modules/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: "css-loader",
							options: {
								minimize: isProduction,
								sourceMap: true,
							},
						},
						{
							loader: "sass-loader",
							options: {
								sourceMap: true,
							},
						},
					],
				},
			],
		},
		externals: {
			jquery: "jQuery",
			joust: "Joust",
			sunwell: "Sunwell",
		},
		optimization: {
			splitChunks: {
				chunks: "all",
			},
		},
		plugins: [
			new BundleTracker({
				path: __dirname,
				filename: "./build/webpack-stats.json",
			}),
			new webpack.DefinePlugin(settings),
			new MiniCssExtractPlugin("main.css"),
		],
		watchOptions: {
			// required in the Vagrant setup due to Vagrant inotify not working
			poll: 1000,
		},
		stats: {
			modules: false,
		},
	};
};
