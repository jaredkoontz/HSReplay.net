import React from "react";
import CardData from "../CardData";
import ClassArenaChart from "../components/charts/ClassAreaChart";
import WinrateLineChart from "../components/charts/WinrateLineChart";
import DataInjector from "../components/DataInjector";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import ChartLoading from "../components/loading/ChartLoading";
import TableLoading from "../components/loading/TableLoading";
import BiggestHits from "../components/myhighlights/BiggestHits";
import HighlightTiles from "../components/myhighlights/HighlightTiles";
import { RenderData } from "../interfaces";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";

interface Props {
	cardData: CardData;
}

export default class MyHighlights extends React.Component<Props> {
	getCard(dbfId: number): any {
		return this.props.cardData.fromDbf(dbfId || 1720);
	}

	public render(): React.ReactNode {
		return (
			<div id="my-highlights">
				<aside className="infobox">
					<h1>My Highlights</h1>
					<InfoboxFilterGroup
						header="Time frame"
						selectedValue={"ALL"}
						onClick={undefined}
					>
						<InfoboxFilter disabled value="ALL">
							All time
						</InfoboxFilter>
						<InfoboxFilter disabled value="CURRENT_SEASON">
							Current season
						</InfoboxFilter>
						<InfoboxFilter disabled value="PREVIOUS_SEASON">
							Previous season
						</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>Data</h2>
					<ul>
						<InfoboxLastUpdated
							url={
								"single_account_lo_lifetime_class_performance_over_time"
							}
							params={{}}
						/>
					</ul>
				</aside>
				<main>
					<section id="content-header">
						<div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
							<div id="winrate-chart-wrapper">
								<DataInjector
									query={{
										url:
											"single_account_lo_lifetime_class_performance_over_time",
										params: {}
									}}
								>
									<ChartLoading
										noDataCondition={data =>
											data.series[0].data.length < 1
										}
									>
										<ClassArenaChart widthRatio={2} />
									</ChartLoading>
								</DataInjector>
							</div>
						</div>
						<div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
							<div id="winrate-chart-wrapper">
								<DataInjector
									query={{
										url:
											"single_account_lo_lifetime_class_performance_over_time",
										params: {}
									}}
									modify={data =>
										this.buildWinrateChartData(data)
									}
								>
									<ChartLoading>
										<WinrateLineChart
											widthRatio={2}
											title="Winrate - by week"
										/>
									</ChartLoading>
								</DataInjector>
							</div>
						</div>
					</section>
					<section id="page-content">
						<ul className="nav nav-tabs content-tabs">
							<li className="active">
								<a data-toggle="tab" href="#highlights">
									Highlights
								</a>
							</li>
							<li>
								<a data-toggle="tab" href="#biggesthits">
									Biggest hits
								</a>
							</li>
						</ul>
						<div className="tab-content">
							<div
								id="highlights"
								className="tab-pane fade in active"
							>
								<DataInjector
									query={[
										{
											key: "cardStats",
											url:
												"single_account_lo_individual_card_stats",
											params: {}
										},
										{
											key: "ranks",
											url:
												"single_account_lo_best_rank_by_season",
											params: {}
										}
									]}
								>
									<TableLoading
										cardData={this.props.cardData}
										dataKeys={["cardStats", "ranks"]}
									>
										<HighlightTiles />
									</TableLoading>
								</DataInjector>
							</div>
							<div id="biggesthits" className="tab-pane fade">
								<DataInjector
									query={{
										url: "single_account_lo_biggest_hits",
										params: {}
									}}
								>
									<TableLoading
										cardData={this.props.cardData}
									>
										<BiggestHits />
									</TableLoading>
								</DataInjector>
							</div>
						</div>
					</section>
				</main>
			</div>
		);
	}

	buildWinrateChartData(renderData: RenderData): RenderData {
		const data = {};
		const counts = {};
		renderData.series.forEach(series => {
			series.data.forEach(point => {
				data[point.game_date] =
					(data[point.game_date] || 0) +
					+point.win_rate * +point.num_games;
				counts[point.game_date] =
					(counts[point.game_date] || 0) + +point.num_games;
			});
		});
		Object.keys(counts).forEach(key => (data[key] /= counts[key]));
		return {
			series: [
				{
					data: Object.keys(data).map(key => {
						return { x: key, y: data[key] };
					}),
					name: "winrate_over_time"
				}
			]
		};
	}
}
