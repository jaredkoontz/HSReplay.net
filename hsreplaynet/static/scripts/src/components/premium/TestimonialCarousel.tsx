import React from "react";
import Carousel from "../home/Carousel";
import { image } from "../../helpers";
import Testimonial, { TestimonialData } from "./Testimonial";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {}

interface State {
	index: number;
	lastIndex: number | null;
}

class TestimonialCarousel extends React.Component<Props, State> {
	private interval: number | null;

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

	private rotate = (callback: () => void) => {
		this.setState(
			state => ({
				index: (state.index + 1) % this.getTestimonialData().length,
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
			8000,
		);
	};

	private renderOutput(index: number | null): React.ReactNode {
		if (index === null) {
			return null;
		}
		const { image, name, subtitle, text } = this.getTestimonialData()[
			index
		];
		return (
			<Testimonial
				image={image}
				name={name}
				subtitle={subtitle}
				text={text}
			/>
		);
	}

	private getTestimonialData(): TestimonialData[] {
		const { t } = this.props;
		return [
			{
				image: image("premium/boarcontrol.png"),
				name: "BoarControl",
				subtitle: t("Hearthstone Grandmaster"),
				text:
					'"Since I started competing in HS full time around 2 years ago HSReplay has been a key tool in my preparation for competitions as well as placing high on ladder. The meta tab allows me to see deck matchups for conquest and LHS events, while the decks tab has helped me to multiple top 25 finishes (using the top 1000 filter). Additionally the mulligan win rates (on and off coin) for each match up is a great tool when first learning a deck."',
			},
			{
				image: image("premium/kripparian.jpg"),
				name: "Kripparian",
				subtitle: t("Streamer, Vegan Lord"),
				text:
					'"I love building my own decks and making choices of which cards to include and exclude based on the in depth stats provided by HSReplay."',
			},
			{
				image: image("premium/RDU.jpg"),
				name: 'Radu "RDU" Dima',
				subtitle: t("Pro Player and Streamer"),
				text:
					'"I think both HSReplay and Hearthstone Deck Tracker are great tools. They are so good that they play a huge role right now in the competitive and casual side of Hearthstone. Everyone who likes the game should try these tools."',
			},
			/*{
				image: image("premium/trump.jpg"),
				name: 'Jeffrey "Trump" Shih',
				subtitle: t("Mayor of Value Town, Streamer"),
				text: '"I use HSReplay to find all the hot up and coming decks. I comb through all the statistics to find out many things like which decks are performing the best, what matchups are good and bad, and all the cool tech choices people are using in their decks. Lets me nerd out on stats."',
			},*/
		];
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

export default withTranslation()(TestimonialCarousel);
