import React from "react";
import { VictoryContainer, VictoryPie } from "victory";
import { getHeroColor, pieScaleTransform } from "../../helpers";
import PrettyCardClass from "../text/PrettyCardClass";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { formatNumber } from "../../i18n";

export interface Props extends InjectedTranslateProps {
	data: any[];
	loading?: boolean;
	onPieceClicked?: (name: string) => void;
}

interface State {
	hoveringSlice: any;
}

class ClassDistributionPieChart extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			hoveringSlice: null,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const data =
			this.props.data && this.props.data.length
				? this.props.data
				: [{ x: " ", y: 1, color: "lightgrey" }];
		const gameCount =
			this.props.data && this.props.data.reduce((a, b) => a + b.y, 0);

		let cardClass = null;
		if (gameCount && this.state.hoveringSlice) {
			cardClass = (
				<PrettyCardClass cardClass={this.state.hoveringSlice.xName} />
			);
		} else {
			cardClass = t("Total");
		}

		const numGamesInt = this.state.hoveringSlice
			? +this.state.hoveringSlice.y
			: +gameCount;
		const numGames = t("{games, plural, one {# game} other {# games}}", {
			games: numGamesInt,
		});

		let winrate = null;
		if (!this.props.loading && gameCount) {
			let wr = 0;
			if (this.state.hoveringSlice) {
				wr = this.state.hoveringSlice.winrate;
			} else {
				let count = 0;
				data.forEach(d => {
					wr += d.winrate * d.y;
					count += d.y;
				});
				wr /= count;
			}
			winrate = Math.round(100.0 * wr) + "%";
		}

		const pieSize = 400;
		const padding = { top: 0, bottom: 10, left: 80, right: 80 };

		return (
			<div className="chart-wrapper">
				<VictoryPie
					containerComponent={<VictoryContainer title={""} />}
					data={data}
					style={{
						data: {
							fill: d => d.color || getHeroColor(d.xName),
							strokeWidth: 2,
							transition: "transform .2s ease-in-out",
						},
						labels: { fill: "#FFFFFF", fontSize: 20 },
					}}
					padding={padding}
					padAngle={2}
					innerRadius={10}
					labels={d =>
						this.props.loading || !gameCount
							? null
							: formatNumber(
									Math.round(1000 / gameCount * d.y) / 10,
							  ) + "%"
					}
					events={[
						{
							target: "data",
							eventHandlers: {
								onMouseOver: () => {
									return [
										{
											mutation: props => {
												this.setState({
													hoveringSlice:
														props.slice.data,
												});
												return {
													style: Object.assign(
														{},
														props.style,
														{
															stroke: "white",
															transform: pieScaleTransform(
																props,
																1.05,
															),
														},
													),
												};
											},
										},
									];
								},
								onMouseOut: () => {
									this.setState({ hoveringSlice: null });
									return [
										{
											mutation: props => ({
												style: Object.assign(
													{},
													props.style,
													{
														stroke: null,
														transform: null,
													},
												),
											}),
										},
									];
								},
								onClick: () => {
									if (
										this.props.onPieceClicked &&
										this.state.hoveringSlice
									) {
										this.props.onPieceClicked(
											this.state.hoveringSlice.x.toLowerCase(),
										);
									}
									return [];
								},
							},
						},
					]}
				/>
				<h5 style={{ textAlign: "center", marginTop: "-20px" }}>
					{this.props.loading ? (
						t("Loading…")
					) : (
						<Trans>
							{cardClass}: {numGames} - {winrate} winrate
						</Trans>
					)}
				</h5>
			</div>
		);
	}
}

export default translate()(ClassDistributionPieChart);
