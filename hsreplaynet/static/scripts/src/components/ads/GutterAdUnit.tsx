import React from "react";
import AdUnit, { AdUnitSize } from "./AdUnit";
import AdHelper, { showAds } from "../../AdHelper";

interface Props {
	id: string;
	size: AdUnitSize;
	position: "left" | "right";
}

export default class GutterAdUnit extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!showAds() || !AdHelper.isAdEnabled(this.props.id)) {
			return null;
		}
		const [width] = AdUnit.parsePlaceholderSize(this.props.size);
		const style = {};
		style[this.props.position] = `calc((100% - 1540px)/2 - ${width}px)`;
		return (
			<div className="gutter-ad-container" style={style}>
				<AdUnit id={this.props.id} size={this.props.size} />
			</div>
		);
	}
}
