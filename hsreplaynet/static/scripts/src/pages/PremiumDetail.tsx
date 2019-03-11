import {
	PremiumEvents,
	ReferralEvents,
	SubscriptionEvents,
} from "../metrics/Events";
import React from "react";
import UserData from "../UserData";
import LoginButton from "../components/account/LoginButton";
import PremiumCheckout from "../components/premium/PremiumCheckout";
import { image } from "../helpers";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import ReferralsPromo from "./ReferralsPromo";
import Panel from "../components/Panel";
import HDTVideo from "../components/HDTVideo";
import PremiumFeaturePanel from "../components/premium/PremiumFeaturePanel";
import Testimonial from "../components/premium/Testimonial";
import TestimonialCarousel from "../components/premium/TestimonialCarousel";

interface Props extends WithTranslation {
	discount: string;
	reflink: string;
	randomQuote: string;
	premiumPrice: string;
	hasSubscriptionPastDue: boolean;
}

interface State {
	hasStartedCheckout: boolean;
}

class PremiumDetail extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			hasStartedCheckout: false,
		};
	}

	public componentDidMount(): void {
		PremiumEvents.onView();
	}

	public render(): React.ReactNode {
		const { hasSubscriptionPastDue, t } = this.props;
		const isPremium = UserData.isPremium();
		const isAuthenticated = UserData.isAuthenticated();
		const showCheckoutForm = !isPremium && !hasSubscriptionPastDue;
		return (
			<div id="premium-container">
				<header
					style={{
						backgroundImage: `url(${image(
							"premium/splash-bk.jpg",
						)})`,
					}}
				>
					<div id="header-background-fade" />
					<div id="header-background-fade" className="fade-radial" />
					<div className="col-sm-12">
						<div id="main-header">
							<h1>
								<Trans>
									HSReplay.net{" "}
									<span className="text-premium">
										Premium
									</span>
								</Trans>
							</h1>
							{isPremium ? (
								<>
									<h3 className="text-premium">
										<span className="glyphicon glyphicon-ok" />{" "}
										<strong>
											{t(
												"You've subscribed. Thanks for your support!",
											)}
										</strong>
									</h3>
									<a
										href="/account/billing/"
										className="btn promo-button white-style"
									>
										{t("Billing settings")}
									</a>
								</>
							) : (
								<>
									{hasSubscriptionPastDue ? (
										<>
											<a
												href="/account/billing/"
												className="btn promo-button white-style"
											>
												{t("Subscription suspended")}
											</a>
											<h3>
												{t(
													"Your subscription was suspended due to an open payment.",
												)}
												<br />
												<a
													href="/account/billing/"
													style={{
														textDecoration:
															"underline",
													}}
												>
													{t(
														"Please visit the billing settings",
													)}
												</a>.
											</h3>
										</>
									) : (
										<>
											<h3>
												{t("Subscribe for {price}", {
													price: this.props
														.premiumPrice,
												})}
											</h3>
											<a
												href="#checkout"
												className="btn promo-button white-style"
											>
												{t("Subscribe now")}
											</a>
										</>
									)}
								</>
							)}
						</div>
					</div>
				</header>
				<div className="col-sm-12">
					{this.props.reflink ? (
						<aside id="referrals">
							<ReferralsPromo
								discount={this.props.discount}
								url={this.props.reflink}
								onCopy={() =>
									ReferralEvents.onCopyRefLink("Premium Page")
								}
							/>
						</aside>
					) : null}
				</div>
				<div className="col-lg-6 col-sm-12">
					<Testimonial
						image={image("premium/firebat.jpg")}
						name={'James "Firebat" Kostesich'}
						subtitle={t("Hearthstone World Champion")}
						text={
							'"I use HSReplay.net to try and figure out what emerging decks have the best winrates. And I love the data on mulligans. Keeping the right cards in the starting hand is one of the most impactful things in a Hearthstone game."'
						}
					/>
				</div>
				<div className="col-lg-6 col-sm-12">
					<Testimonial
						image={image("premium/trump.jpg")}
						name={'Jeffrey "Trump" Shih'}
						subtitle={t("Mayor of Value Town, Streamer")}
						text={
							'"I use HSReplay.net to find all the hot up and coming decks. I comb through all the statistics to find out many things like which decks are performing the best, what matchups are good and bad, and all the cool tech choices people are using in their decks. Lets me nerd out on stats."'
						}
					/>
				</div>
				<section id="feature-story">
					<div className="clearfix" />
					<h1>{t("Features")}</h1>
					<h2>{t("Before the game")}</h2>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Find decks to play")}
							image={image("premium/meta.png")}
							subtitle={t("Advanced Filters")}
							text={t(
								"Use filters to find the best deck for your rank and region.",
							)}
							bullets={[
								t("Select ranks: 25–Legend, High Legend"),
								t("Choose regions: US, EU, APAC, CN"),
								t("Set time range: 1, 3 and 7 days"),
							]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Understand the meta")}
							image={image("premium/tier-graphic.png")}
							subtitle={t("Meta Tier List")}
							text={t(
								"Tired of waiting a week for generic meta snapshots?",
							)}
							bullets={[
								t("Daily power rankings"),
								t("Deck popularity"),
								t("Specific to your rank and region"),
							]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Know your plays")}
							image={image("premium/matchup.png")}
							subtitle={t("Archetype Matchups")}
							text={t(
								"Find out how a deck does against all the popular archetypes in the meta.",
							)}
							bullets={[
								t("Know when you're favored"),
								t("Monitor the overall effective winrate"),
							]}
						/>
					</div>
					<div className="clearfix" />
					<h2>{t("During the game")}</h2>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Learn what to keep")}
							image={image("premium/mulligan.png")}
							subtitle={t("Mulligan Guide")}
							text={t(
								"Learn the best cards to keep in your opening hand against your opponent's class.",
							)}
							bullets={[t("Mulligan stats by class matchup")]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Analyze cards")}
							image={image("premium/turn.png")}
							subtitle={t("Turn Data")}
							text={t(
								"Find the best turns to play a card most effectively.",
							)}
							bullets={[
								t("Winrates and play rates"),
								t("Broken down by opponent class"),
							]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title={t("Visualize your game")}
							image={<HDTVideo />}
							subtitle={t("In-game Overlay")}
							text={
								<>
									<p>
										{t(
											"Never lose track when you or your opponent has played the second Brawl, Hex or Psychic Scream.",
										)}
									</p>
									<a
										href="#"
										className="btn promo-button transparent-style"
									>
										{t("Download")}
									</a>
								</>
							}
						/>
					</div>
					<div className="clearfix" />
					<h2>{t("After the game")}</h2>
					<div className="col-lg-6 col-sm-12">
						<PremiumFeaturePanel
							title={t("Track your progress")}
							image={image("premium/history.png")}
							subtitle={t("Personal Statistics")}
							text={t(
								"Analyze your overall results. Identify the decks you are winning the most with over multiple play sessions.",
							)}
							wide
						/>
					</div>
					<div className="col-lg-6 col-sm-12">
						<PremiumFeaturePanel
							title={t("Study the past")}
							image={image("premium/replay.png")}
							subtitle={t("Replays")}
							text={t(
								"Review your games to identify any improvements you can make in your game play or just share them with a friend.",
							)}
							wide
						/>
					</div>
					<div className="clearfix" />
				</section>
				{UserData.hasFeature("ads") ? (
					<>
						<section id="more-features">
							<div className="col-lg-4 col-sm-12">
								<PremiumFeaturePanel
									title={null}
									image={image("premium/noad.png")}
									subtitle={t("Remove ads from HSReplay.net")}
								/>
							</div>
							<div className="col-lg-4 col-sm-12">
								<PremiumFeaturePanel
									title={null}
									image={image("hearthsim_logo.png")}
									subtitle={t("Support our development")}
									text={t(
										"Directly support HSReplay.net and Hearthstone Deck Tracker",
									)}
								/>
							</div>
							<div className="col-lg-4 col-sm-12">
								<PremiumFeaturePanel
									title={null}
									image={image("premium/discord.png")}
									subtitle={t("Receive special role")}
									text={t("Show off in our discord!")}
								/>
							</div>
						</section>
						<div className="clearfix" />
					</>
				) : null}
				<section id="subscribe">
					{isPremium ? null : (
						<div className="col-lg-12">
							<Panel
								theme="light"
								accent="blue"
								className="panel-subscribe"
							>
								<img
									src={image("premium/banner-bk.jpg")}
									className="subscribe-background"
								/>
								<div className="subscribe-content">
									<a
										href="#checkout"
										className="btn promo-button white-style"
									>
										{t("Subscribe now")}
									</a>
								</div>
							</Panel>
						</div>
					)}
				</section>
				<div className="clearfix" />
				<section id="testimonial-carousel">
					<div className="col-lg-12">
						<Panel accent="blue" theme="light">
							<TestimonialCarousel />
						</Panel>
					</div>
					<div className="clearfix" />
				</section>
				{showCheckoutForm ? (
					<section id="checkout" className="promo">
						<div className="container">
							{isAuthenticated ? (
								<>
									<h3 className="text-center">
										{this.props.randomQuote}
									</h3>

									<div className="form-group">
										<PremiumCheckout
											analyticsLabel={"Premium Detail"}
											preselect
											onInteract={() => {
												if (
													this.state
														.hasStartedCheckout
												) {
													return;
												}
												SubscriptionEvents.onInitiateCheckout(
													"Premium Detail",
												);
												this.setState({
													hasStartedCheckout: true,
												});
											}}
										/>
									</div>
								</>
							) : (
								<>
									<h3 className="text-center">
										{t("Sign in to subscribe")}
									</h3>
									<div
										className="text-center"
										style={{ margin: "25px 0 10px 0" }}
									>
										<LoginButton
											next={"/premium#checkout"}
										/>
									</div>
								</>
							)}
						</div>
					</section>
				) : null}
			</div>
		);
	}
}

export default withTranslation()(PremiumDetail);
