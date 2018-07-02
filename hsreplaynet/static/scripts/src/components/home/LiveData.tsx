import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../../CardData";
import DataManager from "../../DataManager";
import { image } from "../../helpers";
import CardTile from "../CardTile";
import AnimatedList, { AnimatedListObject } from "./AnimatedList";

interface GameTypeData<T> {
	BGT_ARENA: T;
	BGT_RANKED_STANDARD: T;
	BGT_RANKED_WILD: T;
}

interface ApiPlayedCards {
	ts: number;
	data: CardCount;
}

interface PlayedCards {
	[ts: number]: CardCount;
}

interface CardCount {
	[dbfId: string]: number;
}

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	numCards: number;
}

interface State {
	cursor: number;
	data: GameTypeData<PlayedCards>;
	doUpdate: boolean;
	fetching: boolean;
	renderedGameTypes: string[];
}

type GameType = "BGT_ARENA" | "BGT_RANKED_STANDARD" | "BGT_RANKED_WILD";

const entranceAnimationOrder: GameType[] = [
	"BGT_RANKED_STANDARD",
	"BGT_RANKED_WILD",
	"BGT_ARENA",
];

class LiveData extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			cursor: 0,
			data: null,
			doUpdate: true,
			fetching: false,
			renderedGameTypes: [entranceAnimationOrder[0]],
		};
	}

	fetchData() {
		this.setState({ fetching: true });
		DataManager.get(
			"/api/v1/live/distributions/played_cards",
			{},
			true,
		).then((response: GameTypeData<ApiPlayedCards[]>) => {
			if (
				_.isEmpty(response) ||
				Object.keys(response).some(key => _.isEmpty(response[key]))
			) {
				this.setState({ doUpdate: false, fetching: false });
				return;
			}

			const data = Object.assign({}, this.state.data);
			Object.keys(response).forEach(key => {
				if (!data[key]) {
					data[key] = {};
				} else {
					// delete any timestamps we passed
					Object.keys(data[key]).forEach(ts => {
						if (+ts < this.state.cursor) {
							delete data[key][ts];
						}
					});
				}
				response[key].forEach((playedCards: ApiPlayedCards) => {
					data[key][playedCards.ts] = playedCards.data;
				});
			});

			this.setState({ data, fetching: false });
		});
	}

	updateCursor() {
		const { cursor, data, doUpdate, fetching } = this.state;
		if (!doUpdate) {
			return;
		}
		if (data) {
			const timestamps = Object.keys(data.BGT_RANKED_STANDARD)
				.map(Number)
				.filter(ts => ts > cursor);
			if (timestamps.length > 0) {
				this.setState({ cursor: Math.min(...timestamps) });
			}
			if (timestamps.length <= 3 && !fetching) {
				this.fetchData();
			}
			setTimeout(() => this.updateCursor(), 5000);
		} else {
			// check twice per second while there's no data yet
			setTimeout(() => this.updateCursor(), 500);
		}
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			this.props.cardData !== nextProps.cardData ||
			this.state.cursor !== nextState.cursor ||
			this.state.doUpdate !== nextState.doUpdate ||
			this.state.renderedGameTypes !== nextState.renderedGameTypes
		);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		const renderedGameTypes = this.state.renderedGameTypes.slice();
		if (
			this.state.data &&
			renderedGameTypes.length < entranceAnimationOrder.length
		) {
			renderedGameTypes.push(
				entranceAnimationOrder[renderedGameTypes.length],
			);
			setTimeout(() => this.setState({ renderedGameTypes }), 100);
		}
	}

	public componentDidMount(): void {
		this.fetchData();
		this.updateCursor();
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		if (!this.state.doUpdate) {
			return null;
		}
		return (
			<div className="container">
				<header>
					<h3>
						<Trans>
							<strong>Cards played</strong> by game mode over the
							last <strong>5 minutes</strong>:
						</Trans>
					</h3>
				</header>
				<div className="row">
					{this.renderCardList(
						"BGT_RANKED_STANDARD",
						"standard",
						t("Ranked Standard"),
					)}
					{this.renderCardList(
						"BGT_RANKED_WILD",
						"wild",
						t("Ranked Wild"),
					)}
					{this.renderCardList("BGT_ARENA", "arena", t("Arena"))}
				</div>
			</div>
		);
	}

	renderCardList(
		gameType: GameType,
		icon: string,
		title: string,
	): React.ReactNode {
		return (
			<div className="col-sm-12 col-md-4">
				<h4>
					<strong>
						<img
							className="mode-icon"
							src={image(`${icon}_icon.svg`)}
						/>
						&nbsp;{title}
					</strong>
				</h4>
				<AnimatedList
					rowHeight={34}
					items={this.getListItems(gameType)}
				/>
			</div>
		);
	}

	getListItems(gameType: GameType): AnimatedListObject[] {
		const items = [];
		const { cursor, data, renderedGameTypes } = this.state;
		const { cardData, numCards } = this.props;
		if (cardData && data && renderedGameTypes.indexOf(gameType) !== -1) {
			const cards = data[gameType][cursor];
			if (cards) {
				const dataList = Object.keys(cards).map(dbfId => ({
					dbfId,
					games: cards[dbfId],
				}));
				dataList.sort((a, b) => b.games - a.games);
				dataList.slice(0, numCards).forEach(({ dbfId, games }) => {
					const card = cardData.fromDbf(dbfId);
					items.push({
						item: (
							<CardTile
								card={card}
								height={34}
								count={games}
								countBoxSize={40}
							/>
						),
						key: "" + dbfId,
					});
				});
				return items;
			}
		}
		return Array.apply(null, { length: numCards }).map(
			(x: any, index: number) => ({ item: <div />, key: "ph_" + index }),
		);
	}
}
export default translate()(LiveData);
