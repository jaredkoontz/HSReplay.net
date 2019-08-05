import React from "react";

interface Props {
	top?: number;
	bottom?: number;
}

const NativeSticky: React.FC<Props> = ({ top, bottom, children }) => {
	const style: object = {};
	if (top !== undefined) {
		style["top"] = `${top}px`;
	}
	if (bottom !== undefined) {
		style["bottom"] = `${bottom}px`;
	}
	return (
		<div className="sticky-native" style={style}>
			{children}
		</div>
	);
};

export default NativeSticky;
