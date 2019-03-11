import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { cardSorting, cleanText } from "../helpers";
import { Archetype } from "../utils/api";
import ObjectSearch, { Limit } from "./ObjectSearch";

interface Props extends WithTranslation {
	availableArchetypes: Archetype[];
	selectedArchetypes?: Archetype[];
	onArchetypeSelected?: (archetype: Archetype) => void;
	onArchetypesChanged?: (archetypes: Archetype[]) => void;
	id?: string;
	label?: string;
}

class ArchetypeSearch extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<ArchetypeObjectSearch
				getFilteredObjects={query => this.getFilteredArchetypes(query)}
				getObjectElement={archetype =>
					this.getArchetypeElement(archetype)
				}
				getObjectKey={archetype => "" + archetype.id}
				id={this.props.id}
				label={this.props.label}
				noDataText={t("No archetype found")}
				objectLimit={Limit.SINGLE}
				onObjectsChanged={this.props.onArchetypesChanged}
				onObjectSelected={this.props.onArchetypeSelected}
				placeholder={t("Set as favorite…")}
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

	getArchetypeElement(archetype: Archetype): React.ReactNode {
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

export default withTranslation()(ArchetypeSearch);
