import clipboard from "clipboard-polyfill";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../UserData";

interface Props extends InjectedTranslateProps {
	url: string;
	discount: string;
	onCopy?: () => any;
}

interface State {
	expanded: boolean;
	copied: boolean;
}

class ReferralsPromo extends React.Component<Props, State> {
	private timeout: number | null;
	private urlBox: HTMLInputElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			expanded: UserData.isPremium(),
			copied: false,
		};
	}

	public componentWillUnmount(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	toggle = (e: React.MouseEvent<HTMLElement>): void => {
		e.preventDefault();
		this.setState(state => ({ expanded: !state.expanded }));
	};

	copy = (e: React.MouseEvent<HTMLButtonElement>): void => {
		e.preventDefault();
		clipboard.writeText(this.props.url).then(() => {
			window.clearTimeout(this.timeout);
			if (typeof this.props.onCopy === "function") {
				this.props.onCopy();
			}
			this.setState({ copied: true }, () => {
				this.timeout = window.setTimeout(() => {
					this.setState({ copied: false });
				}, 3000);
			});
		});
	};

	public render(): React.ReactNode {
		const { discount, t } = this.props;
		return (
			<div className="referrals-promo">
				<div
					className={
						"text-center collapse-animate-height" +
						(this.state.expanded ? " show" : "")
					}
				>
					<section>
						<h1>{t("Refer a Friend")}</h1>

						<p>
							{t(
								"Earn some credits for free Premium! Just refer your friends using your referral link!",
							)}
							<br />
							{t(
								"For each of your friends that subscribes for the first time, you'll get {discount} off your next month's bill.",
								{ discount },
							)}
						</p>
						<div className="input-group input-group-lg">
							<input
								type="text"
								readOnly
								className="form-control"
								value={this.props.url}
								onSelect={e => {
									this.urlBox.setSelectionRange(
										0,
										this.urlBox.value.length,
									);
								}}
								onCopy={e =>
									typeof this.props.onCopy === "function" &&
									this.props.onCopy()
								}
								ref={ref => (this.urlBox = ref)}
							/>
							<span className="input-group-btn">
								<button
									className="btn btn-default"
									type="button"
									onClick={this.copy}
								>
									{this.state.copied
										? t("Copied!")
										: t("Copy")}
								</button>
							</span>
						</div>
						<p className="text-muted">
							{t(
								"Note: Credits are not usable with PayPal subscriptions.",
							)}
						</p>
					</section>
				</div>
				<a
					href="#"
					onClick={this.toggle}
					aria-expanded={this.state.expanded}
					className="referrals-promo-cta referrals-spread"
				>
					{!this.state.expanded ? (
						<>
							<span>▾</span>
							<span>{t("Refer a Friend")}</span>
							<span>▾</span>
						</>
					) : null}
				</a>
			</div>
		);
	}
}

export default translate()(ReferralsPromo);
