import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../UserData";
import LoginButton from "../components/account/LoginButton";
import PremiumCheckout from "../components/premium/PremiumCheckout";
import { image } from "../helpers";
import { ReferralEvents } from "../metrics/GoogleAnalytics";
import ReferralsPromo from "./ReferralsPromo";
import Panel from "../components/Panel";
import HDTVideo from "../components/HDTVideo";
import PremiumFeaturePanel from "../components/premium/PremiumFeaturePanel";
import Testimonial from "../components/premium/Testimonial";
import TestimonialCarousel from "../components/premium/TestimonialCarousel";

interface Props extends InjectedTranslateProps {
	discount: string;
	reflink: string;
	randomQuote: string;
	featuredCard: string;
	featuredDeck: string;
	premiumPrice: string;
	hasSubscriptionPastDue: boolean;
}
interface State {}

class PremiumDetail extends React.Component<Props, State> {
	public render(): React.ReactNode {
		if (UserData.hasFeature("new-premium")) {
			return this.renderNew();
		} else {
			return this.renderOld();
		}
	}

	private renderNew(): React.ReactNode {
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
							'"' +
							t(
								"I use HSReplay.net to try and figure out what emerging decks have the best winrates. And I love the data on mulligans. Keeping the right cards in the starting hand is one of the most impactful things in a Hearthstone game.",
							) +
							'"'
						}
					/>
				</div>
				<div className="col-lg-6 col-sm-12">
					<Testimonial
						image={image("premium/trump.jpg")}
						name={'Jeffrey "Trump" Shih'}
						subtitle={t("Mayor of Value Town, Streamer")}
						text={
							'"' +
							t(
								"I use HSReplay.net to find all the hot up and coming decks. I comb through all the statistics to find out many things like which decks are performing the best, what matchups are good and bad, and all the cool tech choices people are using in their decks. Lets me nerd out on stats.",
							) +
							'"'
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
								t("Select ranks: 25 - Legend"),
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
								"Tried of waiting a week for generic meta snapshots?",
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
				</section>
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

	private renderOld(): React.ReactNode {
		const { hasSubscriptionPastDue, t } = this.props;
		const isPremium = UserData.isPremium();
		const isAuthenticated = UserData.isAuthenticated();
		const discordUrl = "https://discord.gg/hearthsim";
		const showCheckoutForm = !isPremium && !hasSubscriptionPastDue;

		return (
			<article id="premium-upgrade-page">
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

				<header id="opener">
					<div className="container">
						<h2>
							<Trans>
								HSReplay.net <span>Premium</span>
							</Trans>
						</h2>
						{isPremium ? (
							<>
								<p className="tagline text-premium">
									<span className="glyphicon glyphicon-ok" />{" "}
									{t(
										"You've subscribed. Thanks for your support!",
									)}
								</p>
								<p>
									<a
										href="/account/billing/"
										className="promo-button-outline"
									>
										{t("Billing settings")}
									</a>
								</p>
							</>
						) : (
							<>
								<p className="tagline">
									{t("Advanced Statistics for Hearthstone.")}
								</p>
								{hasSubscriptionPastDue ? (
									<>
										<p>
											<span className="btn promo-button-outline disabled">
												{t("Subscription suspended")}
											</span>
										</p>
										<p>
											{t(
												"Your subscription was suspended due to an open payment.",
											)}
											<br />
											<a
												href="/account/billing/"
												style={{
													color: "white",
													textDecoration: "underline",
												}}
											>
												{t(
													"Please visit the billing settings",
												)}
											</a>.
										</p>
									</>
								) : (
									<>
										<p>
											<a
												href="#go"
												className="promo-button-outline text-premium"
											>
												{t("Get Premium")}
											</a>
										</p>
										<p>
											{t("Subscribe for {price}", {
												price: this.props.premiumPrice,
											})}
										</p>
									</>
								)}
							</>
						)}
					</div>
				</header>

				<section id="features">
					<div className="container">
						<h3>{t("Features")}</h3>

						<p>
							{isPremium
								? t(
										"As a premium subscriber you now have access to the following features:",
								  )
								: t(
										"You'll gain access to the following features as a premium subscriber:",
								  )}
						</p>

						<div className="row">
							<div className="clearfix" />

							<figure className="auto col-sm-6 col-xs-12">
								<a href="/cards/">
									<img
										src={image(
											"premium-promotional/filters.png",
										)}
										className="bordered"
										alt={t("Rank range & Time frame")}
									/>
								</a>
								<figcaption>
									<h4>{t("Time & Rank Filters")}</h4>
									<p>
										{t(
											"Benefit from new filters to dive deep into the meta: View the latest global statistics and filter data for the higher ranks.",
										)}
									</p>
								</figcaption>
							</figure>

							<figure className="auto col-sm-6 col-xs-12">
								<a href="/cards/mine/">
									<img
										src={image(
											"premium-promotional/mycards.png",
										)}
										className="bordered"
										alt={t("My Cards")}
									/>
								</a>
								<figcaption>
									<h4>{t("My Cards")}</h4>
									<p>
										{t(
											"Start tracking your replays and learn how your cards perform—or just find that one card with which you're killing the most heroes!",
										)}
									</p>
									<p className="help-block">
										{t(
											"Data available during the subscription period.",
										)}
									</p>
								</figcaption>
							</figure>

							<div className="clearfix" />
							<figure className="auto col-sm-6 col-xs-12">
								<a
									href={`/cards/${
										this.props.featuredCard
									}/#tab=turn-statistics`}
								>
									<img
										src={image(
											"premium-promotional/charts.png",
										)}
										className="bordered"
										alt={t("Winrate by turn")}
									/>
								</a>
								<figcaption>
									<h4>{t("Turn Details")}</h4>
									<p>
										{t(
											"Choose any card and see how effective it is at various stages in the game. Pinpoint exactly when it's usually played and how it performs against certain classes.",
										)}
									</p>
								</figcaption>
							</figure>

							<figure className="auto col-sm-6 col-xs-12">
								<a href="/decks/">
									<img
										src={image(
											"premium-promotional/classes.png",
										)}
										className="bordered"
										alt={t("Opponent class selector")}
									/>
								</a>
								<figcaption>
									<h4>{t("Matchup Selectors")}</h4>
									<p>
										{t(
											"Whether you want to learn how to pilot a deck against Priest or identify the weakest card against Druid in your deck, we know the matchups.",
										)}
									</p>
								</figcaption>
							</figure>

							<div className="clearfix" />
							<figure className="auto col-sm-6 col-xs-12">
								<a href="/decks/mine/">
									<img
										src={image(
											"premium-promotional/mydecks.png",
										)}
										className="bordered"
										alt={t("My Decks")}
									/>
								</a>
								<figcaption>
									<h4>{t("My Decks")}</h4>
									<p>
										{t(
											"Keep track of the decks you play across all your replays! Quickly access any deck's page here, even if you're the only one playing it.",
										)}
									</p>
									<p className="help-block">
										{t(
											"Data available during the subscription period.",
										)}
									</p>
								</figcaption>
							</figure>

							<figure className="auto col-sm-6 col-xs-12">
								<img
									src={image(
										"premium-promotional/mystatistics.png",
									)}
									className="bordered"
									alt={t("My Statistics")}
								/>
								<figcaption>
									<h4>{t("My Statistics")}</h4>
									<p>
										{t(
											"View your own Mulligan Guide and Deck statistics for any deck you're playing and see how efficient your mulligans really are.",
										)}
									</p>
									<p className="help-block">
										{t(
											"Data available during the subscription period.",
										)}
									</p>
								</figcaption>
							</figure>

							<figure className="col-sm-6 col-sm-offset-3 col-xs-12">
								<figcaption>
									<h4>
										{t("…and we're not stopping here!")}
									</h4>
									<p>
										{t(
											"We're continuously working on new features, both for free users and exclusively for premium subscribers. Expect to see more in the future.",
										)}
									</p>
								</figcaption>
							</figure>
						</div>
						<div className="single-row">
							<hr />
							<h4 id="further-more">{t("Further more…")}</h4>
							<hr />
						</div>

						<div className="row">
							<figure className="auto col-sm-6 col-xs-12">
								<img
									src={image("premium-promotional/data.png")}
								/>
								<figcaption>
									<h4>{t("We trust our data")}</h4>
									<p>
										{t(
											"Our statistics are backed by millions of games per week across all ranks and game modes. That way we can update our statistics multiple times a day.",
										)}
									</p>
								</figcaption>
							</figure>

							<figure className="auto col-sm-6 col-xs-12">
								<img
									src={image("hearthsim_logo.png")}
									className="bordered-red logo"
								/>
								<figcaption>
									<h4>{t("Support HearthSim")}</h4>
									<p>
										<Trans>
											Your subscription directly supports
											HearthSim. We're the team behind
											Hearthstone Deck Tracker,
											HSReplay.net and{" "}
											<a
												href="https://github.com/HearthSim#org-repositories"
												target="_blank"
											>
												many more Hearthstone tools
											</a>.
										</Trans>
									</p>
								</figcaption>
							</figure>

							<div className="clearfix" />
							<figure className="auto col-sm-6 col-xs-12">
								<a href={discordUrl}>
									<img
										src={image(
											"premium-promotional/discord_role.png",
										)}
										className="bordered"
									/>
								</a>
								<figcaption>
									<h4>{t("Show off in Discord")}</h4>
									<p>
										<Trans>
											Show everyone how awesome you are
											with a special role on our{" "}
											<a href={discordUrl}>
												Community Discord server
											</a>!
										</Trans>
									</p>
									{isPremium ? (
										<p>
											<Trans>
												Visit the{" "}
												<a href="/account/social/connections/">
													account settings
												</a>{" "}
												to connect to Discord.
											</Trans>
										</p>
									) : (
										<p>
											{t(
												"You'll be able to connect your Discord account after you subscribe.",
											)}
										</p>
									)}
								</figcaption>
							</figure>
						</div>
					</div>
				</section>

				{showCheckoutForm ? (
					<section id="go" className="promo">
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
										<LoginButton next={"/premium#go"} />
									</div>
								</>
							)}
						</div>
					</section>
				) : null}
			</article>
		);
	}
}

export default translate()(PremiumDetail);
