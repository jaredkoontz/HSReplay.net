import React from "react";
import UserData from "../UserData";

interface Props {
	feature: string;
	inverted?: boolean;
}

export default class Feature extends React.Component<Props> {
	public render(): React.ReactNode {
		const { feature, inverted, children, ...props } = this.props;
		const expectedState = !!inverted;
		if (
			!this.props.children ||
			UserData.hasFeature(feature) === expectedState
		) {
			return null;
		}
		return React.cloneElement(
			React.Children.only(this.props.children),
			props,
		);
	}
}
