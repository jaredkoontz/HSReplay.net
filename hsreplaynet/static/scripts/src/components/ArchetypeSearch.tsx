import React from "react";
import { cardSorting, cleanText } from "../helpers";
import ObjectSearch, { Limit } from "./ObjectSearch";
import { Archetype } from "../utils/api";

interface Props {
	availableArchetypes: Archetype[];
	selectedArchetypes?: Archetype[];
	onArchetypeSelected?: (archetype: Archetype) => void;
	onArchetypesChanged?: (archetypes: Archetype[]) => void;
	id?: string;
	label?: string;
}

export default class ArchetypeSearch extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<ArchetypeObjectSearch
				getFilteredObjects={query => this.getFilteredArchetypes(query)}
				getObjectElement={archetype =>
					this.getArchetypeElement(archetype)
				}
				getObjectKey={archetype => "" + archetype.id}
				id={this.props.id}
				label={this.props.label}
				noDataText="No archetype found"
				objectLimit={Limit.SINGLE}
				onObjectsChanged={this.props.onArchetypesChanged}
				onObjectSelected={this.props.onArchetypeSelected}
				placeholder="Set favorite..."
				selectedObjects={this.props.selectedArchetypes}
				sorting={cardSorting}
				showOnFocus
			/>
		);
	}

	getFilteredArchetypes(query: string): Archetype[] {
		if (!this.props.availableArchetypes) {
			return [];
		}
		if (!query) {
			return this.props.availableArchetypes;
		}
		const cleanQuery = cleanText(query);
		if (!cleanQuery) {
			return [];
		}
		return this.props.availableArchetypes.filter(archetype => {
			return cleanText(archetype.name).indexOf(cleanQuery) !== -1;
		});
	}

	getArchetypeElement(archetype: Archetype): JSX.Element {
		return (
			<div
				className={`player-class ${archetype.player_class_name.toLowerCase()}`}
			>
				{archetype.name}
			</div>
		);
	}
}

// tslint:disable-next-line:max-classes-per-file
class ArchetypeObjectSearch extends ObjectSearch<Archetype> {}
