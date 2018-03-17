import React from "react";
import UserData from "../../UserData";
import { addNextToUrl } from "../../utils/account";

interface Props {
	label?: string;
	className?: string;
	next?: string;
}

interface State {
	expanded: boolean;
}

export default class LoginButton extends React.Component<Props, State> {
	private ref: HTMLElement;

	constructor(props: Props, context: any) {
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
		const { next, label } = this.props;
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
					{label || "Log in with Blizzard"}
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
							<span className="sr-only">Toggle Dropdown</span>
						</button>
						<ul className={"dropdown-menu"}>
							{blizzard || china ? (
								<>
									<li className="dropdown-header">Regions</li>
									{blizzard ? (
										<li>
											<a
												href={addNextToUrl(
													blizzard,
													next,
												)}
												rel="nofollow"
											>
												Blizzard (US/EU/SEA)&hellip;
											</a>
										</li>
									) : null}
									{china ? (
										<li>
											<a
												href={addNextToUrl(china, next)}
												rel="nofollow"
											>
												Blizzard China (CN)&hellip;
											</a>
										</li>
									) : null}
								</>
							) : null}
							{password ? (
								<>
									<li className="dropdown-header">Debug</li>
									<li>
										<a href={addNextToUrl(password, next)}>
											Sign in with password&hellip;
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
