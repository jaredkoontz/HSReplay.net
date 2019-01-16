import React from "react";
import { image } from "../helpers";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import HDTVideo from "../components/HDTVideo";
import PremiumFeaturePanel from "../components/premium/PremiumFeaturePanel";
import Panel from "../components/Panel";
import UserData from "../UserData";
import DownloadButton from "../components/DownloadButton";

interface Props extends InjectedTranslateProps {}

interface State {
	windowsUrl: string | null;
	macUrl: string | null;
}

class Downloads extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			windowsUrl: null,
			macUrl: null,
		};
	}

	public componentDidMount() {
		this.fetchUrls();
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const { windowsUrl, macUrl } = this.state;
		const androidUrl =
			"https://play.google.com/store/apps/details?id=net.mbonnin.arcanetracker";
		return (
			<div className="downloads-container">
				<header>
					<div className="header-title">
						<h1>{t("Hearthstone Deck Tracker")}</h1>
						<p>{t("HSReplay.net Companion App")}</p>
					</div>
					<div className="header-download">
						<h2>{t("Download now")}</h2>
						<div className="download-buttons">
							{UserData.hasFeature("arcane-tracker") ? (
								<DownloadButton
									id="Android"
									title={t("Android")}
									subtitle={t("Arcane Tracker")}
									icon="android"
									url={androidUrl}
									className="hidden-md hidden-lg"
								/>
							) : null}
							<DownloadButton
								id="Windows"
								title={t("Windows")}
								subtitle={t("Hearthstone Deck Tracker")}
								icon="windows"
								url={windowsUrl}
							/>
							<DownloadButton
								id="macOS"
								title={t("macOS")}
								subtitle={t("HSTracker")}
								icon="apple"
								url={macUrl}
							/>
							{UserData.hasFeature("arcane-tracker") ? (
								<DownloadButton
									id="Android"
									title={t("Android")}
									subtitle={t("Arcane Tracker")}
									icon="android"
									url={androidUrl}
									className="hidden-xs hidden-sm"
								/>
							) : null}
						</div>
					</div>
					<div className="header-description">
						<div className="description-text">
							<p>
								<Trans>
									Hearthstone Deck Tracker is a{" "}
									<strong>free</strong> app to help you play
									like the pros. Download it now to get these
									must-have features:
								</Trans>
							</p>
							<ul>
								<li>
									<img src={image("hdt-logo.png")} />
									<p>
										<Trans>
											<strong>In-game overlay</strong>:
											Deck, hand, secret tracking & more
										</Trans>
									</p>
								</li>
								<li>
									<img src={image("hdt-logo.png")} />
									<p>
										<Trans>
											<strong>Companion app</strong>:
											Replays and Collection uploading
										</Trans>
									</p>
								</li>
								<li>
									<img src={image("hdt-logo.png")} />
									<p>
										<Trans>
											<strong>
												Personalized statistics
											</strong>: Deck winrates and arena
											runs
										</Trans>
									</p>
								</li>
							</ul>
						</div>
						<HDTVideo />
					</div>
					<img id="hdt-logo" src={image("hdt-logo.png")} />
					<div
						className="header-background"
						style={{
							backgroundImage: `url(${image(
								"downloads/gameboard-bk.jpg",
							)})`,
						}}
					/>
					<div className="header-fade" />
					<div className="header-fade fade-horizontal" />
					<div className="header-fade fade-vertical" />
				</header>
				<div id="features">
					<section id="overlay">
						<h1>{t("In-game overlay")}</h1>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/tracker.png")}
								subtitle={t("Deck Tracking")}
								text={t(
									"Never second guess which cards are still in your deck.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/played.png")}
								subtitle={t("Opponent Card Tracking")}
								text={t(
									"Track what cards your opponent has revealed so far.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/draw.png")}
								subtitle={t("Opponent Hand Tracking")}
								text={t(
									"See what turns your opponent drew each of their cards.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/secret.png")}
								subtitle={t("Secret Helper")}
								text={t(
									"Keep track of which secrets your opponent might have in play.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/fatigue.png")}
								subtitle={t("Fatigue")}
								text={t(
									"Know how much fatigue damage will be taken on the next draw.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/timer.png")}
								subtitle={t("Turn Timer")}
								text={t(
									"See how much time is left in your turn to make the best decision.",
								)}
							/>
						</div>
						<div className="clearfix" />
					</section>
					<section id="companion">
						<h1>{t("Companion app")}</h1>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("premium/replay.png")}
								subtitle={t("Replays")}
								text={t(
									"Review your games to improve your game play or just share them with a friend.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("premium/history.png")}
								subtitle={t("Match History")}
								text={t(
									"Upload your games to see your stats on HSReplay.net.",
								)}
							/>
						</div>
						<div className="col-lg-4 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/sync.png")}
								subtitle={t("Collection Uploading")}
								text={t(
									"Upload your card collection and find the best decks for you.",
								)}
							/>
						</div>
						<div className="clearfix" />
					</section>
					<section id="stats">
						<h1>{t("Personalized stats")}</h1>
						<div className="col-lg-6 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/breakdown.png")}
								subtitle={t("Deck Statistics")}
								text={t(
									"Detailed stats for all your decks, arena runs & more.",
								)}
							/>
						</div>
						<div className="col-lg-6 col-sm-12">
							<PremiumFeaturePanel
								title={null}
								image={image("downloads/build.png")}
								subtitle={t("Build better decks")}
								text={t(
									"Manage your decks and keep track of all their changes.",
								)}
							/>
						</div>
						<div className="clearfix" />
					</section>
				</div>
				<div id="twitch" />
				<Panel theme="light" accent="blue" className="panel-twitch">
					<h1>
						<i className="fa fa-twitch" />
						{t("The Twitch Connection")}
					</h1>
					<p>
						<Trans>
							Get more viewers by using our Twitch extension and
							making your <strong>stream</strong> available on
							HSReplay.net deck pages.
						</Trans>
					</p>
				</Panel>
				<Panel theme="light" accent="blue" className="panel-download">
					<div
						className="download-background"
						style={{
							backgroundImage: `url(${image(
								"downloads/gameboard-bk.jpg",
							)})`,
						}}
					/>
					<div className="download-content">
						<a
							className="btn promo-button"
							href="#"
							onClick={e => {
								e.preventDefault();
								window.scrollTo(0, 0);
							}}
						>
							{t("Download")}
						</a>
					</div>
				</Panel>
			</div>
		);
	}

	private fetchUrls() {
		const hdt = this.fetchDownload(
			"HearthSim/HDT-Releases",
			"HDT-Installer.exe",
		);
		const hstracker = this.fetchDownload(
			"HearthSim/HSTracker",
			"HSTracker.app.zip",
		);
		Promise.all([hdt, hstracker]).then(values => {
			this.setState({ windowsUrl: values[0], macUrl: values[1] });
		});
	}

	private fetchDownload(repo, assetName): Promise<string> {
		return fetch(`https://api.github.com/repos/${repo}/releases`, {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		})
			.then(async response => {
				if (response.ok) {
					const result = await response.json();
					for (const release of result) {
						const asset = release.assets.find(
							x => x.name === assetName,
						);
						if (asset) {
							return asset.browser_download_url;
						}
					}
				}
			})
			.catch(error => {
				console.error(error);
			});
	}
}

export default translate()(Downloads);
