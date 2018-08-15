import React from "react";
import CardData from "../../CardData";
import { CardData as Card } from "hearthstonejson-client";
import memoize from "memoize-one";

const { Provider, Consumer } = React.createContext<CardFilterProps>({
	cardData: null,
	dbfIds: [],
	addFilter: x => console.error("called addFilter out of context"),
	removeFilter: x => console.error("called removeFilter out of context"),
	filters: [],
});
export { Provider as CardFilterProvider, Consumer as CardFilterConsumer };

export type CardFilterFunction = <T extends keyof Card>(card: Card) => boolean;

export interface CardFilterProps {
	cardData: CardData | null;
	dbfIds: number[];
	addFilter: (filter: CardFilterFunction) => void;
	removeFilter: (filter: CardFilterFunction) => void;
	filters: CardFilterFunction[];
}

interface Props {
	cardData: CardData | null;
	onFilter: (dbfIds: number[]) => void;
}

interface State {
	filters: CardFilterFunction[];
}

export default class CardFilterManager extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			filters: [],
		};
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		snapshot?: any,
	): void {
		if (
			prevState.filters !== this.state.filters ||
			prevProps.cardData !== this.props.cardData
		) {
			this.props.onFilter(
				this.filter(this.props.cardData, this.state.filters),
			);
		}
	}

	public render(): React.ReactNode {
		return (
			<Provider
				value={{
					dbfIds: this.filter(
						this.props.cardData,
						this.state.filters,
					),
					cardData: this.props.cardData,
					filters: this.state.filters,
					addFilter: this.addFilter,
					removeFilter: this.removeFilter,
				}}
			>
				{this.props.children}
			</Provider>
		);
	}

	private addFilter = (filter: CardFilterFunction) => {
		this.setState(state => {
			const filters = state.filters.concat(filter);
			return {
				filters,
			};
		});
	};

	private removeFilter = (filter: CardFilterFunction) => {
		this.setState(state => {
			const filters = state.filters.filter(
				toRemove => filter !== toRemove,
			);
			return {
				filters,
			};
		});
	};

	private getInitialCards = memoize((cardData: CardData): Card[] => {
		return cardData.collectible();
	});

	private filter = (
		cardData: CardData | null,
		filters: CardFilterFunction[],
	): number[] | null => {
		if (!this.props.cardData) {
			return null;
		}
		let cards = this.getInitialCards(cardData);
		for (const filter of filters) {
			cards = cards.filter(filter);
		}
		return cards.map(card => card.dbfId);
	};
}
