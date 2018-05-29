import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	hdtDownloadUrl: string;
	hstrackerDownloadUrl: string;
}
interface State {}

class Downloads extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<div id="downloads" className="container-fluid">
				<header>
					<h1>{t("Downloads")}</h1>
				</header>

				<div className="row">
					<div className="col-lg-2 col-lg-offset-4 col-md-3 col-md-offset-3 col-sm-6 col-xs-12 download-container">
						<a
							href={this.props.hdtDownloadUrl}
							className="download-platform"
						>
							<p>
								<i className="fa fa-windows" />
							</p>
							<p>{t("Windows")}</p>
						</a>
						<div className="download-description">
							<p>
								{t(
									"Our official client on Windows is Hearthstone Deck Tracker.",
								)}
							</p>
						</div>
						<a
							href={this.props.hdtDownloadUrl}
							className="download-clickme"
						>
							{t("Download")}
						</a>
					</div>

					<div className="col-lg-2 col-md-3 col-md-3 col-sm-6 col-xs-12 download-container">
						<a
							href={this.props.hstrackerDownloadUrl}
							className="download-platform"
						>
							<p>
								<i className="fa fa-apple" />
							</p>
							<p>{t("macOS")}</p>
						</a>
						<div className="download-description">
							<p>
								{t(
									"For macOS, download HSTracker, the official port of Hearthstone Deck Tracker.",
								)}
							</p>
						</div>
						<a
							href={this.props.hstrackerDownloadUrl}
							className="download-clickme"
						>
							{t("Download")}
						</a>
					</div>
				</div>
			</div>
		);
	}
}

export default translate()(Downloads);
