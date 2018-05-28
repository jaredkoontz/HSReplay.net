import { getArchetypeUrl, toDynamicFixed } from "../../helpers";
import React, { Fragment } from "react";
import { Archetype, MetaPreview } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import { Region } from "../../interfaces";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import SlotMachine from "./SlotMachine";
import SemanticAge from "../text/SemanticAge";
import Carousel from "./Carousel";
import _ from "lodash";
import { BnetRegion } from "../../hearthstone";
import PrettyRegion from "../text/PrettyRegion";
import TwoCardFade from "../TwoCardFade";

interface Props extends InjectedTranslateProps {
	archetypeData?: Archetype[];
	data?: MetaPreview[];
	cardData: CardData;
}

interface State {
	index: number;
	lastIndex: number | null;
}

class ArchetypeHighlight extends React.Component<Props, State> {
	private interval: number | null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			index: 0,
			lastIndex: null,
		};
	}

	public componentDidMount() {
		this.startRotation();
	}

	public componentWillUnmount() {
		this.stopRotation();
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			!_.isEqual(this.props.archetypeData, nextProps.archetypeData) ||
			!_.isEqual(this.props.data, nextProps.data) ||
			!_.isEqual(this.props.cardData, nextProps.cardData) ||
			this.state.index !== nextState.index ||
			this.state.lastIndex !== nextState.lastIndex
		);
	}

	private rotate = (callback: () => any) => {
		this.setState(
			state => ({
				index: (state.index + 1) % this.props.data.length,
				lastIndex: state.index,
			}),
			callback,
		);
	};

	private stopRotation = () => {
		if (this.interval !== null) {
			window.clearTimeout(this.interval);
		}
		this.interval = null;
	};

	private startRotation = () => {
		this.stopRotation();
		this.interval = window.setTimeout(
			() => this.rotate(this.startRotation),
			4000,
		);
	};

	private getRegions(): { [region: string]: BnetRegion } {
		return {
			REGION_US: BnetRegion.REGION_US,
			REGION_EU: BnetRegion.REGION_EU,
			REGION_KR: BnetRegion.REGION_KR,
			REGION_CN: BnetRegion.REGION_CN,
		};
	}

	private getRegionList(): React.ReactNode[] {
		const regions = this.getRegions();
		return Object.keys(regions).map((k: string, i: number) => (
			<PrettyRegion region={regions[k]} key={k} />
		));
	}

	private getRegionIndex(region: Region): number {
		return Object.keys(this.getRegions()).indexOf(region);
	}

	private getRankList(): React.ReactNode[] {
		const { t } = this.props;
		const ranks = [];
		ranks.push(<Fragment key="legend">{t("Legend")}</Fragment>);
		for (let i = 1; i <= 25; i++) {
			ranks.push(
				<Fragment key={`rank-${i}`}>
					{t("Rank {rank}", { rank: i })}
				</Fragment>,
			);
		}
		return ranks;
	}

	private getRankIndex(rank: number): number {
		return rank;
	}

	public renderOutput(data: MetaPreview): React.ReactNode {
		const { t } = this.props;
		const result = data.data;
		const archetype = this.props.archetypeData.find(
			a => a.id === result.archetype_id,
		);
		const components = archetype.standard_ccp_signature_core.components;
		return (
			<a
				href={getArchetypeUrl(archetype.id, archetype.name)}
				className="archetype-highlight-output"
			>
				<div className="archetype-highlight-output-background">
					<TwoCardFade
						cardData={this.props.cardData}
						leftCardId={components[0]}
						rightCardId={components[1]}
						topFade
						bottomFade
					/>
				</div>
				<div className="archetype-highlight-output-content">
					<h2>{archetype.name}</h2>
					<p>
						<span>
							{t("Winrate: {winrate}", {
								winrate:
									toDynamicFixed(result.win_rate, 1) + "%",
							})}
						</span>
						<small>
							<Trans>
								Updated <SemanticAge date={data.as_of} />
							</Trans>
						</small>
					</p>
				</div>
			</a>
		);
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const current = this.props.data[this.state.index];
		const previous =
			this.state.lastIndex !== null
				? this.props.data[this.state.lastIndex]
				: null;

		return (
			<div className="archetype-highlight">
				<div className="archetype-highlight-input">
					<h1>{t("The best deck in")}</h1>
					<div className="archetype-highlight-input-query">
						<div>
							<SlotMachine
								slots={this.getRegionList()}
								index={this.getRegionIndex(current.region)}
							/>
						</div>
						<div>
							<SlotMachine
								slots={this.getRankList()}
								index={this.getRankIndex(current.rank)}
							/>
						</div>
					</div>
				</div>
				<Carousel
					from={previous ? this.renderOutput(previous) : null}
					to={this.renderOutput(current)}
					onHoverStart={this.stopRotation}
					onHoverEnd={this.startRotation}
				/>
				<a className="btn promo-button blue-style" href="/meta/">
					{t("View Meta Tier List")}
				</a>
			</div>
		);
	}
}

export default withLoading(["archetypeData", "cardData"])(
	translate()(ArchetypeHighlight),
);
