import React from "react";
import { Archetype, MetaPreview } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import { Region } from "../../interfaces";
import { getArchetypeUrl, toDynamicFixed } from "../../helpers";
import SlotMachine from "./SlotMachine";
import SemanticAge from "../SemanticAge";
import Carousel from "./Carousel";
import _ from "lodash";

interface Props {
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

	private getRegions(): { [region: string]: string } {
		return {
			REGION_US: "Americas",
			REGION_EU: "Europe",
			REGION_KR: "Asia",
			REGION_CN: "China",
		};
	}

	private getRegionList(): string[] {
		const regions = this.getRegions();
		return Object.keys(regions).map(k => regions[k]);
	}

	private getRegionIndex(region: Region): number {
		return Object.keys(this.getRegions()).indexOf(region);
	}

	private getRankList(): string[] {
		const ranks = [];
		ranks.push("Legend");
		for (let i = 1; i <= 25; i++) {
			ranks.push(`Rank ${i}`);
		}
		return ranks;
	}

	private getRankIndex(rank: number): number {
		return rank;
	}

	public renderOutput(data: MetaPreview): React.ReactNode {
		const result = data.data;
		const archetype = this.props.archetypeData.find(
			a => a.id === result.archetype_id,
		);
		const components = archetype.standard_ccp_signature_core.components;

		const cards = components.slice(0, 2).map(dbfId => {
			const card = this.props.cardData.fromDbf(dbfId);
			const style = {
				backgroundImage: `url(${HEARTHSTONE_ART_URL}/512x/${
					card.id
				}.jpg)`,
			};
			return <div className="card-art" key={card.id} style={style} />;
		});

		return (
			<a
				href={getArchetypeUrl(archetype.id, archetype.name)}
				className="archetype-highlight-output"
			>
				<div className="archetype-highlight-output-background">
					<div>
						{cards}
						<div className="fade fade-top" />
						<div className="fade fade-bottom" />
					</div>
				</div>
				<div className="archetype-highlight-output-content">
					<h2>{archetype.name}</h2>
					<p>
						<span>
							Winrate: {toDynamicFixed(result.win_rate, 1)}%
						</span>
						<small>
							Updated <SemanticAge date={data.as_of} />
						</small>
					</p>
				</div>
			</a>
		);
	}

	public render(): React.ReactNode {
		const current = this.props.data[this.state.index];
		const previous =
			this.state.lastIndex !== null
				? this.props.data[this.state.lastIndex]
				: null;

		return (
			<div className="archetype-highlight">
				<div className="archetype-highlight-input">
					<h1>The best deck in</h1>
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
					View Meta Tier List
				</a>
			</div>
		);
	}
}

export default withLoading(["archetypeData", "cardData"])(ArchetypeHighlight);
