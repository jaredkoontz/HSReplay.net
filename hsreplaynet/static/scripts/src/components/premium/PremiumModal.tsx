import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../../UserData";
import { image } from "../../helpers";
import LoginButton from "../account/LoginButton";
import CloseModalButton from "../modal/CloseModalButton";
import PremiumCheckout from "./PremiumCheckout";

interface Props extends InjectedTranslateProps {
	analyticsLabel?: string;
}

class PremiumModal extends React.Component<Props> {
	public render(): React.ReactNode {
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
