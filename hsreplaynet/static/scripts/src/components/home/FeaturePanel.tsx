import React from "react";

interface Props {
	title: string;
	subtitle: string;
	backgroundCardId: string;
	backgroundStyle?: any;
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	href?: string;
}

export default class FeaturePanel extends React.Component<Props> {
	constructor(props: Props, context: any) {
		super(props, context);
	}

	render(): React.ReactNode {
		const style = Object.assign({}, this.props.backgroundStyle);
		style["backgroundImage"] = `url(${HEARTHSTONE_ART_URL}/512x/${
			this.props.backgroundCardId
		}.jpg)`;
		return (
			<div className="feature feature-small">
				<a
					className="feature-content no-title"
					style={style}
					href={this.props.href || "#"}
					onClick={e => {
						this.props.onClick && this.props.onClick(e);
					}}
				>
					<div className="feature-banner">
						<h1>{this.props.title}</h1>
						<h2>{this.props.subtitle}</h2>
					</div>
				</a>
			</div>
		);
	}
}
