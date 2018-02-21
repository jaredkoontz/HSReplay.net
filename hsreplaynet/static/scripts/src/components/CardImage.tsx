import React from "react";
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
			url: props.placeholder
		};
		this.fetchImage();
	}

	fetchImage() {
		const url =
			"https://art.hearthstonejson.com/v1/render/latest/enUS/256x/" +
			this.props.card.id +
			".png";
		const image = new Image();
		image.onload = () => this.setState({ url });
		image.src = url;
	}

	public render(): React.ReactNode {
		const img = (
			<img src={this.state.url} height={350} alt={this.props.card.name} />
		);
		if (this.props.card.collectible) {
			return (
				<a className="card-image" href={getCardUrl(this.props.card)}>
					{img}
				</a>
			);
		}
		return <div className="card-image">{img}</div>;
	}
}
