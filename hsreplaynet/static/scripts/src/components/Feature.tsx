import React from "react";
import UserData from "../UserData";

interface Props {
	feature: string;
}

export default class Feature extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.props.children || !UserData.hasFeature(this.props.feature)) {
			return null;
		}
		const { feature, children, ...props } = this.props;
		return React.cloneElement(
			React.Children.only(this.props.children),
			props
		);
	}
}
