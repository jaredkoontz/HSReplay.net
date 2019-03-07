import React from "react";
import AdHelper, { showAds } from "../../AdHelper";
import NetworkNAdUnit, { getAdSize, NetworkNDesktopId } from "./NetworkNAdUnit";
import NitropayAdUnit, {
	AdUnitSize,
	parsePlaceholderSize,
} from "./NitropayAdUnit";
import UserData from "../../UserData";
import Sticky from "../utils/Sticky";

interface BaseProps {
	position: "left" | "right";
	fluid?: boolean;
}

interface NitropayProps {
	id: string;
	size: AdUnitSize;
}

interface NetworkNProps {
	networkNId?: NetworkNDesktopId;
}

type Props = BaseProps & (NitropayProps | NetworkNProps);

export default class GutterAdUnit extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!showAds()) {
			return null;
		}
		const { position, fluid } = this.props;
		if (UserData.hasFeature("networkn")) {
			if (
				!("networkNId" in this.props) ||
				!AdHelper.isAdEnabled(this.props.networkNId)
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
						<NetworkNAdUnit id={this.props.networkNId} />
					</Sticky>
				</div>
			);
		} else {
			if (!("id" in this.props) || !AdHelper.isAdEnabled(this.props.id)) {
				return null;
			}
			const [width] = parsePlaceholderSize(this.props.size);
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
					<NitropayAdUnit id={this.props.id} size={this.props.size} />
				</div>
			);
		}
	}
}
