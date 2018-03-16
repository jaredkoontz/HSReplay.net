import { Launcher } from "joust";
import * as Joust from "joust";
import Raven from "raven-js";
import React from "react";
import { cardArt, joustAsset } from "./helpers";
import BatchingMiddleware from "./metrics/BatchingMiddleware";
import InfluxMetricsBackend from "./metrics/InfluxMetricsBackend";
import MetricsReporter from "./metrics/MetricsReporter";
import UserData from "./UserData";

export default class JoustEmbedder {
	public turn: number = null;
	public reveal: boolean = null;
	public swap: boolean = null;
	public locale: string = null;
	public launcher: Launcher = null;
	public onTurn: (turn: number) => void = null;
	public onToggleSwap: (swap: boolean) => void = null;
	public onToggleReveal: (reveal: boolean) => void = null;
	private target: HTMLElement = null;
	private url: string = null;

	public embed(target: HTMLElement) {
		this.prepare(target);
		this.render();
	}

	public prepare(target: HTMLElement) {
		// find container
		if (!target) {
			throw new Error("No target specified");
		}

		if (!Joust.launcher) {
			console.error("Could not load Joust");
			target.innerHTML =
				'<p class="alert alert-danger">' +
				"<strong>Loading failed:</strong> " +
				"Replay applet (Joust) could not be loaded. Please ensure you can access " +
				'<a href="' +
				JOUST_STATIC_URL +
				'joust.js">' +
				JOUST_STATIC_URL +
				"joust.js</a>.</p>" +
				"<p>Otherwise try clearing your cache and refreshing this page.</p>";
			// could also offer document.location.reload(true)
			return;
		}

		const launcher: Launcher = Joust.launcher(target);
		this.launcher = launcher;
		const release = Joust.release();

		UserData.create();

		// setup RavenJS/Sentry
		let logger = null;
		const dsn = JOUST_RAVEN_DSN_PUBLIC;
		if (dsn) {
			const raven = Raven.config(dsn, {
				release,
				environment: JOUST_RAVEN_ENVIRONMENT || "development",
			}).install();
			const username = UserData.getUsername();
			if (username) {
				raven.setUserContext({ username });
			}
			(raven as any).setTagsContext({
				react: React.version,
			});
			logger = (err: string | Error) => {
				if (raven) {
					if (typeof err === "string") {
						raven.captureMessage(err);
					} else {
						raven.captureException(err);
					}
				}
				const message = err["message"] ? err["message"] : err;
				console.error(message);
			};
			launcher.logger(logger);
		}

		// setup graphics
		launcher.assets((asset: string) => joustAsset(asset));
		launcher.cardArt((cardId: string) => cardArt(cardId));

		// setup influx
		const endpoint = INFLUX_DATABASE_JOUST;
		if (endpoint) {
			// track startup time
			let realtimeElapsed = 0;
			let startupTime = null;
			let measuring = true;
			if ("visibilityState" in document) {
				measuring = document.visibilityState === "visible";
				document.addEventListener("visibilitychange", () => {
					if (measuring && startupTime) {
						realtimeElapsed += Date.now() - startupTime;
					}
					measuring = document.visibilityState === "visible";
					startupTime = Date.now();
				});
			}
			let metrics = null;
			const track = (series, values, tags) => {
				if (!tags) {
					tags = {};
				}
				tags["release"] = release;
				tags["locale"] = this.locale;
				if (series === "startup") {
					startupTime = Date.now();
				}
				metrics.writePoint(series, values, tags);
			};
			metrics = new MetricsReporter(
				new BatchingMiddleware(
					new InfluxMetricsBackend(endpoint),
					(): void => {
						const values = {
							percentage: launcher.percentageWatched,
							seconds: launcher.secondsWatched,
							duration: launcher.replayDuration,
							realtime: undefined,
						};
						if (measuring && startupTime) {
							realtimeElapsed += Date.now() - startupTime;
							values.realtime = realtimeElapsed / 1000;
						}
						metrics.writePoint("watched", values, {
							realtime_fixed: 1,
						});
					},
				),
				(series: string): string => "joust_" + series,
			);
			launcher.events(track);
		}

		// turn linking
		if (this.turn !== null) {
			launcher.startAtTurn(this.turn);
		}
		launcher.onTurn((newTurn: number) => {
			this.turn = newTurn;
			this.onTurn && this.onTurn(newTurn);
		});

		if (this.reveal !== null) {
			launcher.startRevealed(this.reveal);
		}
		launcher.onToggleReveal((newReveal: boolean) => {
			this.reveal = newReveal;
			this.onToggleReveal && this.onToggleReveal(newReveal);
		});

		if (this.swap !== null) {
			launcher.startSwapped(this.swap);
		}
		launcher.onToggleSwap((newSwap: boolean) => {
			this.swap = newSwap;
			this.onToggleSwap && this.onToggleSwap(newSwap);
		});

		// autoplay
		const autoplay = target.getAttribute("data-autoplay");
		if (autoplay === "false") {
			// Only disable autoplay if it's *specifically* set to "false"
			launcher.startPaused(true);
		} else {
			launcher.startPaused(false);
		}

		// setup player names
		if (typeof launcher.stripBattletags === "function") {
			launcher.stripBattletags(true);
		}
		if (typeof launcher.addPlayerName === "function") {
			for (let i = 1; true; i++) {
				const key = "data-player" + i;
				if (!target.hasAttribute(key)) {
					break;
				}
				const playerName = target.getAttribute(key);
				launcher.addPlayerName(playerName);
			}
		}

		// initialize joust
		this.locale = target.getAttribute("data-locale");

		let url = target.getAttribute("data-replayurl");
		if (!url.match(/^http(s?):\/\//) && !url.startsWith("/")) {
			url = "/" + url;
		}
		this.url = url;
	}

	public render(cb?: () => any) {
		if (!this.url) {
			throw new Error("Not prepared"); // you are
		}
		this.launcher.fromUrl(this.url, cb);
	}
}
