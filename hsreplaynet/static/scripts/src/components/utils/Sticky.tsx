import React, {
	CSSProperties,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import detectPassiveEvents from "detect-passive-events";

interface Props {
	top?: number;
	bottom?: number;
}

const Sticky: React.FC<Props> = ({ top = null, bottom = null, children }) => {
	const outerRef = useRef<HTMLInputElement | null>(null);
	const innerRef = useRef<HTMLInputElement | null>(null);
	const [width, setWidth] = useState<number | null>(null);
	const [height, setHeight] = useState<number | null>(null);
	const [relativeTop, setRelativeTop] = useState<number | null>(null);
	const [parentBottom, setParentBottom] = useState<number | null>(null);
	const [windowHeight, setWindowHeight] = useState<number>(
		window.innerHeight,
	);
	const [stick, setStick] = useState<boolean>(false);

	useLayoutEffect(() => {
		const measure = () => {
			if (outerRef.current) {
				const rect = outerRef.current.getBoundingClientRect();
				setWidth(rect.width);
				setRelativeTop(rect.top);
				const parent = outerRef.current.parentElement;
				setParentBottom(parent.getBoundingClientRect().bottom);
			}
			if (innerRef.current) {
				setHeight(innerRef.current.getBoundingClientRect().height);
			}
			setWindowHeight(window.innerHeight);
		};

		if (detectPassiveEvents.hasSupport) {
			// the passive event syntax is not supported in all browsers, but
			// reduces resize and scroll lag when enabled, especially on mobile
			// devices
			window.addEventListener("scroll", measure, { passive: true });
			window.addEventListener("resize", measure, { passive: true });
		} else {
			window.addEventListener("scroll", measure, false);
			window.addEventListener("resize", measure, false);
		}
		// re-measure occasionally in case the layout flexes (pop in/out...)
		const interval = window.setInterval(() => measure(), 300);
		// measure now to determine the initial position
		return () => {
			window.removeEventListener("scroll", measure);
			window.removeEventListener("resize", measure);
			window.clearInterval(interval);
		};
	}, []);

	useEffect(
		() => {
			if (relativeTop === null) {
				return;
			}
			if (bottom !== null) {
				setStick(relativeTop + height + bottom < windowHeight);
			} else {
				setStick(relativeTop < (top !== null ? top : 0));
			}
		},
		[top, bottom, height, relativeTop, windowHeight],
	);

	const classNames = ["sticky__element"];
	const innerStyle: CSSProperties = {};
	const outerStyle: CSSProperties = {};

	if (stick) {
		classNames.push("sticky__element--stick");
		if (top !== null) {
			innerStyle.top = top;
		} else if (bottom !== null) {
			if (parentBottom !== null) {
				innerStyle.bottom =
					bottom + Math.max(windowHeight - parentBottom, 0);
			} else {
				innerStyle.bottom = bottom;
			}
		} else {
			innerStyle.top = 0;
		}
	}

	if (width !== null) {
		// Transfer the width inwards so we can center the component
		// properly.
		innerStyle.width = `${width}px`;
	}
	if (height !== null) {
		// Keep the height to ensure that the space isn't lost when the
		// element switches to stick mode. Losing the space would result in
		// the content "jumping" upwards.
		outerStyle.height = `${height}px`;
	}

	return (
		<div className="sticky" style={outerStyle} ref={outerRef}>
			<div
				className={classNames.join(" ")}
				style={innerStyle}
				ref={innerRef}
			>
				{children}
			</div>
		</div>
	);
};

export default Sticky;
