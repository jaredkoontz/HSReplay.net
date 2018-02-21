import React from "react";
import {
	getHeroColor,
	hexToHsl,
	stringifyHsl,
	toTitleCase
} from "../../helpers";
import { VictoryLabel, VictoryLegend, VictoryPie } from "victory";
import { ApiArchetype } from "../../interfaces";

interface ArchetypeDistributionPieChartProps {
	matchupData?: any;
	archetypeData?: any;
	selectedArchetypeId?: number;
	playerClass: string;
}

interface ArchetypeDistributionPieChartState {
	hovering?: number;
}

const pageBackground: string = "#fbf7f6";

export default class ArchetypeDistributionPieChart extends React.Component<
	ArchetypeDistributionPieChartProps,
	ArchetypeDistributionPieChartState
> {
	private readonly pieSize = 400;
	private readonly piePadding = { top: 10, bottom: 10, left: 80, right: 80 };

	constructor(
		props: ArchetypeDistributionPieChartProps,
		state: ArchetypeDistributionPieChartState
	) {
		super(props, state);
		this.state = {
			hovering: null
		};
	}

	private getArchetype(archetypeId: string): ApiArchetype {
		return this.props.archetypeData.find(a => a.id === archetypeId);
	}

	private getArchetypeName(archetype: ApiArchetype): string {
		return archetype
			? archetype.name
			: `Other ${toTitleCase(this.props.playerClass)}`;
	}

	private getChartData(): any {
		const archetypes = this.props.matchupData.series.data[
			this.props.playerClass
		];
		const radius = this.pieSize / 2;
		const data = archetypes
			.map(matchup => {
				const id = matchup.archetype_id;
				const archetype = this.getArchetype(id);
				const selected = id === this.props.selectedArchetypeId;
				const scale = selected
					? 1.1
					: this.state.hovering === id ? 1.05 : 1.0;
				return {
					archetypeId: id,
					isSelectedArchetype: id === this.props.selectedArchetypeId,
					stroke: pageBackground,
					strokeWidth: selected ? 2 : 0,
					transform: `translate(${radius}px, ${radius}px) scale(${scale})`,
					url: archetype && archetype.url,
					x: archetype ? this.getArchetypeName(archetype) : "Other",
					y: matchup.pct_of_class
				};
			})
			.filter(x => x !== undefined);
		data.sort((a, b) => b.y - a.y);

		const baseColorHex = getHeroColor(this.props.playerClass);
		const baseHsl = hexToHsl(baseColorHex);

		// spread colors across lightness, weighted towards center with fewer items
		const margin = 10 + Math.max(0, 10 - data.length) * 3;
		const stride = (100 - 2 * margin) / (data.length - 1);

		const coloredData = data.map((p, index) => {
			return Object.assign(p, {
				fill: stringifyHsl(
					baseHsl[0],
					baseHsl[1],
					Math.floor(margin + index * stride)
				)
			});
		});
		return coloredData;
	}

	public render(): React.ReactNode {
		const data = this.getChartData();
		const legendData = data.map(p => {
			const hovering = p.archetypeId === this.state.hovering;
			return {
				archetypeId: p.archetypeId,
				fontWeight: hovering ? "bold" : "normal",
				isSelectedArchetype: p.isSelectedArchetype,
				name: p.x + (hovering ? ` ${p.y}% ` : ""),
				symbol: { style: "circle", fill: p.fill },
				url: p.url
			};
		});

		const cursor = p =>
			p.isSelectedArchetype || !p.url ? "inherit" : "pointer";

		return (
			<svg viewBox="0 0 400 600">
				<VictoryPie
					standalone={false}
					labels={d => {
						if (d.y >= 5 || d.isSelectedArchetype) {
							return d.y.toFixed(1) + "%";
						}
					}}
					height={this.pieSize}
					width={this.pieSize}
					padding={this.piePadding}
					data={data}
					style={{
						data: {
							cursor,
							transition: "transform .2s ease-in-out"
						},
						labels: {
							cursor
						}
					}}
					events={this.mouseEvents()}
				/>
				<VictoryLegend
					standalone={false}
					data={legendData}
					rowGutter={-7}
					x={72}
					y={358}
					style={{
						data: {
							cursor
						},
						labels: {
							cursor,
							fontWeight: d => d.fontWeight
						}
					}}
					events={this.mouseEvents()}
				/>
				<VictoryLabel
					textAnchor="middle"
					verticalAnchor="middle"
					x={200}
					y={20}
					text={`${toTitleCase(this.props.playerClass)} Archetypes`}
					style={{ fontSize: 20 }}
				/>
			</svg>
		);
	}

	mouseEvents(): any[] {
		const eventHandlers = {
			onClick: () => {
				return [
					{
						mutation: props => {
							if (
								!props.datum.isSelectedArchetype &&
								props.datum.archetypeId !== -1
							) {
								window.open(props.datum.url, "_self");
							}
						}
					}
				];
			},
			onMouseOut: () => {
				return [
					{
						mutation: props => {
							if (
								this.state.hovering === props.datum.archetypeId
							) {
								this.setState({ hovering: null });
							}
						}
					}
				];
			},
			onMouseOver: () => {
				return [
					{
						mutation: props => {
							this.setState({
								hovering: props.datum.archetypeId
							});
						}
					}
				];
			}
		};
		return [
			{ eventHandlers, target: "data" },
			{ eventHandlers, target: "labels" }
		];
	}
}
