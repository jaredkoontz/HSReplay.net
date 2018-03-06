import React from "react";
import { fetchCSRF } from "../helpers";

interface Props {
	shortid: string;
	done?: () => void;
}

interface State {
	deleted: boolean;
	working: boolean;
}

export default class DeleteReplayButton extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			deleted: false,
			working: false,
		};
	}

	public render(): React.ReactNode {
		return (
			<button
				className="btn btn-danger btn-xs"
				disabled={this.state.deleted || this.state.working}
				onClick={() => this.onRequestDelete()}
			>
				{this.state.deleted
					? "Deleted"
					: this.state.working ? "Deleting…" : "Delete"}
			</button>
		);
	}

	protected onRequestDelete() {
		if (this.state.working || this.state.deleted) {
			return;
		}
		if (!confirm("Are you sure you would like to remove this replay?")) {
			return;
		}
		this.setState({ working: true });
		const headers = new Headers();
		headers.set("content-type", "application/json");
		fetchCSRF("/api/v1/games/" + this.props.shortid + "/", {
			credentials: "same-origin",
			method: "DELETE",
			headers,
		})
			.then((response: Response) => {
				const statusCode = response.status;
				if (
					statusCode !== 200 &&
					statusCode !== 204 &&
					statusCode !== 404
				) {
					throw new Error(
						"Unexpected status code " +
							statusCode +
							", expected 200, 204 or 404",
					);
				}
				if (this.props.done) {
					this.props.done();
				}
				this.setState({ deleted: true });
			})
			.catch(err => {
				alert("Replay could not be deleted.");
			})
			.then(() => {
				this.setState({ working: false });
			});
	}
}
