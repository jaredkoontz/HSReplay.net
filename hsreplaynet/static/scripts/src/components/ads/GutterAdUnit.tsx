import React from "react";
import AdHelper, { showAds } from "../../AdHelper";
import NetworkNAdUnit, { getAdSize, NetworkNDesktopId } from "./NetworkNAdUnit";
import Sticky from "../utils/Sticky";

interface BaseProps {
	position: "left" | "right";
	fluid?: boolean;
}

interface NetworkNProps {
	networkNId: NetworkNDesktopId;
	uniqueId: string;
}

type Props = BaseProps & NetworkNProps;

export default class GutterAdUnit extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!showAds()) {
			return null;
		}
		const { position, fluid } = this.props;
		if (
			!("networkNId" in this.props) ||
			!AdHelper.isAdEnabled(this.props.uniqueId)
		) {
			return null;
		}
		const [width] = getAdSize(this.props.networkNId);
		return (
			<div
				className="gutter-ad-container"
				style={{
					[position]: fluid
						? "10px"
						: `calc((100% - 1540px)/2 - ${width}px)`,
					width: `${width}px`,
				}}
			>
				<Sticky top={10}>
					<NetworkNAdUnit
						id={this.props.networkNId}
						uniqueId={this.props.uniqueId}
					/>
				</Sticky>
			</div>
		);
	}
}
