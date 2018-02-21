import React from "react";

interface Props {
	query: string;
	setQuery: (query: string) => void;
}

export default class GameHistorySearch extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div className="search-wrapper">
				<input
					type="search"
					placeholder="Search for players…"
					className="form-control"
					value={this.props.query || ""}
					onChange={(e: any) => this.props.setQuery(e.target.value)}
				/>
			</div>
		);
	}
}
