import React from "react";
import { ApiArchetype } from "../../interfaces";
import { fetchCSRF } from "../../helpers";

interface ClusterArchetypeSelectorState {
	working?: boolean;
}

interface ClusterArchetypeSelectorProps {
	archetypes?: ApiArchetype[];
	clusterId: string;
	format: string;
	playerClass: string;
}

export default class ClusterArchetypeSelector extends React.Component<
	ClusterArchetypeSelectorProps,
	ClusterArchetypeSelectorState
> {
	constructor(
		props: ClusterArchetypeSelectorProps,
		state: ClusterArchetypeSelectorState
	) {
		super(props, state);
		this.state = {
			working: false
		};
	}

	public render(): React.ReactNode {
		let btnClassName = "btn btn-secondary dropdown-toggle";
		if (this.state.working) {
			btnClassName += " disabled";
		}
		return (
			<span className="dropdown archetype-selection-dropdown">
				<button
					className={btnClassName}
					type="button"
					id="dropdownMenuButton"
					data-toggle="dropdown"
					aria-haspopup="true"
					aria-expanded="false"
				>
					<span className="glyphicon glyphicon-triangle-bottom" />
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
							Remove Archetype
						</a>
					</li>
					<li role="separator" className="divider" />
					<li>
						<a
							href="/admin/decks/archetype/"
							onClick={e => {
								e.preventDefault();
								// Absolutely no idea why this doesn't just work
								window.open("/admin/decks/archetype/");
							}}
						>
							Edit Archetypes
						</a>
					</li>
				</ul>
			</span>
		);
	}

	availableArchetypes(): JSX.Element[] {
		if (!this.props.archetypes) {
			return null;
		}
		return this.props.archetypes.map(x => (
			<li>
				<a href="#" onClick={e => this.onArchetypeClick(e, x.id)}>
					{x.name}
				</a>
			</li>
		));
	}

	onArchetypeClick = (event: any, archetypeId: number | null) => {
		event.preventDefault();
		this.setState({ working: true });
		const headers = new Headers();
		const { format, playerClass, clusterId } = this.props;
		headers.set("content-type", "application/json");
		fetchCSRF(`/clusters/latest/${format}/${playerClass}/${clusterId}/`, {
			body: JSON.stringify({ archetype_id: archetypeId }),
			credentials: "same-origin",
			headers,
			method: "PATCH"
		})
			.then((response: Response) => {
				if (!response.ok) {
					console.error(response.toString());
				}
				this.setState({ working: false });
				location.reload();
			})
			.catch(reason => {
				console.error(reason);
				this.setState({ working: false });
			});
	};
}
