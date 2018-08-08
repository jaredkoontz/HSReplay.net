import React from "react";
import CardData from "../../CardData";
import { CardData as Card } from "hearthstonejson-client";

const { Provider, Consumer } = React.createContext({});

export type CardFilterFunction = <T extends keyof Card>(
	card: Card,
	value: Card[T],
) => boolean;

interface Props {
	cardData: CardData;
	onFilter: (dbfIds: number[]) => void;
}

interface State {
	filteredCards: number[] | null;
}

export interface FilterProps {
	dbfIds: number[];
}

export default class CardFilterManager extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		let filteredCards = null;
		if (props.cardData) {
			filteredCards = props.cardData
				.collectible()
				.map(card => card.dbfId);
		}
		this.state = { filteredCards };
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		snapshot?: any,
	): void {
		if (
			prevState.filteredCards !== this.state.filteredCards &&
			this.state.filteredCards !== null
		) {
			this.props.onFilter(this.state.filteredCards);
		}
	}

	public static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		if (prevState.filteredCards === null && nextProps.cardData) {
			return {
				filteredCards: nextProps.cardData
					.collectible()
					.map(card => card.dbfId),
			};
		}
		return null;
	}

	public render(): React.ReactNode {
		return <Provider value={{}}>{this.props.children}</Provider>;
	}
}
