import React from "react";

export default class DumpPropsComponent extends React.Component<any> {
	constructor(props: any, context: any) {
		super(props, context);
		console.debug(props);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<{}>,
		nextContext: any,
	): void {
		console.debug(nextProps);
	}

	public render(): React.ReactNode | any {
		return null;
	}
}
