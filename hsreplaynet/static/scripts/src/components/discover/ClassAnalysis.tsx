import React from "react";
import { AutoSizer } from "react-virtualized";
import CardData from "../../CardData";
import TourManager from "../../TourManager";
import ClusterChart from "../d3/ClusterChart";
import Tab from "../layout/Tab";
import TabList from "../layout/TabList";
import { withLoading } from "../loading/Loading";
import PrettyCardClass from "../text/PrettyCardClass";
import ClusterDetail from "./ClusterDetail";
import ClusterTabLabel from "./ClusterTabLabel";
import DeckInfo from "./DeckInfo";

export interface ClusterData {
	cluster_map: { [clusterId: number]: number };
	cluster_names: { [clusterId: number]: string };
	data: DeckData[];
	player_class: string;
	signatures: { [id: number]: Array<[number, number]> };
	ccp_signatures: { [id: number]: Array<[number, number]> };
}

export interface DeckData {
	metadata: ClusterMetaData;
	x: number;
	y: number;
}

export interface ClusterMetaData {
	cluster_id: number;
	cluster_name: string;
	deck_list: string;
	games: number;
	shortid: string;
}

interface State {
	selectedDeck: ClusterMetaData;
}

interface Props {
	cardData: CardData | null;
	data?: ClusterData;
	format: string;
	includedCards: number[];
	includedSet: string;
	excludedCards: number[];
	maxGames?: number;
	onSelectedDeckChanged?: (data: ClusterMetaData) => void;
	playerClass: string;
	clusterTab: string;
	setClusterTab: (clusterTab: string) => void;
	canModifyArchetype: boolean;
}

const COLORS = [
	"#3366CC",
	"#DC3912",
	"#FF9900",
	"#109618",
	"#990099",
	"#00BBC6",
	"#FD4477",
	"#85AA00",
	"#3123D5",
	"#994499",
	"#AAAA11",
	"#6633CC",
	"#E67300",
	"#8B0707",
	"#A29262",
	"#BAB4B6",
];

class ClassAnalysis extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			selectedDeck: null,
		};
	}

	public componentDidMount(): void {
		this.showTour(false);
	}

	showTour(force: boolean) {
		new TourManager().createTour(
			"discover-introduction",
			[
				{
					id: "introduction",
					text: [
						"On this page you can find the deck clusters that were automatically detected by our archetype algorithm.",
						"Each dot represents a deck and the distance between decks is proportional to their similarity.",
					],
					title: "Discover Introduction",
				},
				{
					id: "interaction",
					text: [
						"<b>Hover</b> any deck to see the full list of cards on the right.",
						"",
						`
							<b>Click</b> any deck to focus it.
							Focusing a deck will cause the cursor to return to it when no other deck is hovered.
							This allows for easier comparison of two distant decks and interaction with the deck list on the right.
						`,
						"Click the same deck again to defocus it.",
					],
					title: "Interaction",
				},
			],
			null,
			force,
		);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (nextProps.playerClass !== this.props.playerClass) {
			this.setState({ selectedDeck: null });
			this.props.setClusterTab("decks");
		}
	}

	public render(): React.ReactNode {
		const { data, maxGames, playerClass } = this.props;
		const { selectedDeck } = this.state;
		const clusterIds = Object.keys(data.cluster_map).sort();
		const chartHeight = "calc(100vh - 125px)";
		return (
			<TabList
				setTab={this.props.setClusterTab}
				tab={this.props.clusterTab}
			>
				<Tab id="decks" label={this.renderChartTabLabel()} highlight>
					<div className="class-tab-content">
						<div
							className="cluster-chart-container"
							style={{ height: chartHeight }}
						>
							<span
								className="btn btn-primary btn-help"
								onClick={() => this.showTour(true)}
							>
								Info
							</span>
							<AutoSizer>
								{({ height, width }) => {
									return (
										<ClusterChart
											colors={this.getColors()}
											height={height}
											width={width}
											data={data.data}
											clusterIds={clusterIds}
											maxGames={maxGames}
											playerClass={playerClass}
											onPointClicked={deck => {
												this.setState({
													selectedDeck: deck,
												});
												if (
													this.props
														.onSelectedDeckChanged
												) {
													this.props.onSelectedDeckChanged(
														deck,
													);
												}
											}}
											includedCards={
												this.props.includedCards
											}
											includedSet={this.props.includedSet}
											excludedCards={
												this.props.excludedCards
											}
											cardData={this.props.cardData}
										/>
									);
								}}
							</AutoSizer>
						</div>
						<DeckInfo
							cardData={this.props.cardData}
							clusterColor={
								selectedDeck &&
								this.getClusterColor(
									"" + selectedDeck.cluster_id,
									clusterIds,
								)
							}
							deck={selectedDeck}
							format={this.props.format}
							height={chartHeight}
							playerClass={this.props.playerClass}
						/>
					</div>
				</Tab>
				{this.renderSignatureTabs()}
			</TabList>
		);
	}

	renderChartTabLabel(): React.ReactNode {
		const { playerClass } = this.props;
		return (
			<span className={"player-class " + playerClass.toLowerCase()}>
				<PrettyCardClass cardClass={playerClass} /> Decks
			</span>
		);
	}

	renderSignatureTabs(): React.ReactNode[] {
		const { canModifyArchetype, data, format, playerClass } = this.props;
		const clusterIds = Object.keys(data.cluster_map).sort();
		return clusterIds.map(clusterId => {
			const color = this.getClusterColor(clusterId, clusterIds);
			return (
				<Tab
					key={clusterId}
					id={this.clusterTabId(clusterId)}
					label={
						<ClusterTabLabel
							active={
								this.clusterTabId(clusterId) ===
								this.props.clusterTab
							}
							clusterId={clusterId}
							clusterName={data.cluster_names[clusterId]}
							color={color}
							format={format}
							playerClass={playerClass}
							canModifyArchetype={canModifyArchetype}
						/>
					}
				>
					<ClusterDetail
						cardData={this.props.cardData}
						clusterId={clusterId}
						data={data}
						key={clusterId}
					/>
				</Tab>
			);
		});
	}

	clusterTabId(clusterId: string): string {
		return clusterId;
	}

	getClusterColor(clusterId: string, clusterIds: string[]): string {
		return this.getColors()[clusterIds.indexOf(clusterId)];
	}

	getColors(): string[] {
		const colors = COLORS.slice();
		if (this.props.data.data.some(x => x.metadata.cluster_id === -1)) {
			colors.unshift("#666666");
		}
		return colors;
	}
}

export default withLoading()(ClassAnalysis);
