import React from "react";

interface Props {
	id: string;
	x?: number;
	y?: number;
}

interface State {
	loaded?: boolean;
}

export default class Card extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			loaded: false
		};
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any
	): void {
		if (prevProps.id !== this.props.id) {
			this.setState({ loaded: false });
		}
	}

	public render(): React.ReactNode {
		const imageStyle = {
			top: Math.max(0, this.props.y - 350) + "px"
		};
		const left = this.props.x < window.innerWidth / 2;
		if (left) {
			imageStyle["left"] = this.props.x + 20 + "px";
		} else {
			imageStyle["right"] = window.innerWidth - this.props.x + "px";
		}

		const artUrl =
			"https://art.hearthstonejson.com/v1/render/latest/enUS/256x/" +
			this.props.id +
			".png";

		return (
			<div>
				<img
					style={{ visibility: "hidden" }}
					src={artUrl}
					height={0}
					width={0}
					onLoad={() => {
						this.setState({ loaded: true });
					}}
				/>
				<img
					className="card-image"
					height={350}
					src={
						this.state.loaded
							? artUrl
							: "https://hsreplay.net/static/images/loading_minion.png"
					}
					style={imageStyle}
				/>
			</div>
		);
	}
}
