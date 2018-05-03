import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../../UserData";
import { addNextToUrl } from "../../utils/account";

interface Props extends InjectedTranslateProps {
	label?: string;
	className?: string;
	next?: string;
}

interface State {
	expanded: boolean;
}

class LoginButton extends React.Component<Props, State> {
	private ref: HTMLElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	private toggle = (): void => {
		this.setState(state =>
			Object.assign({}, state, {
				expanded: !state.expanded,
			}),
		);
	};

	private clickAnywhere = (e: MouseEvent) => {
		if (!this.state.expanded) {
			// we don't care if we're not expanded
			return;
		}

		if (this.ref && !this.ref.contains(e.target as any)) {
			this.setState({ expanded: false });
		}
	};

	public componentDidMount(): void {
		document.addEventListener("mousedown", this.clickAnywhere);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("mousedown", this.clickAnywhere);
	}

	public render(): React.ReactNode {
		const { next, label, t } = this.props;
		const login = UserData.getLoginUrl("default");
		const blizzard = UserData.getLoginUrl("blizzard");
		const china = UserData.getLoginUrl("blizzard_cn");
		const password = UserData.getLoginUrl("password");

		return (
			<div
				className={"btn-group" + (this.state.expanded ? " open" : "")}
				ref={ref => (this.ref = ref)}
			>
				<a
					href={addNextToUrl(login, next)}
					className="btn promo-button hero-button"
					rel="nofollow"
				>
					{label || t("Log in with Blizzard")}
				</a>
				{blizzard || china || password ? (
					<>
						<button
							type="button"
							className="btn promo-button hero-button dropdown-toggle"
							role="button"
							aria-haspopup="true"
							aria-expanded={this.state.expanded}
							onClick={this.toggle}
						>
							<span className="caret" />
							<span className="sr-only">
								{t("Toggle Dropdown")}
							</span>
						</button>
						<ul className={"dropdown-menu"}>
							{blizzard || china ? (
								<>
									<li className="dropdown-header">
										{t("Regions")}
									</li>
									{blizzard ? (
										<li>
											<a
												href={addNextToUrl(
													blizzard,
													next,
												)}
												rel="nofollow"
											>
												{t("Blizzard (US/EU/SEA)…")}
											</a>
										</li>
									) : null}
									{china ? (
										<li>
											<a
												href={addNextToUrl(china, next)}
												rel="nofollow"
											>
												{t("Blizzard China (CN)…")}
											</a>
										</li>
									) : null}
								</>
							) : null}
							{password ? (
								<>
									<li className="dropdown-header">
										{t("Debug")}
									</li>
									<li>
										<a href={addNextToUrl(password, next)}>
											{t("Sign in with password…")}
										</a>
									</li>
								</>
							) : null}
						</ul>
					</>
				) : null}
			</div>
		);
	}
}

export default translate()(LoginButton);
