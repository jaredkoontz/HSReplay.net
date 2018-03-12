import React from "react";
import DataInjector from "../DataInjector";
import ClusterArchetypeSelector from "./ClusterArchetypeSelector";
import UserData from "../../UserData";
import { Archetype } from "../../utils/api";

interface Props {
	active?: boolean;
	clusterId: string;
	clusterName: string;
	color: string;
	format: string;
	playerClass: string;
	canModifyArchetype: boolean;
}

const EXPERIMENTAL_CLUSTER_ID = "-1";

export default class ClusterTabLabel extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			active,
			canModifyArchetype,
			clusterId,
			clusterName,
			color,
			format,
			playerClass,
		} = this.props;
		let selector = null;
		const hasFeature = UserData.hasFeature("archetype-training");
		if (
			hasFeature &&
			clusterId !== EXPERIMENTAL_CLUSTER_ID &&
			active &&
			canModifyArchetype
		) {
			selector = (
				<DataInjector
					query={[
						{
							key: "archetypeData",
							url: "/api/v1/archetypes/",
							params: {},
						},
					]}
					extract={{
						archetypeData: (data: Archetype[]) => {
							const archetypes = data.filter(
								a => a.player_class_name === playerClass,
							);
							return { archetypes };
						},
					}}
				>
					<ClusterArchetypeSelector
						clusterId={clusterId}
						format={format}
						playerClass={playerClass}
					/>
				</DataInjector>
			);
		}
		return (
			<span>
				<span
					className="signature-label"
					style={{ backgroundColor: color }}
				/>
				{clusterName}
				{selector}
			</span>
		);
	}
}
