import * as React from "react";
import { Archetype } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import { Region } from "../../interfaces";
import { toDynamicFixed } from "../../helpers";
import SlotMachine from "./SlotMachine";

interface ArchetypeHighlightData {
	id: number;
	rank: number;
	region: Region;
	winrate: number;
}

interface State {
	index: number;
}

interface Props {
	archetypeData?: Archetype[];
	data?: ArchetypeHighlightData[];
	cardData: CardData;
}

class ArchetypeHighlight extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			index: 0,
		};
	}

	componentDidMount() {
		this.update();
	}

	update() {
		setTimeout(() => {
			const { index } = this.state;
			const nextIndex =
				index >= this.props.data.length - 1 ? 0 : index + 1;
			this.setState({ index: nextIndex });
			this.update();
		}, 5000);
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

	private getRegionName(region: Region): string {
		switch (region) {
			case "REGION_US":
				return "Americas";
			case "REGION_EU":
				return "Europe";
			case "REGION_KR":
				return "Asia";
			case "REGION_CN":
				return "China";
		}
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

	render(): React.ReactNode {
		const data = this.props.data[this.state.index];
		const archetype = this.props.archetypeData.find(a => a.id === data.id);
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
			<div id="archetype-highlight">
				<div className="archetype-highlight-background">
					<div className="card-panel">
						{cards}
						<div className="fade fade-top" />
						<div className="fade fade-bottom" />
					</div>
				</div>
				<div className="archetype-highlight-content">
					<div className="best-deck-title">
						<h1>The best deck in</h1>
						<div className="deck-data text-center">
							<span>
								<SlotMachine
									slots={this.getRegionList()}
									index={this.getRegionIndex(data.region)}
								/>
							</span>
							<span>
								<SlotMachine
									slots={this.getRankList()}
									index={this.getRankIndex(data.rank)}
								/>
							</span>
						</div>
					</div>
					<div className="archetype-data">
						<h1>{archetype.name}</h1>
						<h2>Winrate {toDynamicFixed(data.winrate, 1)}%</h2>
					</div>
					<a className="btn promo-button blue-style" href="/meta/">
						View Meta Tier List
					</a>
				</div>
			</div>
		);
	}
}

export default withLoading(["archetypeData", "cardData"])(ArchetypeHighlight);
