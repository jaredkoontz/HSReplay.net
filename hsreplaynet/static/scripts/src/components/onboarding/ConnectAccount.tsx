import React from "react";
import { Trans } from "react-i18next";

interface Props {
	feature: string;
}

export default class ConnectAccount extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<>
				<h2>
					<Trans>Connect your Hearthstone account</Trans>
				</h2>
				<p>
					<Trans
						defaults="Play a game of Hearthstone and <0>upload the replay</0> to start using {feature}."
						components={[
							<a key={0} href="/games/mine/">
								0
							</a>,
						]}
						tOptions={{
							feature: this.props.feature,
						}}
					/>
				</p>
				<p className="text-muted">
					<Trans>
						Please <a href="/contact/">contact us</a> if you keep
						seeing this message.
					</Trans>
				</p>
			</>
		);
	}
}
