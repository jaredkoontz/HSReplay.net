import React from "react";
import CardData from "../../CardData";
import CardTable from "../../components/tables/CardTable";
import { getHeroSkinCardId, image } from "../../helpers";
import { Archetype } from "../../utils/api";
import ClassFilter, { FilterOption, filterOptionClasses } from "../ClassFilter";
import DataInjector from "../DataInjector";
import TwoCardFade from "../TwoCardFade";
import PrettyCardClass from "../text/PrettyCardClass";
import { CardObj } from "../../interfaces";
import { withLoading } from "../loading/Loading";

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
	selectedClass: number;
}

class MulliganGuidePreview extends React.Component<Props, State> {
	private interval: number | null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			selectedClass: 0,
		};
	}

	public componentDidMount() {
		this.startIterate();
	}

	public componentWillUnmount() {
		this.stopIterate();
	}

	private iterate = (callback: () => void) => {
		this.setState(
			state => ({
				selectedClass:
					state.selectedClass >= filterOptionClasses.length - 1
						? 0
						: state.selectedClass + 1,
			}),
			callback,
		);
	};

	private stopIterate = () => {
		if (this.interval !== null) {
			window.clearTimeout(this.interval);
		}
		this.interval = null;
	};

	private startIterate = () => {
		this.stopIterate();
		this.interval = window.setTimeout(
			() => this.iterate(this.startIterate),
			3000,
		);
	};

	public render(): React.ReactNode {
		if (!this.props.data.deck) {
			return null;
		}
		const archetype = this.props.archetypeData.find(
			x => x.id === this.props.data.deck.archetype_id,
		);
		if (!archetype) {
			return null;
		}
		return (
			<div
				className="mulligan-guide-container"
				onMouseOver={this.stopIterate}
				onMouseOut={this.startIterate}
			>
				<div className="mulligan-guide-header">
					<div className="mulligan-guide-header-background">
						<TwoCardFade
							cardData={this.props.cardData}
							leftCardId={getHeroSkinCardId(
								archetype.player_class_name,
							)}
							rightCardId={getHeroSkinCardId(
								filterOptionClasses[this.state.selectedClass],
							)}
							rightFlipped
						/>
					</div>
					<div className="mulligan-guide-header-content">
						<span className="archetype-name">
							{archetype && archetype.name}
						</span>
						<img className="vs-icon" src={image("vs.png")} />
						<span className="opponent-class">
							<PrettyCardClass
								cardClass={
									filterOptionClasses[
										this.state.selectedClass
									]
								}
							/>
						</span>
					</div>
				</div>
				<ClassFilter
					filters="ClassesOnly"
					selectedClasses={[
						filterOptionClasses[this.state.selectedClass],
					]}
					selectionChanged={(x: FilterOption[]) =>
						this.setState({
							selectedClass: filterOptionClasses.findIndex(
								f => f === x[0],
							),
						})
					}
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
									filterOptionClasses[
										this.state.selectedClass
									]
								][0].winrate,
							};
						},
					}}
				>
					<CardTable
						data={
							this.props.data.data[
								filterOptionClasses[this.state.selectedClass]
							]
						}
						baseWinrate={
							this.props.data.meta_data[
								filterOptionClasses[this.state.selectedClass]
							].base_winrate
						}
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
			const dbfIds = this.props.data.data[
				filterOptionClasses[this.state.selectedClass]
			].map(x => x.dbf_id);
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

export default withLoading(["archetypeData", "cardData", "data"])(
	MulliganGuidePreview,
);
