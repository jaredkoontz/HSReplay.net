import React, {
	CSSProperties,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import AdHelper, { debugAds, showAds } from "../../AdHelper";
import UserData from "../../UserData";
import AdUnitAdmin from "./AdUnitAdmin";
import detectPassiveEvents from "detect-passive-events";
import { image } from "../../helpers";

export type NetworkNDesktopId =
	| "nn_bb1"
	| "nn_bb2"
	| "nn_mpu1"
	| "nn_mpu2"
	| "nn_mpu3"
	| "nn_skyleft"
	| "nn_skyright";

export type NetworkNMobileId =
	| "nn_mobile_mpu1"
	| "nn_mobile_mpu2"
	| "nn_mobile_lb1_sticky";

export type NetworkNId = NetworkNDesktopId | NetworkNMobileId;

export const getAdSize = (id: NetworkNId): [number, number] | null => {
	if (id.startsWith("nn_bb")) {
		// large flex
		// return [970, 250];
		// small flex
		return [728, 90];
	}
	if (id.startsWith("nn_mpu") || id.startsWith("nn_mobile_mpu")) {
		return [300, 250];
	}
	if (id.startsWith("nn_sky")) {
		return [160, 600];
	}
	return null;
};

export const getAdFallback = (id: NetworkNId): string | null => {
	if (id.startsWith("nn_bb")) {
		// large flex
		// return "premium/fallbacks/fallback-7.jpg";
		// small flex
		return "premium/fallbacks/fallback-2.jpg";
	}
	if (id.startsWith("nn_mpu") || id.startsWith("nn_mobile_mpu")) {
		return "premium/fallbacks/fallback-1.jpg";
	}
	if (id.startsWith("nn_sky")) {
		return "premium/fallbacks/fallback-4.jpg";
	}
	return null;
};

interface BaseProps {
	center?: boolean;
}

interface DesktopProps {
	id: NetworkNDesktopId;
	mobile?: false;
}

interface MobileProps {
	id: NetworkNMobileId;
	mobile: true;
}

type Props = BaseProps & (DesktopProps | MobileProps);

// Network N checks for strictly less than 768
const MOBILE_WIDTH = 768;

const NetworkNAdUnit: React.FC<Props> = ({
	id,
	mobile = false,
	center = false,
}) => {
	const [onMobile, setOnMobile] = useState<boolean>(
		window.innerWidth < MOBILE_WIDTH,
	);
	const [showFallback, setShowFallback] = useState<boolean>(false);
	const ref = useRef<HTMLDivElement | null>(null);
	const childRef = useRef<HTMLDivElement | null>(null);

	useEffect(
		() => {
			const resize = () => {
				setOnMobile(window.innerWidth < MOBILE_WIDTH);
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
		[setOnMobile, MOBILE_WIDTH],
	);

	const debug = debugAds();
	useLayoutEffect(
		() => {
			if (showFallback || debug || !!mobile !== onMobile) {
				return;
			}

			// if the ad was already injected, do not touch anything
			if (childRef.current && childRef.current.children.length > 0) {
				return;
			}

			// do some canary ad blocker checks
			if (ref.current && typeof window.getComputedStyle === "function") {
				const computed = window.getComputedStyle(ref.current);
				const expected = {
					position: "relative",
					display: "block",
					visibility: "visible",
					opacity: 1,
					top: "0px",
					left: "0px",
				};
				for (const [key, value] of Object.entries(expected)) {
					// tslint:disable-next-line:triple-equals
					if (computed[key] != value) {
						// tainted, most likely by a cosmetic ad blocker
						setShowFallback(true);
						return;
					}
				}
			}

			// give the ad script 10 seconds to do something
			let timeout = window.setTimeout(() => {
				if (childRef.current && childRef.current.children.length > 0) {
					return;
				}
				setShowFallback(true);
				timeout = null;
			}, 10000);
			return () => {
				if (timeout !== null) {
					window.clearTimeout(timeout);
				}
			};
		},
		[showFallback, setShowFallback, debug, mobile, onMobile],
	);

	if (
		!showAds() ||
		!AdHelper.isAdEnabled(id) ||
		!UserData.hasFeature("networkn") ||
		!!mobile !== onMobile
	) {
		return null;
	}

	const [width, height] = getAdSize(id);
	const style: CSSProperties = {
		width: `${width}px`,
		height: `${height}px`,
	};

	if (showFallback && UserData.hasFeature("ad-fallback")) {
		const fallbackClassNames = [
			"premium-fallback",
			mobile ? "premium-fallback--mobile" : "premium-fallback--desktop",
		];
		if (center) {
			fallbackClassNames.push("premium-fallback--center");
		}
		return (
			<a
				href="/premium/"
				className={fallbackClassNames.join(" ")}
				style={{
					...style,
					backgroundImage: `url(${image(getAdFallback(id))})`,
				}}
			/>
		);
	}

	const classNames = [
		"ad-unit",
		mobile ? "ad-unit--mobile" : "ad-unit--desktop",
	];
	if (center) {
		classNames.push("ad-unit--center");
	}

	return (
		<div className={classNames.join(" ")} style={style} key={id} ref={ref}>
			{debug ? (
				<AdUnitAdmin id={id} width={width} height={height} />
			) : (
				<div id={id} ref={childRef} />
			)}
		</div>
	);
};

export default NetworkNAdUnit;
