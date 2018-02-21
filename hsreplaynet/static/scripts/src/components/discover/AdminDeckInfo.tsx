import React from "react";
import { withLoading } from "../loading/Loading";

interface Props {
	data?: any;
	playerClass: string;
}

class AdminDeckInfo extends React.Component<Props> {
	public render(): React.ReactNode {
		const { data, playerClass } = this.props;
		return (
			<ul>
				<li>
					<span>View Deck in Admin</span>
					<span className="infobox-value">
						<a href={`/admin/decks/deck/${data.id}/change`}>
							Admin link
						</a>
					</span>
				</li>
			</ul>
		);
	}
}

export default withLoading()(AdminDeckInfo);
