import React from "react";
import { image } from "../../helpers";

interface Props {
	cardId: string;
	name?: string;
}

export default class ProfileHero extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<figure className="profile-hero">
				<div>
					<img
						className="profile-hero-art"
						src={`https://art.hearthstonejson.com/v1/256x/${
							this.props.cardId
						}.jpg`}
					/>
					<img
						className="profile-hero-frame"
						src={image("profile-hero-frame.png")}
					/>
				</div>
				{this.props.name ? (
					<figcaption>{this.props.name}</figcaption>
				) : null}
			</figure>
		);
	}
}
