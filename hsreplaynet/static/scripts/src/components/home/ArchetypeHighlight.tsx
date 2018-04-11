import * as React from "react";
import { Archetype, MetaPreview } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import { Region } from "../../interfaces";
import { toDynamicFixed } from "../../helpers";
import SlotMachine from "./SlotMachine";
import SemanticAge from "../SemanticAge";
import Carousel from "./Carousel";

interface State {
	index: number;
	lastIndex: number | null;
}

interface Props {
	archetypeData?: Archetype[];
	data?: MetaPreview[];
	cardData: CardData;
}

class ArchetypeHighlight extends React.Component<Props, State> {
	private interval: number | null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			index: 0,
			lastIndex: null,
		};
	}

	componentDidMount() {
		this.interval = window.setInterval(() => {
			this.setState(state => ({
				index: (state.index + 1) % this.props.data.length,
				lastIndex: state.index,
			}));
		}, 4000);
	}

	componentWillUnmount() {
		if (this.interval !== null) {
			window.clearInterval(this.interval);
		}
		this.interval = null;
	}

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
				backgroundImage: `url(https://art.hearthstonejson.com/v1/512x/${
					card.id
				}.jpg)`,
			};
			return <div className="card-art" key={card.id} style={style} />;
		});

		return (
			<div className="archetype-highlight-output">
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
			</div>
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
				/>
				<a className="btn promo-button blue-style" href="/meta/">
					View Meta Tier List
				</a>
			</div>
		);
	}
}

export default withLoading(["archetypeData", "cardData"])(ArchetypeHighlight);
