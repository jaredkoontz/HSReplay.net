import React from "react";
import ErrorReporter from "./ErrorReporter";
import { Provider as HearthstoneAccountProvider } from "./utils/hearthstone-account";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

interface Props {}

export default class Root extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<I18nextProvider i18n={i18n}>
				<ErrorReporter>
					<HearthstoneAccountProvider>
						{this.props.children}
					</HearthstoneAccountProvider>
				</ErrorReporter>
			</I18nextProvider>
		);
	}
}
