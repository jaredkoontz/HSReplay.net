import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../../UserData";
import { image } from "../../helpers";
import LoginButton from "../account/LoginButton";
import CloseModalButton from "../modal/CloseModalButton";
import PremiumCheckout from "./PremiumCheckout";

interface Props extends InjectedTranslateProps {
	analyticsLabel?: string;
	modalStyle: ModalStyle;
}

interface State {
	showCheckout: boolean;
}

export type ModalStyle =
	| "default"
	| "TimeRankRegion"
	| "ArchetypePopulartiy"
	| "ArchetypeMulligan"
	| "MyDeckMulligan"
	| "MyDecks"
	| "MyCards"
	| "DeckMatchups"
	| "DeckMulligan"
	| "CardTurn";

interface ModalData {
	title: string;
	description: string;
	image?: string;
}

class PremiumModal extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			showCheckout: false,
		};
	}

	private getData(): ModalData {
		const { t } = this.props;
		switch (this.props.modalStyle) {
			case "default":
				return {
					title: "",
					description: t(
						"HSReplay.net Premium enables loads of cool new features and filters on the site. You get to improve your gameplay and support the continued development of HSReplay.net and Hearthstone Deck Tracker at the same time!",
					),
				};
			case "TimeRankRegion":
				return {
					title: t("Time, rank and region filters"),
					description: t(
						"Tired of generic weekly snapshots? Find the best deck you should be playing at your rank and region based on the latest data.",
					),
				};
			case "ArchetypePopulartiy":
				return {
					title: t("Archetype Popularity"),
					description: t(
						"What’s everyone playing at your rank? See how the popularity of archetypes differ at each rank.",
					),
					image: image("premium/modal-archetype-popularity.jpg"),
				};
			case "ArchetypeMulligan":
				return {
					title: t("Archetype Mulligan"),
					description: t(
						"Get an edge at the start of the game! Find the best cards to keep against your opponent’s archetype.",
					),
					image: image("premium/modal-archetype-mulligan.jpg"),
				};
			case "MyDeckMulligan":
				return {
					title: t("My Statistics"),
					description: t(
						"See how all the cards in this deck are performing for you. Mulligan winrates, number of turns held, and lots more!",
					),
					image: image("premium/modal-statistics.jpg"),
				};
			case "MyDecks":
				return {
					title: t("My Decks"),
					description: t(
						"See all the decks you are currently playing and how you are performing with each of them!",
					),
					image: image("premium/modal-my-decks.jpg"),
				};
			case "MyCards":
				return {
					title: t("My Cards"),
					description: t(
						"Find out what cards are having the most impact in your games! See if your cards are performing as expected.",
					),
					image: image("premium/modal-my-cards.jpg"),
				};
			case "DeckMatchups":
				return {
					title: t("Deck Matchups"),
					description: t(
						"Figure out where a deck is favored! Get a break down of how a specific deck matches up against the popular archetypes in the meta.",
					),
					image: image("premium/modal-deck-matchups.jpg"),
				};
			case "DeckMulligan":
				return {
					title: t("Deck Mulligan by Opponent Class"),
					description: t(
						"Optimize your mulligans based on your opponent! Find out the best cards to keep in your hand to give you the best chance to win.",
					),
				};
			case "CardTurn":
				return {
					title: t("Turn Details"),
					description: t(
						"Have you ever wondered when the best time to play Doomsayer is?. Find out the best turn to play your cards to get winning results.",
					),
					image: image("premium/modal-card-turn.jpg"),
				};
		}
	}

	public render(): React.ReactNode {
		if (UserData.hasFeature("new-premium")) {
			return this.renderNew();
		} else {
			return this.renderOld();
		}
	}

	private renderNew(): React.ReactNode {
		const { t } = this.props;
		const element = document.getElementById("payment-details-data");
		const paymentData = JSON.parse(element.textContent);
		const premiumPrice = paymentData.stripe.plans[0].description;
		const isAuthenticated = UserData.isAuthenticated();
		const data = this.getData();
		return (
			<div className="new-premium-modal">
				<header>
					<CloseModalButton />
					<h1>
						<Trans
							defaults="HSReplay.net <0>Premium</0>"
							components={[
								<span className="text-premium">Premium</span>,
							]}
						/>
					</h1>
					{this.state.showCheckout ? null : (
						<h4>
							{t("Subscribe for {price}", {
								price: premiumPrice,
							})}
						</h4>
					)}
				</header>
				<div className="premium-modal-content">
					<div className="premium-modal-frame top-left">
						<img src={image("premium/top-left.png")} />
					</div>
					<div className="premium-modal-frame top-right">
						<img src={image("premium/top-right.png")} />
					</div>
					<div className="premium-modal-frame bottom-left">
						<img src={image("premium/bottom-left.png")} />
					</div>
					<div className="premium-modal-frame bottom-right">
						<img src={image("premium/bottom-right.png")} />
					</div>
					{this.state.showCheckout ? (
						<PremiumCheckout
							analyticsLabel={this.props.analyticsLabel}
							preselect
						/>
					) : (
						<>
							<img
								className="premium-lock"
								src={image("premium/lock.png")}
							/>
							<div className="premium-feature-description">
								<h1>{data.title}</h1>
								<p>{data.description}</p>
								<a className="learn-more" href="/premium/">
									{t("See all features")}
								</a>
							</div>
							<img
								className="premium-lock"
								src={image("premium/lock.png")}
							/>
						</>
					)}
				</div>
				<footer
					className={
						!this.state.showCheckout && data.image ? "large" : null
					}
					style={{
						backgroundImage: `url(${(!this.state.showCheckout &&
							data.image) ||
							image("premium/rank-portrait-bk.jpg")})`,
					}}
				>
					<div className="color-overlay" />
					{data.image && !this.state.showCheckout ? (
						<div className="button-backdrop" />
					) : null}
					{isAuthenticated ? (
						this.state.showCheckout ? null : (
							<a
								href="#"
								className="btn promo-button"
								onClick={e => {
									e.preventDefault();
									this.setState({ showCheckout: true });
								}}
							>
								{t("Subscribe now")}
							</a>
						)
					) : (
						<LoginButton
							next={
								document &&
								document.location &&
								document.location.pathname
									? `${
											document.location.pathname
									  }?modal=premium`
									: "/premium/"
							}
						/>
					)}
				</footer>
			</div>
		);
	}

	private renderOld(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="premium-modal">
				<header>
					<CloseModalButton />
					<h3>
						<Trans
							defaults="HSReplay.net <0>Premium</0>"
							components={[
								<span className="text-premium">Premium</span>,
							]}
						/>
					</h3>
				</header>

				<main>
					<p>
						{t(
							"HSReplay.net Premium enables loads of cool new features and filters on the site. You get to improve your gameplay and support the continued development of HSReplay.net and Hearthstone Deck Tracker at the same time!",
						)}{" "}
						{UserData.isAuthenticated() ? (
							<>
								<a
									href="/premium/"
									id="premium-modal-learn-more"
									target="_blank"
								>
									{t("Learn more…")}
								</a>
							</>
						) : null}
					</p>

					<div className="thumbnails">
						<img
							src={image("premium-promotional/mycards.png")}
							className="bordered"
							alt={t("My Cards")}
						/>
						<img
							src={image("premium-promotional/filters.png")}
							className="bordered"
							alt={t("Rank Range & Time Frame")}
						/>
						<img
							src={image("premium-promotional/charts.png")}
							className="bordered"
							alt={t("Winrate by turn")}
						/>
						<img
							src={image("premium-promotional/classes.png")}
							className="bordered"
							alt={t("Opponent class selector")}
						/>
					</div>

					{UserData.isAuthenticated() ? (
						<PremiumCheckout
							analyticsLabel={this.props.analyticsLabel}
						/>
					) : (
						<>
							<h4 className="text-center">
								<Trans>Log in to continue:</Trans>
							</h4>
							<div className="text-center">
								<LoginButton
									next={
										document &&
										document.location &&
										document.location.pathname
											? `${
													document.location.pathname
											  }?modal=premium`
											: "/premium/"
									}
								/>{" "}
								<a
									href="/premium/"
									className="btn promo-button-outline hero-button"
								>
									<Trans>Learn more</Trans>
								</a>
							</div>
							<p className="help-block text-center">
								{t(
									"HSReplay.net does not gain access to your Blizzard email address or password.",
								)}
							</p>
						</>
					)}
				</main>
			</div>
		);
	}
}

export default translate()(PremiumModal);
