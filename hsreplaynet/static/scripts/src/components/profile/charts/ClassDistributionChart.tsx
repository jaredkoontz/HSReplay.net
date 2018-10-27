import React from "react";
import { getHeroClassName, getHeroColor } from "../../../helpers";
import { ResponsivePie } from "@nivo/pie";
import { InjectedTranslateProps, translate } from "react-i18next";
import { formatNumber } from "../../../i18n";

interface Props extends InjectedTranslateProps {
	data: any[];
}

class ClassDistributionChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const totalGames = this.props.data.reduce(
			(sum, datum) => sum + datum.games,
			0,
		);
		const data = this.props.data.map(datum => ({
			id: datum.cardClass,
			value: datum.games,
			percent: formatNumber(100 * datum.games / totalGames) + "%",
		}));
		return (
			<div className={"class-distribution-pie"}>
				<ResponsivePie
					data={data}
					margin={{
						top: 25,
						right: 5,
						bottom: 25,
						left: 5,
					}}
					innerRadius={0.4}
					padAngle={1}
					cornerRadius={2}
					colors="nivo"
					colorBy={d => getHeroColor(d.id)}
					borderWidth={1}
					borderColor="inherit:darker(0.5)"
					enableRadialLabels={false}
					slicesLabelsTextColor="#000"
					animate
					motionStiffness={90}
					motionDamping={15}
					defs={[]}
					fill={[]}
					legends={[]}
					sortByValue
					sliceLabel={d => d.percent as any}
					slicesLabelsSkipAngle={15}
					tooltip={d => {
						const cardClass = d.id as string;
						return (
							<div className="pie-tooltip">
								<span
									className={`player-class ${cardClass.toLowerCase()}`}
								>
									{getHeroClassName(cardClass, t)}
								</span>
								<div>
									<strong>{t("Games: ")}</strong>
									<span>
										{d.value} ({d.percent})
									</span>
								</div>
							</div>
						);
					}}
				/>
			</div>
		);
	}
}

export default translate()(ClassDistributionChart);
