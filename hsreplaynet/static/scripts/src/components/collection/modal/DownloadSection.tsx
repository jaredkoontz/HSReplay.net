import React from "react";

interface Props {
	id?: string;
	hasLegacyClient?: boolean;
}

export default class DownloadSection extends React.Component<Props> {
	static defaultProps = {
		id: "collection-download-client",
	};

	public render(): React.ReactNode {
		return (
			<section id={this.props.id}>
				<h2>Download Hearthstone Deck Tracker</h2>
				<p className="text-center">
					{this.props.hasLegacyClient ? (
						<>
							Make sure you have the latest version of Hearthstone
							Deck Tracker:
						</>
					) : (
						<>
							Hearthstone Deck Tracker will upload your collection
							and keep it up to date:
						</>
					)}
				</p>
				<p className="text-center">
					<a
						href="https://hsdecktracker.net/download/"
						target="_blank"
						className="btn promo-button"
						rel="noopener"
					>
						Download
					</a>
				</p>
			</section>
		);
	}
}
