import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { default as UserData } from "../../UserData";

interface Props extends InjectedTranslateProps {
	next: string;
}

interface State {
	expanded: boolean;
	languages: { [key: string]: string };
	activeLanguage: string;
}

class LanguageSelector extends React.Component<Props, State> {
	private ref: HTMLElement;
	private dropdownRef: HTMLElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			expanded: false,
			languages: UserData.getLanguages(),
			activeLanguage:
				document.getElementsByTagName("html")[0].getAttribute("lang") ||
				"en",
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

	private renderDropdown(): React.ReactNode {
		const { t } = this.props;

		if (!this.state.expanded) {
			return;
		}

		return (
			<ul className="dropdown-menu" ref={ref => (this.dropdownRef = ref)}>
				{Object.keys(this.state.languages).map(lang => (
					<li
						className={
							lang === this.state.activeLanguage ? "active" : ""
						}
					>
						<a
							href={`/i18n/setprefs/?hl=${lang}&next=${
								this.props.next
							}`}
						>
							{this.state.languages[lang]}
						</a>
					</li>
				))}

				<li role="separator" className="divider" />
				<li className="text-muted small">
					<a href="/i18n/contribute/" target="_blank" rel="noopener">
						{t("Help translate HSReplay.net!")}
					</a>
				</li>
			</ul>
		);
	}

	public render(): React.ReactNode {
		const classNames = ["dropdown-toggle"];
		const open = this.state.expanded ? " open" : "";
		const { t } = this.props;

		return (
			<li
				className={`${open}`}
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
					<span className="glyphicon glyphicon-globe" />
					<span>
						{this.state.languages[this.state.activeLanguage] ||
							t("Language")}
					</span>{" "}
					<span className="caret" />
				</a>
				{this.renderDropdown()}
			</li>
		);
	}
}

export default translate()(LanguageSelector);
