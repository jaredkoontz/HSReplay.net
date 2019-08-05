import React, { useEffect, useState } from "react";
import AdHelper, { showAds } from "../../AdHelper";
import NetworkNAdUnit, { NetworkNId } from "./NetworkNAdUnit";
import detectPassiveEvents from "detect-passive-events";
import NativeSticky from "../utils/NativeSticky";

interface Props {
	position: "left" | "right";
	minWidth: number;
	flex: number;
	uniqueIdThin: string;
	uniqueIdWide: string;
}

const GutterAdUnit: React.FC<Props> = ({
	position,
	minWidth,
	flex,
	uniqueIdThin,
	uniqueIdWide,
}) => {
	const [wide, setWide] = useState<boolean>(window.innerWidth >= flex);
	const [visible, setVisible] = useState<boolean>(
		window.innerWidth >= minWidth,
	);

	useEffect(
		() => {
			const resize = () => {
				setWide(window.innerWidth >= flex);
				setVisible(window.innerWidth >= minWidth);
			};
			if (detectPassiveEvents.hasSupport) {
				window.addEventListener("resize", resize, { passive: true });
			} else {
				window.addEventListener("resize", resize, false);
			}
			return () => {
				document.removeEventListener("resize", resize);
			};
		},
		[minWidth, flex],
	);

	const left = position === "left";
	const networkNId: NetworkNId = wide
		? left
			? "nn_skinl"
			: "nn_skinr"
		: left
			? "nn_skyleft"
			: "nn_skyright";
	const actualUniqueId = wide ? uniqueIdWide : uniqueIdThin;

	if (!showAds()) {
		return null;
	}
	if (!AdHelper.isAdEnabled(actualUniqueId) || !visible) {
		return null;
	}

	return (
		<NativeSticky top={10} bottom={10}>
			<NetworkNAdUnit id={networkNId} uniqueId={actualUniqueId} />
		</NativeSticky>
	);
};

export default GutterAdUnit;
