import React from "react";

interface Props {
	title: React.ReactNode;
	subtitle: React.ReactNode;
	backgroundCardId?: string;
	backgroundStyle?: React.CSSProperties;
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	href?: string;
}

export default class FeaturePanel extends React.Component<Props> {
	render(): React.ReactNode {
		const style = Object.assign(
			{},
			{
				backgroundImage: `url(${HEARTHSTONE_ART_URL}/512x/${
					this.props.backgroundCardId
				}.jpg)`,
			},
			this.props.backgroundStyle || {},
		);
		return (
			<div className="feature-panel">
				<a
					className="feature-content"
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
