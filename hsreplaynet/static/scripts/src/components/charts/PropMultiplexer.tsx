import React from "react";
import * as _ from "lodash";

export default class PropMultiplexer extends React.Component {
	public render(): React.ReactNode {
		const children = this.props.children;
		const childProps: any = _.omit(this.props, [
			"children",
			"style",
			"flyoutStyle",
			"pointerLength"
		]);
		const newChildren = React.Children.map(this.props.children, child => {
			return React.cloneElement(child as any, childProps);
		});
		return <g>{newChildren}</g>;
	}
}
