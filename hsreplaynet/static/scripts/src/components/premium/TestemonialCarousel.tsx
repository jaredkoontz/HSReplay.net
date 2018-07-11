import React from "react";
import Carousel from "../home/Carousel";
import { image } from "../../helpers";
import Testemonial, { TestemonialData } from "./Testemonial";

interface Props {}

interface State {
	index: number;
	lastIndex: number | null;
}

export default class TestemonialCarousel extends React.Component<Props, State> {
	private interval: number | null;
	private readonly data: TestemonialData[] = [
		{
			image: image("brawl.png"),
			name: 'Radu "RDU" Dima',
			subtitle: "Pro Player and Streamer",
			text:
				'"I think both HSReplay.net and Hearthstone Deck Tracker are great tools. They are so good that they play a huge role right now in the competitive and casual side of Hearthstone. Everyone who likes the game should try these tools."',
		},
		{
			image: image("brawl.png"),
			name: 'Jeffrey "Trump" Shih',
			subtitle: "Pro Player and Streamer",
			text:
				'"I use HSReplay.net to find all the hot up and coming decks, and I comb through all the statistics to find out many things like which decks are performing the best, what matchups are good and bad, and all the cool tech choices people are using in their decks. Lets me nerd out on stats."',
		},
	];

	constructor(props: Props, context: any) {
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
			this.state.index !== nextState.index ||
			this.state.lastIndex !== nextState.lastIndex
		);
	}

	private rotate = (callback: () => any) => {
		this.setState(
			state => ({
				index: (state.index + 1) % this.data.length,
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
			7000,
		);
	};

	private renderOutput(index: number | null): React.ReactNode {
		if (index === null) {
			return null;
		}
		const { image, name, subtitle, text } = this.data[index];
		return (
			<Testemonial
				image={image}
				name={name}
				subtitle={subtitle}
				text={text}
			/>
		);
	}

	public render(): React.ReactNode {
		return (
			<Carousel
				from={this.renderOutput(this.state.lastIndex)}
				to={this.renderOutput(this.state.index)}
				onHoverStart={this.stopRotation}
				onHoverEnd={this.startRotation}
			/>
		);
	}
}
