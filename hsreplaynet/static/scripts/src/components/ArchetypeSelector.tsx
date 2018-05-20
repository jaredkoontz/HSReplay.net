import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { fetchCSRF } from "../helpers";
import { Archetype } from "../utils/api";

interface Props extends InjectedTranslateProps {
	archetypes?: Archetype[];
	deckId: string;
	defaultSelectedArchetype?: number;
}

interface State {
	selectedArchetype: number;
	working: boolean;
}

class ArchetypeSelector extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			selectedArchetype: props.defaultSelectedArchetype,
			working: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="dropdown">
				<button
					className="btn btn-default dropdown-toggle"
					type="button"
					id="dropdownMenu1"
					data-toggle="dropdown"
					aria-haspopup="true"
					aria-expanded="true"
					disabled={this.state.working}
				>
					{this.selectedArchetype()}
					<span className="caret" />
				</button>
				<ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
					<li className="dropdown-header">Modify Archetype</li>
					{this.availableArchetypes()}
					<li role="separator" className="divider" />
					<li>
						<a
							href="#"
							onClick={e => this.onArchetypeClick(e, null)}
						>
							{t("Remove Archetype")}
						</a>
					</li>
					<li role="separator" className="divider" />
					<li>
						<a href="/admin/decks/archetype/">Edit Archetypes</a>
					</li>
				</ul>
			</div>
		);
	}

	availableArchetypes(): JSX.Element[] {
		return this.props.archetypes.map(x => (
			<li>
				<a href="#" onClick={e => this.onArchetypeClick(e, x.id)}>
					{x.name}
				</a>
			</li>
		));
	}

	selectedArchetype(): string {
		const { t } = this.props;
		if (!this.state.selectedArchetype) {
			return t("No Archetype");
		}
		const archetype = this.props.archetypes.find(
			a => a.id === this.state.selectedArchetype,
		);
		return archetype ? archetype.name : t("Unknown Archetype");
	}

	onArchetypeClick = (event: any, archetypeId: number | null) => {
		event.preventDefault();
		this.setState({ working: true });
		const headers = new Headers();
		headers.set("content-type", "application/json");
		fetchCSRF("/api/v1/decks/" + this.props.deckId + "/", {
			body: JSON.stringify({ archetype: archetypeId }),
			credentials: "same-origin",
			headers,
			method: "PATCH",
		})
			.then((response: Response) => {
				if (response.ok) {
					response.json().then(data => {
						this.setState({
							selectedArchetype: data.archetype,
							working: false,
						});
					});
				} else {
					console.error(response.toString());
					this.setState({ working: false });
				}
			})
			.catch(reason => {
				console.error(reason);
				this.setState({ working: false });
			});
	};
}

export default translate()(ArchetypeSelector);
