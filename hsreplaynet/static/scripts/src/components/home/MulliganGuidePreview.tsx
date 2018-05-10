import React from "react";
import CardTable from "../../components/tables/CardTable";
import DataInjector from "../DataInjector";
import { CardObj } from "../../interfaces";
import CardData from "../../CardData";
import { withLoading } from "../loading/Loading";
import ClassFilter, {FilterOption, filterOptionClasses} from "../ClassFilter";
import {Archetype} from "../../utils/api";
import {getHeroClassName, image} from "../../helpers";

interface MulliganPreviewData {
	deck: any;
	data: any;
	meta_data: any;
}

interface Props {
	archetypeData?: Archetype[];
	cardData?: CardData;
	deckCards?: string;
	data?: MulliganPreviewData;
}

interface State {
	selectedClass: FilterOption;
}

class MulliganGuidePreview extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			selectedClass: filterOptionClasses[0]
		};
	}

	public render(): React.ReactNode {
		const archetype = this.props.archetypeData.find(x => x.id === this.props.data.deck.archetype_id);
		return (
			<div className="mulligan-guide-container">
				<div className="mulligan-guide-header">
					<span className="archetype-name">
						{archetype && archetype.name}
					</span>
					<img className="vs-icon" src={image("vs.png")} />
					<span className="opponent-class">
						{getHeroClassName(this.state.selectedClass)}
					</span>
				</div>
				<ClassFilter
					filters="ClassesOnly"
					selectedClasses={[this.state.selectedClass]}
					selectionChanged={(x: FilterOption[]) => this.setState({selectedClass: x[0]})}
					minimal
				/>
				<DataInjector
					query={[
						{
							key: "winrateData",
							params: { deck_id: this.props.data.deck.deck_id },
							url: "single_deck_base_winrate_by_opponent_class",
						},
					]}
					extract={{
						winrateData: data => {
							return {
								baseWinrate: +data.series.data[
									this.state.selectedClass
								][0].winrate,
							};
						},
					}}
				>
					<CardTable
						data={this.props.data.data[this.state.selectedClass]}
						baseWinrate={this.props.data.meta_data[this.state.selectedClass].base_winrate}
						cards={this.getCards()}
						columns={["mulliganWinrate", "keepPercent"]}
						onSortChanged={() => null}
						sortBy="mulliganWinrate"
						sortDirection="descending"
						numCards={5}
						alternatingBackground={"rgba(255, 255, 255, 0.1)"}
					/>
				</DataInjector>
			</div>
		);
	}

	getCards(): CardObj[] {
		const cards: CardObj[] = [];
		if (this.props.cardData) {
			const dbfIds = this.props.data.data[this.state.selectedClass].map(x => x.dbf_id);
			dbfIds.forEach(dbfId => {
				cards.push({
					card: this.props.cardData.fromDbf(dbfId),
					count: 1,
				});
			});
		}
		return cards;
	}
}

export default withLoading(["archetypeData", "cardData", "data"])(MulliganGuidePreview);
