import React from "react";
import { Feature, Features } from "../../utils/api";
import DataManager from "../../DataManager";
import { cookie } from "cookie_js";

interface Props {
	className?: string;
	lazyReload?: boolean;
}

interface State {
	expanded: boolean;
	features: Feature[] | null;
	reload: boolean;
	freeMode: boolean;
	loggedOutMode: boolean;
}

export default class DevTools extends React.Component<Props, State> {
	private ref: HTMLElement;
	private dropdownRef: HTMLElement;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
			features: [],
			reload: false,
			freeMode: cookie.get("free-mode", "") === "true",
			loggedOutMode: cookie.get("logged-out-mode", "") === "true",
		};
	}

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
		DataManager.get("/api/v1/features/").then((payload: Features) => {
			const features =
				payload.results && Array.isArray(payload.results)
					? payload.results
					: [];
			this.setState({ features });
		});
	}

	public componentWillUnmount(): void {
		document.removeEventListener("mousedown", this.clickAnywhere);
	}

	private toggleDropdown = (event: React.MouseEvent<HTMLElement>) => {
		if (
			this.dropdownRef &&
			this.dropdownRef.contains(event.target as any)
		) {
			return;
		}

		event.preventDefault();
		this.setState(({ expanded, ...state }) => ({
			expanded: !expanded,
			...state,
		}));
	};

	private toggleFreemode = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		const freeMode = !this.state.freeMode;
		if (freeMode) {
			cookie.set("free-mode", "true", { path: "/", expires: 365 });
		} else {
			cookie.remove("free-mode");
		}
		this.setState({ freeMode, reload: true });
		if (!this.props.lazyReload) {
			document.location.reload();
		}
	};

	private toggleLoggedOutMode = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		const loggedOutMode = !this.state.loggedOutMode;
		if (loggedOutMode) {
			cookie.set("logged-out-mode", "true", { path: "/", expires: 365 });
		} else {
			cookie.remove("logged-out-mode");
		}
		this.setState({ loggedOutMode, reload: true });
		if (!this.props.lazyReload) {
			document.location.reload();
		}
	};

	private toggleFeature = (name: string) => {
		if (!Array.isArray(this.state.features)) {
			return;
		}
		const feature = this.state.features.find(f => f.name === name);
		if (!feature) {
			return;
		}
		fetch(`/api/v1/features/${feature.name}/`, {
			method: "POST",
			credentials: "include",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-CSRFToken": cookie.get("csrftoken"),
			},
			body: JSON.stringify({ enabled: !feature.enabled_for_user }),
		}).then(async response => {
			if (response.status !== 200) {
				return;
			}
			const enabled = !!(await response.json()).enabled;
			this.setState(state => {
				const oldFeatures = state.features;
				if (!oldFeatures) {
					return state;
				}
				const newFeatures = oldFeatures.slice();
				const index = newFeatures.findIndex(f => f.name === name);
				if (index === -1) {
					return state;
				}
				newFeatures[index] = Object.assign({}, newFeatures[index], {
					enabled_for_user: enabled,
				});
				return Object.assign({}, state, {
					features: newFeatures,
					reload: true,
				});
			});
			if (!this.props.lazyReload) {
				document.location.reload();
			}
		});
	};

	private renderFeatures(): React.ReactNode {
		const { features } = this.state;
		if (!features) {
			return (
				<li className="disabled">
					<a href="#">Loading…</a>
				</li>
			);
		}
		if (!features.length) {
			return (
				<li className="disabled">
					<a href="#">No features</a>
				</li>
			);
		}
		const labels = {
			OFF: "label-default",
			LOGGED_IN_USERS: "label-info",
			AUTHORIZED_ONLY: "label-warning",
			STAFF_ONLY: "label-primary",
			PUBLIC: "label-success",
		};

		const getLabelClassName = (feature: Feature): string => {
			if (feature.enabled_for_user) {
				return "label label-success";
			}
			return "label label-default";
		};

		return (
			<>
				{features
					.sort((a, b) => (a.name > b.name ? 1 : -1))
					.map(feature => (
						<li key={feature.name}>
							<a
								href="#"
								className="devtools-feature"
								onClick={() => this.toggleFeature(feature.name)}
							>
								{feature.name}
								<span className={getLabelClassName(feature)}>
									{feature.status}
								</span>
							</a>
						</li>
					))}
			</>
		);
	}

	private renderDropdown(): React.ReactNode {
		if (!this.state.expanded) {
			return;
		}

		return (
			<ul className="dropdown-menu" ref={ref => (this.dropdownRef = ref)}>
				<li>
					<a href="/admin/">Admin</a>
				</li>
				<li role="separator" className="divider" />
				<li className="dropdown-header" id="devtools-features-header">
					Account
				</li>
				<li className={this.state.freeMode ? "active" : ""}>
					<a href="#" onClick={this.toggleFreemode}>
						Free Mode
					</a>
				</li>
				<li className={this.state.loggedOutMode ? "active" : ""}>
					<a href="#" onClick={this.toggleLoggedOutMode}>
						Logged Out Mode
					</a>
				</li>
				<li role="separator" className="divider" />
				<li className="dropdown-header" id="devtools-features-header">
					Features
				</li>
				{this.renderFeatures()}
				{this.props.lazyReload && this.state.reload ? (
					<li>
						<a href="#" onClick={() => document.location.reload()}>
							<span className="glyphicon glyphicon-refresh" />
							Reload
						</a>
					</li>
				) : null}
				<li>
					<a href="/admin/features/feature/">Edit Features</a>
				</li>
			</ul>
		);
	}

	public render(): React.ReactNode {
		const classNames = ["dropdown-toggle"];
		const open = this.state.expanded ? " open" : "";

		return (
			<li
				className={`${this.props.className || ""}${open}`}
				onClick={this.toggleDropdown}
				ref={ref => (this.ref = ref)}
			>
				<a
					href="/admin/"
					className={classNames.join(" ")}
					role="button"
					aria-haspopup="true"
					aria-expanded={this.state.expanded}
					onClick={e => e.preventDefault()}
				>
					<span>DevTools</span> <span className="caret" />
				</a>
				{this.renderDropdown()}
			</li>
		);
	}
}
