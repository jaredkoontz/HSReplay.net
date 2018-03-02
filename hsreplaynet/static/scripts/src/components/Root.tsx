import React from "react";
import ErrorReporter from "./ErrorReporter";
import { Provider as HearthstoneAccountProvider } from "./utils/hearthstone-account";

interface Props {}

export default class Root extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<ErrorReporter>
				<HearthstoneAccountProvider>
					{this.props.children}
				</HearthstoneAccountProvider>
			</ErrorReporter>
		);
	}
}
