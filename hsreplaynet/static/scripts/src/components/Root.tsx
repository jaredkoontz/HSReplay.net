import React from "react";
import ErrorReporter from "./ErrorReporter";
import { Provider as HearthstoneAccountProvider } from "./utils/hearthstone-account";
import UserData from "../UserData";

interface Props {}

export default class Root extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<ErrorReporter>
				<HearthstoneAccountProvider value={UserData.getDefaultAccountKey()}>
					{this.props.children}
				</HearthstoneAccountProvider>
			</ErrorReporter>
		);
	}
}
