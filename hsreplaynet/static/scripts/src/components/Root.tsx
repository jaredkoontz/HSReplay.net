import React from "react";
import ErrorReporter from "./ErrorReporter";

interface Props {}

export default class Root extends React.Component<Props> {
	public render(): React.ReactNode {
		return <ErrorReporter>{this.props.children}</ErrorReporter>;
	}
}
