import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { image } from "../../../helpers";

interface Props extends InjectedTranslateProps {
	id?: string;
	hasLegacyClient?: boolean;
}

interface State {
	showBanner: boolean;
}

class DownloadSection extends React.Component<Props, State> {
	static defaultProps = {
		id: "collection-setup-download-client",
	};

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			showBanner: false,
		};
	}

	private toggle = (event: React.SyntheticEvent<HTMLElement>): void => {
		event.preventDefault();
		this.setState(state =>
			Object.assign({}, state, {
				showBanner: !state.showBanner,
			}),
		);
	};

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<section id={this.props.id}>
				<h2>{t("Download Hearthstone Deck Tracker")}</h2>
				<p className="text-center">
					{this.props.hasLegacyClient
						? t(
								"Make sure you have the latest version of Hearthstone Deck Tracker:",
						  )
						: t(
								"Hearthstone Deck Tracker will upload your collection and keep it up to date:",
						  )}
				</p>
				<p className="text-center">
					<a
						href="https://hsdecktracker.net/download/"
						target="_blank"
						className="btn promo-button"
						rel="noopener"
					>
						{t("Download (Windows)")}
					</a>
				</p>
				<p className="text-center">
					<a href="#" onClick={this.toggle}>
						{t(
							"How can I tell whether I have the correct version?",
						)}
					</a>
				</p>
				{this.state.showBanner ? (
					<>
						<p className="text-center">
							{t(
								"You're on the latest version if you see this banner at the top:",
							)}
						</p>
						<div className="text-center">
							<img
								src={image(
									"feature-promotional/collection-syncing-hdt.png",
								)}
							/>
						</div>
					</>
				) : null}
			</section>
		);
	}
}
export default translate()(DownloadSection);
