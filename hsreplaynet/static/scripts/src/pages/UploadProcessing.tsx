import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	adminUrl: string;
	error: string;
	isProcessing: boolean;
	status: string;
}

interface State {}

class UploadProcessing extends React.Component<Props, State> {
	public render(): React.ReactNode {
		if (!status || status === "PROCESSING") {
			setTimeout(() => {
				location.reload();
			}, 3000);
		}

		return (
			<>
				{this.renderMessage()}
				{this.props.adminUrl ? (
					<p>
						<p>
							<a href={this.props.adminUrl}>View in admin</a>
						</p>
					</p>
				) : null}
			</>
		);
	}

	public renderMessage(): React.ReactNode {
		const { error, isProcessing, status, t } = this.props;

		switch (status) {
			case undefined:
				return (
					<>
						<p>
							{t("Your replay is still uploading. Hold on!")}
							<br />
							<small>
								<em>
									{t("Hmm. Or maybe something went wrong…")}
								</em>
							</small>
						</p>
						<p>
							<small>
								<a href="https://twitter.com/HSReplayNet">
									{t(
										"Follow us on Twitter for maintenance announcements.",
									)}
								</a>
							</small>
						</p>
					</>
				);

			case "UNSUPPORTED":
				return (
					<p>
						<strong>{t("This replay is not supported.")}</strong>
						<br />
						<em>{error}</em>
					</p>
				);

			case "VALIDATION_ERROR":
				return (
					<p>
						<strong>
							The uploaded file is not a valid replay.
						</strong>
						<br />
						<em>{error}</em>
					</p>
				);
			case "UNSUPPORTED_CLIENT":
				return (
					<>
						<strong>{t("Your deck tracker is too old!")}</strong>
						<div
							style={{
								margin: "1em auto",
								fontSize: "0.7em",
								maxWidth: "800px",
							}}
						>
							<p>
								<a
									href="/downloads/"
									className="download-clickme"
								>
									Download Hearthstone Deck Tracker
								</a>
							</p>
						</div>
					</>
				);
			case "UNSUPPORTED_BUILD":
				return (
					<>
						<strong>This replay is too old!</strong>

						<div
							style={{
								margin: "1em auto",
								fontSize: "0.7em",
								maxWidth: "800px",
							}}
						>
							<strong>
								{t(
									"We no longer support uploads from the version of Hearthstone you are using. If you are already on the latest version, please contact us for assistance.",
								)}
							</strong>
						</div>
					</>
				);

			case "PROCESSING":
				return (
					<p>
						{t("Your replay is still processing. Check back soon!")}
					</p>
				);

			default:
				return (
					<p>
						{t(
							"Something went wrong generating this replay. We're on it.",
						)}
					</p>
				);
		}
	}
}

export default translate()(UploadProcessing);
