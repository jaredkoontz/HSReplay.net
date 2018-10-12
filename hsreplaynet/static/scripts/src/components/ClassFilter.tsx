import React from "react";
import { isEqual } from "lodash";
import ArchetypeFilter from "./ArchetypeFilter";
import ClassIcon from "./ClassIcon";
import DataInjector from "./DataInjector";
import PrettyCardClass from "./text/PrettyCardClass";

export type FilterOption =
	| "ALL"
	| "DRUID"
	| "HUNTER"
	| "MAGE"
	| "PALADIN"
	| "PRIEST"
	| "ROGUE"
	| "SHAMAN"
	| "WARLOCK"
	| "WARRIOR"
	| "NEUTRAL";

export type FilterPreset = "All" | "AllNeutral" | "Neutral" | "ClassesOnly";

interface Props {
	disabled?: boolean;
	filters: FilterOption[] | FilterPreset;
	hideAll?: boolean;
	minimal?: boolean;
	multiSelect?: boolean;
	tabIndex?: number;
	selectedClasses: FilterOption[];
	selectionChanged: (selected: FilterOption[]) => void;
	archetypes?: any[];
	selectedArchetypes?: string[];
	archetypesChanged?: (archetypes: string[]) => void;
	archetypeMulitSelect?: boolean;
}

export const filterOptionClasses: FilterOption[] = [
	"DRUID",
	"HUNTER",
	"MAGE",
	"PALADIN",
	"PRIEST",
	"ROGUE",
	"SHAMAN",
	"WARLOCK",
	"WARRIOR",
];

export default class ClassFilter extends React.Component<Props> {
	private readonly presets = new Map<FilterPreset, FilterOption[]>([
		["All", ["ALL"].concat(filterOptionClasses) as FilterOption[]],
		[
			"AllNeutral",
			["ALL"]
				.concat(filterOptionClasses)
				.concat(["NEUTRAL"]) as FilterOption[],
		],
		["Neutral", filterOptionClasses.concat(["NEUTRAL"]) as FilterOption[]],
		["ClassesOnly", filterOptionClasses],
	]);

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<{}>,
		snapshot?: any,
	): void {
		if (this.props.archetypes && this.props.archetypes.length) {
			const archetypes = this.props.selectedArchetypes.map(
				selectedArchetype => {
					return this.props.archetypes.find(
						a => a.id === selectedArchetype,
					);
				},
			);

			const newArchetypes = archetypes
				.filter(archetype => {
					return (
						archetype &&
						this.props.selectedClasses.indexOf(
							archetype.playerClass,
						) !== -1
					);
				})
				.map(archetype => archetype.id);
			if (!isEqual(newArchetypes, this.props.selectedArchetypes)) {
				this.props.archetypesChanged(newArchetypes);
			}
		}
	}

	getAvailableFilters(): FilterOption[] {
		const fromPreset = this.presets.get(this.props.filters as FilterPreset);
		return fromPreset || (this.props.filters as FilterOption[]);
	}

	public render(): React.ReactNode {
		const filters = [];
		this.getAvailableFilters().forEach(key => {
			if (this.props.hideAll && key === "ALL") {
				return;
			}
			const selected = this.props.selectedClasses.indexOf(key) !== -1;
			filters.push(this.buildIcon(key, selected));
		});

		let archetypeFilter = null;
		if (this.props.archetypes) {
			archetypeFilter = (
				<DataInjector
					query={{ params: {}, url: "/api/v1/archetypes/" }}
				>
					<ArchetypeFilter
						archetypes={this.props.archetypes}
						playerClasses={this.props.selectedClasses}
						archetypesChanged={this.props.archetypesChanged}
						selectedArchetypes={this.props.selectedArchetypes}
						multiSelect={
							this.props.archetypeMulitSelect === undefined
								? true
								: this.props.archetypeMulitSelect
						}
					/>
				</DataInjector>
			);
		}

		return (
			<div>
				<div className="class-filter-wrapper">{filters}</div>
				{archetypeFilter}
			</div>
		);
	}

	buildIcon(className: FilterOption, selected: boolean): React.ReactNode {
		const isSelected =
			selected ||
			this.props.selectedClasses.indexOf("ALL") !== -1 ||
			!this.props.selectedClasses.length;
		const wrapperClassNames = ["class-icon-label-wrapper"];
		if (this.props.disabled || !isSelected) {
			wrapperClassNames.push("disabled");
		}
		if (!this.props.disabled && selected) {
			wrapperClassNames.push("selected");
		}
		let label = null;
		if (!this.props.minimal) {
			const labelClassNames = ["class-label", "hidden-xs"];
			if (this.props.disabled || !isSelected) {
				labelClassNames.push("deselected");
			} else {
				labelClassNames.push(className.toLowerCase());
			}
			label = (
				<div className={labelClassNames.join(" ")}>
					<PrettyCardClass cardClass={className} />
				</div>
			);
		}

		return (
			<span
				key={className}
				className={wrapperClassNames.join(" ")}
				onClick={event => {
					if (this.props.disabled) {
						return;
					}
					const add = event.ctrlKey || event.metaKey;
					this.onLabelClick(className, selected, add);
					if (event && event.currentTarget) {
						event.currentTarget.blur();
					}
				}}
				onKeyDown={event => {
					if (event.keyCode !== 13 || this.props.disabled) {
						return;
					}
					const add = event.ctrlKey || event.metaKey;
					this.onLabelClick(className, selected, add);
				}}
				tabIndex={
					typeof this.props.tabIndex === "undefined"
						? 0
						: this.props.tabIndex
				}
				role={
					this.props.multiSelect
						? "menuitemcheckbox"
						: "menuitemradio"
				}
				aria-checked={isSelected}
			>
				<ClassIcon cardClass={className} small tooltip />
				{label}
			</span>
		);
	}

	onLabelClick(
		className: FilterOption,
		selected: boolean,
		modifier?: boolean,
	) {
		if (this.props.disabled) {
			return;
		}
		let newSelected = this.props.selectedClasses.slice(0);

		const clickedLastSelected =
			newSelected.length === 1 && newSelected[0] === className;

		if (this.props.multiSelect) {
			if (modifier) {
				if (selected) {
					newSelected = newSelected.filter(x => x !== className);
				} else {
					newSelected.push(className);
				}
			} else {
				if (clickedLastSelected) {
					newSelected = [];
				} else {
					newSelected = [className];
				}
			}
		} else {
			if (
				clickedLastSelected &&
				this.getAvailableFilters().indexOf("ALL") !== -1
			) {
				newSelected = ["ALL"];
			} else {
				newSelected = [className];
			}
		}
		this.props.selectionChanged(newSelected);
	}
}
