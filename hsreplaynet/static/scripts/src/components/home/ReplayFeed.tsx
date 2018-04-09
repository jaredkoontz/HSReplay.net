import * as React from "react";
import { Archetype } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import ScrollingFeed from "./ScrollingFeed";
import RankIcon from "../RankIcon";
import { BnetGameType } from "../../hearthstone";
import DataManager from "../../DataManager";
import _ from "lodash";
import { commaSeparate } from "../../helpers";

interface ReplayData {
	player1_rank: string;
	player1_legend_rank: string;
	player1_archetype: string;
	player1_won: string;
	player2_rank: string;
	player2_legend_rank: string;
	player2_archetype: string;
	player2_won: string;
	id: string;
}

interface GameCountData {
	games_today: number;
	games_weekly: number;
	contributors_today: number;
	contributors_weekly: number;
}

interface State {
	data: ReplayData[];
	doUpdate: boolean;
	fetching: boolean;
	gamesToday: number;
	lastFetch: Date;
}

interface Props {
	archetypeData?: Archetype[];
	gamesCountData?: GameCountData;
	fullSpeed?: boolean;
}

class ReplayFeed extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			data: [],
			fetching: false,
			doUpdate: true,
			gamesToday: 0,
			lastFetch: new Date(0),
		};

		this.updateGamesToday();
	}

	updateGamesToday() {
		const weeklyGames = 23153932;
		const now = new Date();
		const seconds =
			now.getMilliseconds() +
			1000 * now.getSeconds() +
			1000 * 60 * now.getMinutes() +
			1000 * 60 * 60 * now.getHours();
		const secondsInDay = 1000 * 60 * 60 * 24;
		const gamesToday = Math.floor(
			weeklyGames / 7 * (seconds / secondsInDay),
		);
		this.setState({ gamesToday });
		// setTimeout(() => this.updateGamesToday(), 30);
	}

	fetchData() {
		if (
			this.state.fetching ||
			new Date().valueOf() - this.state.lastFetch.valueOf() < 5000
		) {
			return;
		}
		this.setState({ fetching: true });
		DataManager.get("/live/replay_feed/", {}, true)
			.then((response: any) => {
				if (_.isEmpty(response) || _.isEmpty(response.data)) {
					return Promise.reject("No data");
				}
				return Promise.resolve(response.data);
			})
			.then((data: ReplayData[]) => {
				this.setState({ data, fetching: false, lastFetch: new Date() });
			})
			.catch(error => {
				this.setState({
					doUpdate: false,
					fetching: false,
					lastFetch: new Date(),
				});
			});
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			!_.isEqual(this.props.archetypeData, nextProps.archetypeData) ||
			this.props.fullSpeed !== nextProps.fullSpeed ||
			!_.isEqual(this.state.data, nextState.data) ||
			this.state.doUpdate !== nextState.doUpdate ||
			this.state.gamesToday !== nextState.gamesToday ||
			this.state.fetching !== nextState.fetching
		);
	}

	render(): React.ReactNode {
		if (this.state.data === null) {
			return null;
		}
		const items = this.state.data.map(replay => {
			return { id: replay.id, data: replay };
		});
		const weeklyGames = 23153932;
		const gamesPerSecond = weeklyGames / (60 * 60 * 24 * 7);
		return (
			<div id="replay-feed">
				<h1>Games Last Week: {commaSeparate(weeklyGames)}</h1>
				<h4>Games Today: {commaSeparate(this.state.gamesToday)}</h4>
				<ScrollingFeed
					direction="up"
					items={items}
					itemConverter={d => this.itemConverter(d)}
					itemHeight={44}
					onLowItems={() => this.fetchData()}
					lowItemCount={10}
					itemsPerSecond={this.props.fullSpeed ? gamesPerSecond : 1.2}
				/>
				<span id="replay-contributors">
					Contributors:{" "}
					{commaSeparate(
						this.props.gamesCountData.contributors_today,
					)}
				</span>
				<a
					className="btn promo-button blue-style"
					href="https://hsdecktracker.net/"
					target="_blank"
				>
					Become a Contributor
				</a>
			</div>
		);
	}

	itemConverter(data: ReplayData): React.ReactNode {
		const p1IconName = ["player-icon"];
		const p2IconName = ["player-icon"];
		if (data.player1_won === "True") {
			p1IconName.push("winner");
		} else {
			p2IconName.push("winner");
		}
		const p1Archetype = this.props.archetypeData.find(a => {
			return a.id === +data.player1_archetype;
		});
		const p2Archetype = this.props.archetypeData.find(a => {
			return a.id === +data.player2_archetype;
		});
		return (
			<a
				className="replay-feed-item"
				href={`/replay/${data.id}`}
				target="_blank"
			>
				<img
					className={p1IconName.join(" ")}
					src={`${STATIC_URL}images/crown.png`}
				/>
				<div className="replay-feed-player player-left">
					<RankIcon
						gameType={BnetGameType.BGT_RANKED_STANDARD}
						rank={+data.player1_rank}
						legendRank={+data.player1_legend_rank}
					/>
					<span>{p1Archetype && p1Archetype.name}</span>
				</div>
				<img className="vs-icon" src={`${STATIC_URL}images/vs.png`} />
				<div className="replay-feed-player player-right">
					<RankIcon
						gameType={BnetGameType.BGT_RANKED_STANDARD}
						rank={+data.player2_rank}
						legendRank={+data.player2_legend_rank}
					/>
					<span>{p2Archetype && p2Archetype.name}</span>
				</div>
				<img
					className={p2IconName.join(" ")}
					src={`${STATIC_URL}images/crown.png`}
				/>
			</a>
		);
	}
}

export default withLoading(["archetypeData", "gamesCountData"])(ReplayFeed);