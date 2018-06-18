import React from "react";
import ReactDOM from "react-dom";
import { I18nextProvider } from "react-i18next";
import CardData from "../CardData";
import JoustEmbedder from "../JoustEmbedder";
import UserData from "../UserData";
import DeleteReplayButton from "../components/DeleteReplayButton";
import PlayerInfo from "../components/PlayerInfo";
import ShareGameDialog from "../components/ShareGameDialog";
import VisibilityDropdown from "../components/VisibilityDropdown";
import SemanticAge from "../components/text/SemanticAge";
import i18n from "../i18n";
import { Visibility } from "../interfaces";
import BatchingMiddleware from "../metrics/BatchingMiddleware";
import InfluxMetricsBackend from "../metrics/InfluxMetricsBackend";
import MetricsReporter from "../metrics/MetricsReporter";

const context = JSON.parse(
	document.getElementById("react_context").textContent,
);
UserData.create();

const locale = UserData.getLocale();

// Joust
const embedder = new JoustEmbedder();

const container = document.getElementById("joust-container");
const startPaused = !context["autoplay"];
let wasPlaying = !startPaused;

// shared url decoding
if (location.hash) {
	let ret = location.hash.match(/turn=(\d+)(a|b)/);
	if (ret) {
		embedder.turn = +ret[1] * 2 + +(ret[2] === "b") - 1;
	}
	ret = location.hash.match(/reveal=(0|1)/);
	if (ret) {
		embedder.reveal = +ret[1] === 1;
	}
	ret = location.hash.match(/swap=(0|1)/);
	if (ret) {
		embedder.swap = +ret[1] === 1;
	}
}

// share dialog
let metrics: MetricsReporter = null;
const endpoint = INFLUX_DATABASE_JOUST;
if (endpoint) {
	metrics = new MetricsReporter(
		new BatchingMiddleware(new InfluxMetricsBackend(endpoint)),
		(series: string): string => "hsreplaynet_" + series,
	);
}
const shared = {};

embedder.prepare(container, i18n.getFixedT(UserData.getLocale()));

// privacy dropodown
const targetTmp1 = document.getElementById("replay-infobox-container");
ReactDOM.render(
	<I18nextProvider i18n={i18n} initialLanguage={locale}>
		<>
			<h1>{context["format_name"] || "Replay"}</h1>

			{embedder.launcher ? (
				<button
					className="btn btn-primary btn-full visible-xs"
					type="button"
					onClick={() => {
						if (embedder.launcher.fullscreenSupported) {
							container.classList.remove("hidden-xs");
							embedder.launcher.fullscreen(true);
						} else {
							container.scrollIntoView();
						}
					}}
				>
					Enter replay
				</button>
			) : (
				<button
					className="btn btn-danger btn-full visible-xs"
					type="button"
					onClick={() => {
						alert(
							"Something went wrong when trying to initialize the Replayer. Please try disabling browser extensions, or opening the replay in a different browser or device.",
						);
					}}
				>
					Something went wrong…
				</button>
			)}

			<h2 className="hidden-lg">Decks</h2>
			<section
				id="infobox-players-container-small"
				className="hidden-lg"
			/>
			<h2>Game</h2>
			<ul id="infobox-game">
				<li>
					Played{" "}
					<span className="infobox-value">
						<SemanticAge date={context["match_start"]} />
					</span>
				</li>
				{context["build"] ? (
					<li>
						Build
						<span className="infobox-value">
							{context["build"]}
						</span>
					</li>
				) : null}
				{context["ladder_season"] ? (
					<li>
						Ranked Season
						<span className="infobox-value">
							{context["ladder_season"]}
						</span>
					</li>
				) : null}
				<li>
					Turns{" "}
					<span className="infobox-value">
						{context["own_turns"]}
					</span>
				</li>
				{context["spectator_mode"] ? (
					<li>
						Spectator mode
						<span className="infobox-value">
							POV: {context["player_name"]}
						</span>
					</li>
				) : null}
			</ul>
			<h2>
				Share{" "}
				<strong className="pull-right">{context["views"]} views</strong>
			</h2>
			<div id="share-game-dialog">
				<ShareGameDialog
					url={
						(document.querySelector(
							"link[rel='canonical']",
						) as HTMLLinkElement).href
					}
					showLinkToTurn
					showPreservePerspective={false}
					turn={embedder.turn}
					reveal={embedder.reveal}
					swap={embedder.swap}
					onShare={(network: string, linkToTurn: boolean) => {
						if (!metrics) {
							return;
						}
						if (shared[network]) {
							// deduplicate
							return;
						}
						metrics.writePoint(
							"shares",
							{ count: 1, link_to_turn: linkToTurn },
							{ network },
						);
						shared[network] = true;
					}}
				/>
			</div>

			<h2>Controls</h2>
			<ul className="infobox-settings hidden-sm">
				{context["can_update"] ? (
					<>
						<li className="clearfix">
							Visibility{" "}
							<span
								className="infobox-value"
								id="replay-visibility"
							>
								<VisibilityDropdown
									initial={
										context["visibility"] as Visibility
									}
									shortid={context["shortid"]}
								/>
							</span>
						</li>
						<li className="clearfix">
							Delete{" "}
							<span className="infobox-value" id="replay-delete">
								<DeleteReplayButton
									shortid={context["shortid"]}
									done={() =>
										(window.location.href = "/games/mine/")
									}
								/>
							</span>
						</li>
					</>
				) : null}
				{context["admin_url"] ? (
					<li>
						View in Admin{" "}
						<span className="infobox-value">
							<a href={context["admin_url"]}>Link</a>
						</span>
					</li>
				) : null}
				{UserData.isStaff() ? (
					<li>
						<a
							href={context["annotated_replay_url"]}
							download={`${
								context["shortid"]
							}-annotated.hsreplay.xml`}
						>
							Download annotated replay
						</a>
					</li>
				) : null}
				{/* TODO: move replay download URL to joust*/}
				<li>
					<a
						href={context["replay_url"]}
						download={`${context["shortid"]}.hsreplay.xml"`}
					>
						Download Replay XML
					</a>
				</li>
			</ul>
		</>
	</I18nextProvider>,
	targetTmp1,
);

// Player info
const renderPlayerInfo = (
	playerInfo: HTMLElement,
	playerExpandDirection: "up" | "down",
) => {
	if (!playerInfo) {
		return;
	}
	const renderPlayerInfoComponent = (cards?) => {
		ReactDOM.render(
			<I18nextProvider i18n={i18n} initialLanguage={locale}>
				<PlayerInfo
					gameId={context["shortid"]}
					playerName={context["player_name"]}
					opponentName={context["opponent_name"]}
					build={context["build"]}
					cardData={cards}
					playerExpandDirection={playerExpandDirection}
				/>
			</I18nextProvider>,
			playerInfo,
		);
	};
	renderPlayerInfoComponent();
	const cardData = new CardData();
	cardData.load(instance => {
		renderPlayerInfoComponent(instance);
	});
};

renderPlayerInfo(document.getElementById("infobox-players-container"), "up");
renderPlayerInfo(
	document.getElementById("infobox-players-container-small"),
	"down",
);

const style =
	typeof window.getComputedStyle === "function"
		? window.getComputedStyle(container)
		: {};
if (style["display"] === "none") {
	embedder.launcher.startPaused(true);
}

embedder.launcher.onFullscreen((fullscreen: boolean): void => {
	if (fullscreen) {
		if (wasPlaying) {
			embedder.launcher.play();
		}
	} else {
		// leave fullscreen
		wasPlaying = embedder.launcher.playing;
		embedder.launcher.pause();
		container.classList.add("hidden-xs");
	}
});

// embed joust
embedder.render(() => {
	if (!embedder.launcher.fullscreenSupported) {
		container.classList.remove("hidden-xs");
	}
});

// track banner clikcs
const banner = document.getElementById("banner-link");
if (banner) {
	banner.addEventListener("click", () => {
		if (typeof ga !== "function") {
			return;
		}
		ga("send", {
			hitType: "event",
			eventCategory: "Banner",
			eventAction: "click",
			eventLabel: "Replay Sidebar Banner",
		});
	});
}
