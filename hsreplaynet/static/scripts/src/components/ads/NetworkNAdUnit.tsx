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
	| "nn_lb1"
	| "nn_lb2"
	| "nn_skyleft"
	| "nn_skyright";

export type NetworkNMobileId =
	| "nn_mobile_mpu1"
	| "nn_mobile_mpu2"
	| "nn_mobile_lb1_sticky";

export type NetworkNId = NetworkNDesktopId | NetworkNMobileId;

type Dimension = number | [number, number];

export const getAdSize = (id: NetworkNId): [Dimension, Dimension] | null => {
	if (id.startsWith("nn_bb")) {
		// either [728, 90] or [970, 250]
		return [[728, 970], [90, 250]];
	}
	if (id.startsWith("nn_lb")) {
		return [728, 90];
	}
	if (id.startsWith("nn_mpu") || id.startsWith("nn_mobile_mpu")) {
		if (id === "nn_mpu3" || id === "nn_mobile_mpu2") {
			// mpu3 is non-flexing
			return [300, 250];
		}
		return [300, [250, 600]];
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
	uniqueId: string;
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
	uniqueId,
	mobile = false,
	center = false,
}) => {
	const [onMobile, setOnMobile] = useState<boolean>(
		window.innerWidth < MOBILE_WIDTH,
	);
	const [documentReady, setDocumentReady] = useState<boolean>(false);
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

	useEffect(
		() => {
			if (documentReady) {
				return;
			}
			if (
				(document.readyState as string) === "complete" ||
				(document.readyState as string) === "loaded"
			) {
				setDocumentReady(true);
				return;
			}
			const cb = () => {
				setDocumentReady(true);
			};
			document.addEventListener("DOMContentLoaded", cb);
			return () => {
				document.removeEventListener("DOMContentLoaded", cb);
			};
		},
		[setDocumentReady],
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

			if (!documentReady) {
				return;
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
		[showFallback, setShowFallback, debug, documentReady, mobile, onMobile],
	);

	if (
		!showAds() ||
		!AdHelper.isAdEnabled(uniqueId) ||
		!UserData.hasFeature("networkn") ||
		!!mobile !== onMobile
	) {
		return null;
	}

	const style: CSSProperties = {};
	const sizes = getAdSize(id);
	let width;
	let height;
	if (sizes) {
		const [widths, heights] = sizes;

		if (Array.isArray(widths)) {
			const [minWidth, maxWidth] = widths;
			style.minWidth = `${minWidth}px`;
			style.maxWidth = `${maxWidth}px`;
			width = minWidth;
		} else {
			style.width = `${widths}px`;
			width = widths;
		}

		if (Array.isArray(heights)) {
			const [minHeight, maxHeight] = heights;
			style.minHeight = `${minHeight}px`;
			style.maxHeight = `${maxHeight}px`;
			height = minHeight;
		} else {
			style.height = `${heights}px`;
			height = heights;
		}

		if (showFallback && UserData.hasFeature("ad-fallback")) {
			const fallbackClassNames = [
				"premium-fallback",
				mobile
					? "premium-fallback--mobile"
					: "premium-fallback--desktop",
			];
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
	}

	const classNames = [
		"ad-unit",
		mobile ? "ad-unit--mobile" : "ad-unit--desktop",
	];

	const adUnit = (
		<div className={classNames.join(" ")} style={style} key={id} ref={ref}>
			{debug ? (
				<AdUnitAdmin
					id={id}
					uniqueId={uniqueId}
					width={width || 250}
					height={height || 250}
				/>
			) : (
				<div id={id} ref={childRef} />
			)}
		</div>
	);

	if (center) {
		return <div className="center-ad-container">{adUnit}</div>;
	}

	return adUnit;
};

export default NetworkNAdUnit;
