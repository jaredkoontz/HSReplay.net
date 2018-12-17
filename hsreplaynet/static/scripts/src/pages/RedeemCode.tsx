import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CSRFElement from "../components/CSRFElement";
import { fetchCSRF } from "../helpers";

interface Props extends InjectedTranslateProps {
	code: string;
	autofocus?: boolean;
}

interface State {
	code: string;
	working: boolean;
	error: null | string;
	message: null | string;
}

class RedeemCode extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			code: props.code,
			working: false,
			error: null,
			message: null,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<div className="container">
				<h2>{t("Redeem a code")}</h2>

				<p>
					<Trans>
						Redeem an invitation code or{" "}
						<a href="/premium/">HSReplay.net Premium</a> coupon.
					</Trans>
				</p>
				<form onSubmit={this.submit}>
					<CSRFElement />
					<div
						className={
							"form-group" +
							(this.state.error ? " has-error" : "") +
							(this.state.message ? " has-success" : "")
						}
					>
						<label className="control-label">{t("Code:")}</label>
						<input
							className="form-control"
							type="text"
							name="uuid"
							maxLength={36}
							value={this.state.code}
							onChange={this.onChange}
							readOnly={this.state.working}
							autoFocus={this.props.autofocus}
							required
						/>
						{this.state.error ? (
							<p className="help-block">{this.state.error}</p>
						) : null}
						{this.state.message ? (
							<p className="help-block">{this.state.message}</p>
						) : null}
					</div>
					<button
						type="submit"
						className="btn btn-primary"
						disabled={this.state.working}
					>
						{t("Redeem code")}
					</button>
				</form>
			</div>
		);
	}

	private onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ code: event.target.value });
	};

	private submit = async (event: React.FormEvent<HTMLFormElement>) => {
		const { t } = this.props;

		event.preventDefault();

		if (this.state.working) {
			return;
		}
		this.setState({ working: true, error: null, message: null });

		const response = await fetchCSRF("/api/v1/account/redeem/", {
			body: JSON.stringify({ code: this.state.code }),
			method: "POST",
			headers: new Headers({
				Accept: "application/json",
				"Content-Type": "application/json",
			}),
			credentials: "include",
		});
		const status = response.status;
		const message = await response.json();
		if (status === 200) {
			this.setState({ message: message["detail"] });
		} else if (status === 429) {
			this.setState({
				error: t("Please wait a moment before trying again."),
			});
		} else {
			this.setState({
				error: message["detail"] || t("Something went wrong."),
			});
		}
		this.setState({ working: false });
	};
}

export default translate()(RedeemCode);
