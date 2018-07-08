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
		const subscribeButton = (
			<a href="#" className="btn promo-button white-style">
				Subscribe now
			</a>
		);
		return (
			<div id="premium-container">
				<header style={{
					backgroundImage: `url(${image("premium/splash-bk.png")})`
				}}>
					<div id="header-background-fade" />
					<div className="col-sm-12">
						<div id="main-header">
							<h1>
								HSReplay.net{" "}
								<span className="premium-text">Premium</span>
							</h1>
							<h3>
								Subscribe for <strong>$4.99</strong>{" "}
								<sup>USD</sup> monthly
							</h3>
							{subscribeButton}
						</div>
					</div>
					<div className="col-lg-6 col-sm-12">
						<div className="testemonial">
							<h2>James "Firebat" Kostesich</h2>
							<h4>Hearthstone World Champion</h4>
							<p>
								"I use HSReplay.net to try and figure out what
								emerging decks have the best winrate. And, I
								live the data on mulligans, keeping the right
								cards in the starting hand is one of the most
								impactful things in a hearthstone game."
							</p>
						</div>
					</div>
					<div className="col-lg-6 col-sm-12">
						<div className="testemonial">
							<h2>Petar "Gaara" Stevanovic</h2>
							<h4>Pro Player and Streamer</h4>
							<p>
								"I Use HSReplay.net every day. Seeing the
								mulligan winrates and best decks in the last 24
								hours has become my daily routine. My favorite
								thing to do is when my Twitch chat says I missed
								lethal, I show them the replay with the tool on
								the site to prove them wrong. It's a great
								site!"
							</p>
						</div>
					</div>
				</header>
				<section id="feature-story">
					<div className="clearfix" />
					<h1>Features</h1>
					<h2>Before the game</h2>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Find decks to play"
							image={image("premium/meta.png")}
							subtitle="Search Filters"
							bullets={[
								"Select Ranks 25 - Legend",
								"Choose regions: NA, EU, AS, CN",
								"Set time range: 1, 3, 7 days",
							]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Understand the meta"
							image={image("premium/tier-graphic.png")}
							subtitle="Meta Tier List"
							bullets={[
								"Find decks you want to play",
								"Stay on top of the meta",
							]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Know your plays"
							image={image("premium/matchup.png")}
							subtitle="Archetype Matchups"
							text="Find out how a deck does against all the popular archetypes in the meta"
							bullets={[
								"Know when you're favored",
								"Monitor overall winrate",
							]}
						/>
					</div>
					<div className="clearfix" />
					<h2>During the game</h2>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Learn what to keep"
							image={image("premium/mulligan.png")}
							subtitle="Mulligan Guide"
							text="Learn the best cards to keep in your opening hand against your opponent's class"
							bullets={["Mulligan stats by class matchup"]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Analyze card details"
							image={image("premium/turn.png")}
							subtitle="Turn Data"
							text="Find the best turns to play a card most effectively"
							bullets={["Winrate when played on turn #"]}
						/>
					</div>
					<div className="col-lg-4 col-sm-12">
						<PremiumFeaturePanel
							title="Visualize your game"
							image={<HDTVideo />}
							subtitle="In-game Overlay"
							text={
								<>
									<p>
										Never lose track when you or your
										opponent have played the second Brawl,
										Hex or Psychic Scream"
									</p>
									<a
										href="#"
										className="btn promo-button transparent-style"
									>
										Download
									</a>
								</>
							}
						/>
					</div>
					<div className="clearfix" />
					<h2>After the game</h2>
					<div className="col-lg-6 col-sm-12">
						<Panel
							header="Track your games"
							theme="light"
							accent="blue"
						>
							<img src={image("premium/history.png")} />
							<h3>Search Filters</h3>
							<p>
								Analyze your overall results. Identify the decks
								you are winning the most with over multiple play
								sessions.
							</p>
						</Panel>
					</div>
					<div className="col-lg-6 col-sm-12">
						<Panel
							header="Study the past"
							theme="light"
							accent="blue"
						>
							<img src={image("premium/replay.png")} />
							<h3>Search Filters</h3>
							<p>
								Review your games to identify any improvements
								you can make in your gameplay and learn more
								about a matchup.
							</p>
						</Panel>
					</div>
					<section id="subscribe">
						<div className="col-lg-12">
							<Panel theme="light" accent="blue" className="panel-subscribe">
								<img src={image("premium/banner-bk.png")} className="subscribe-background"/>
								<div className="subscribe-content">
									{subscribeButton}
								</div>
							</Panel>
						</div>
					</section>
				</section>
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
