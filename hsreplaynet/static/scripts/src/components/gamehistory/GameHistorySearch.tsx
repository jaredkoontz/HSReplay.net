import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	query: string;
	setQuery: (query: string) => void;
}

class GameHistorySearch extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="search-wrapper">
				<input
					type="search"
					placeholder={t("Search for players…")}
					className="form-control"
					value={this.props.query || ""}
					onChange={(e: any) => this.props.setQuery(e.target.value)}
				/>
			</div>
		);
	}
}
export default withTranslation()(GameHistorySearch);
