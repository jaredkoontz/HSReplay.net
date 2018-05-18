import React from "react";
import { fetchCSRF } from "../helpers";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	shortid: string;
	done?: () => void;
}

interface State {
	deleted: boolean;
	working: boolean;
}

class DeleteReplayButton extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			deleted: false,
			working: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<button
				className="btn btn-danger btn-xs"
				disabled={this.state.deleted || this.state.working}
				onClick={() => this.onRequestDelete()}
			>
				{this.state.deleted
					? t("Deleted")
					: this.state.working
						? t("Deleting…")
						: t("Delete")}
			</button>
		);
	}

	private onRequestDelete() {
		if (this.state.working || this.state.deleted) {
			return;
		}
		const { t } = this.props;
		if (!confirm(t("Are you sure you would like to remove this replay?"))) {
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
						`Unexpected status code ${+statusCode}, expected 200, 204 or 404`,
					);
				}
				if (this.props.done) {
					this.props.done();
				}
				this.setState({ deleted: true });
			})
			.catch(err => {
				alert(t("Replay could not be deleted."));
			})
			.then(() => {
				this.setState({ working: false });
			});
	}
}

export default translate()(DeleteReplayButton);
