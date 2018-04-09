import React from "react";
import { image } from "../../helpers";
import UserData from "../../UserData";
import LoginButton from "../account/LoginButton";
import CloseModalButton from "../modal/CloseModalButton";
import PremiumCheckout from "./PremiumCheckout";

interface Props {
	analyticsLabel?: string;
}

export default class PremiumModal extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div className="premium-modal">
				<header>
					<CloseModalButton />
					<h3>
						HSReplay.net{" "}
						<span className="text-premium">Premium</span>
					</h3>
				</header>

				<main>
					<p>
						HSReplay.net Premium enables loads of cool new features
						and filters on the site. You get to improve your
						gameplay and support the continued development of
						HSReplay.net and Hearthstone Deck Tracker at the same
						time!{UserData.isAuthenticated() ? (
							<>
								{" "}
								<a
									href="/premium/"
									id="premium-modal-learn-more"
									target="_blank"
								>
									Learn more…
								</a>
							</>
						) : null}
					</p>

					<div className="thumbnails">
						<img
							src={image("premium-promotional/mycards.png")}
							className="bordered"
							alt="My Cards"
						/>
						<img
							src={image("premium-promotional/filters.png")}
							className="bordered"
							alt="Rank Range & Time Frame"
						/>
						<img
							src={image("premium-promotional/charts.png")}
							className="bordered"
							alt="Winrate by turn"
						/>
						<img
							src={image("premium-promotional/classes.png")}
							className="bordered"
							alt="Opponent class selector"
						/>
					</div>

					{UserData.isAuthenticated() ? (
						<PremiumCheckout
							analyticsLabel={this.props.analyticsLabel}
						/>
					) : (
						<>
							<h4 className="text-center">Log in to continue:</h4>
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
									Learn more
								</a>
							</div>
							<p className="help-block text-center">
								HSReplay.net does not gain access to your
								Blizzard email address or password.
							</p>
						</>
					)}
				</main>
			</div>
		);
	}
}
