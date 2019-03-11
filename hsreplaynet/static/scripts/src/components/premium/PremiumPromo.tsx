import React from "react";
import { Trans } from "react-i18next";
import { image } from "../../helpers";

interface Props {
	imageName: string;
	text: React.ReactNode;
}

export default class PremiumPromo extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div className="premium-promo">
				<div className="premium-background">
					<img
						src={image(
							`premium-promotional/${this.props.imageName}`,
						)}
					/>
				</div>
				<div className="card text-center">
					<h3>
						<Trans>
							Get <span className="text-premium">Premium</span>
						</Trans>
					</h3>
					<p className="big">{this.props.text}</p>
					<p>
						<a
							href="/premium/"
							className="btn promo-button hero-button"
						>
							<Trans>Learn more</Trans>
						</a>
					</p>
				</div>
			</div>
		);
	}
}
