import React from "react";

interface Props {
	map?: { [prop: string]: string };
}

export default class PropRemapper extends React.Component<Props> {
	public render(): React.ReactNode {
		const child = this.props.children;
		if (!child) {
			return;
		}
		const props = {};
		Object.keys(this.props).forEach((key: string) => {
			if (key === "map" || key === "children") {
				return;
			}
			const value = this.props[key];
			if (typeof this.props.map[key] === "string") {
				props[this.props.map[key]] = value;
			} else {
				props[key] = value;
			}
		});

		return React.cloneElement(child as any, props);
	}
}
