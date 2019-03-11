import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import InfoboxFilter from "./InfoboxFilter";
import InfoboxFilterGroup from "./InfoboxFilterGroup";

interface Props extends WithTranslation {
	archetypes: any[];
	playerClasses: string[];
	selectedArchetypes: string[];
	archetypesChanged: (archetypes: string[]) => void;
	data?: any;
	multiSelect?: boolean;
}

class ArchetypeFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			archetypes,
			archetypesChanged,
			data,
			playerClasses,
			selectedArchetypes,
			t,
		} = this.props;
		if (!data) {
			return null;
		}

		const filters = [];
		if (archetypes) {
			const addFilter = (archetypeId, playerClass, name) => {
				filters.push(
					<InfoboxFilter value={"" + archetypeId} key={archetypeId}>
						<span
							className={`player-class ${playerClass.toLowerCase()}`}
						>
							{name}
						</span>
					</InfoboxFilter>,
				);
			};
			const validPlayerClass = archetype =>
				playerClasses.indexOf(archetype.playerClass) !== -1;

			const others = {};
			archetypes.filter(validPlayerClass).map(archetype => {
				const archetypeData = data.find(
					a => "" + a.id === archetype.id,
				);
				if (archetypeData) {
					addFilter(
						archetype.id,
						archetype.playerClass,
						archetypeData.name,
					);
				} else {
					others[archetype.playerClass] = archetype.id;
				}
			});
			playerClasses.forEach(playerClass => {
				if (others[playerClass]) {
					addFilter(others[playerClass], playerClass, t("Other"));
				}
			});
		}

		if (filters.length === 0) {
			return null;
		}

		return (
			<div className="archetype-filter-wrapper">
				<InfoboxFilterGroup
					deselectable
					selectedValue={selectedArchetypes.map(String)}
					onClick={(value, sender) => {
						if (value !== null) {
							if (!this.props.multiSelect) {
								archetypesChanged([value]);
							} else if (
								selectedArchetypes.indexOf(value) === -1
							) {
								archetypesChanged(
									selectedArchetypes.concat([value]),
								);
							}
						} else {
							archetypesChanged(
								selectedArchetypes.filter(x => x !== sender),
							);
						}
					}}
				>
					{filters}
				</InfoboxFilterGroup>
			</div>
		);
	}
}

export default withTranslation()(ArchetypeFilter);
