import React from "react";
import UserData from "../UserData";
import { getCardUrl } from "../helpers";

interface Props {
	card: any;
	placeholder: string;
}

interface State {
	url: string;
}

export default class CardImage extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			url: props.placeholder,
		};
		this.fetchImage();
	}

	fetchImage() {
		const hearthstoneLang = UserData.getHearthstoneLocale();
		const url = `${HEARTHSTONE_ART_URL}/render/latest/${hearthstoneLang}/256x/${
			this.props.card.id
		}.png`;
		const image = new Image();
		image.onload = () => this.setState({ url });
		image.src = url;
	}

	public render(): React.ReactNode {
		return (
			<a className="card-image" href={getCardUrl(this.props.card)}>
				<img
					src={this.state.url}
					height={350}
					alt={this.props.card.name}
				/>
			</a>
		);
	}
}
