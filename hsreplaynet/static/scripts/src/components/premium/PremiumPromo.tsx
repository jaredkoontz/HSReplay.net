import React from "react";
import { image } from "../../helpers";

interface Props {
	imageName: string;
	text: string | JSX.Element;
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
						<span className="text-premium">Premium</span> only
					</h3>
					<p className="big">{this.props.text}</p>
					<p>
						<a
							href="/premium/"
							className="btn promo-button hero-button"
						>
							Learn more
						</a>
					</p>
				</div>
			</div>
		);
	}
}
