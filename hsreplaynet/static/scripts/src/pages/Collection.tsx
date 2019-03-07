import InfoboxFilter from "../components/InfoboxFilter";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import CardData from "../CardData";
import CardImage from "../components/CardImage";
import CardFilterManager from "../components/cards/CardFilterManager";
import CollectionVisibility from "../components/cards/CollectionVisibility";
import {
	ClassFilter,
	CostFilter,
	MechanicsFilter,
	RarityFilter,
	SetFilter,
	TextFilter,
	TribeFilter,
	TypeFilter,
} from "../components/cards/filters";
import { FilterOption } from "../components/ClassFilter";
import CollectionSetup from "../components/collection/CollectionSetup";
import React, { Fragment } from "react";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import ResetHeader from "../components/ResetHeader";
import PrettyBlizzardAccount from "../components/text/PrettyBlizzardAccount";
import { cardSorting, image, isCollectibleCard } from "../helpers";
import {
	FragmentChildProps,
	LoadingStatus,
	SortDirection,
} from "../interfaces";
import { Account } from "../UserData";
import { Collection as ApiCollection } from "../utils/api";
import Sticky from "../components/utils/Sticky";
import NetworkNAdUnit from "../components/ads/NetworkNAdUnit";

interface Props extends FragmentChildProps, WithTranslation {
	cardData: CardData;
	collection: ApiCollection | null;
	battleTag: string;
	visibility: string;
	account: Account | null;
	owner: boolean;
	collectionLoadingStatus?: LoadingStatus;

	format?: string;
	setFormat?: (format: string) => void;
	playerClass?: string[];
	setPlayerClass?: (playerClass: string[]) => void;
	golden?: string;
	setGolden?: (golden: string) => void;
	cost?: string[];
	setCost?: (cost: string[]) => void;
	rarity?: string[];
	setRarity?: (rarity: string[]) => void;
	set?: string[];
	setSet?: (set: string[]) => void;
	type?: string[];
	setType?: (type: string[]) => void;
	tribe?: string[];
	setTribe?: (tribe: string[]) => void;
	mechanics?: string[];
	setMechanics?: (mechanics: string[]) => void;
	text?: string;
	setText?: (text: string) => void;

	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (sortDirection: SortDirection) => void;
}

interface State {
	filteredCards: HearthstoneJSONCardData[] | null;
	hasPersonalData: boolean;
	numCards: number;
	showFilters: boolean;
	showCollectionModal: boolean;
}

const PLACEHOLDER_MINION = image("loading_minion.png");
const PLACEHOLDER_SPELL = image("loading_spell.png");
const PLACEHOLDER_WEAPON = image("loading_weapon.png");
const PLACEHOLDER_HERO = image("loading_hero.png");

class Collection extends React.Component<Props, State> {
	showMoreButton: HTMLDivElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			filteredCards: null,
			hasPersonalData: false,
			numCards: 24,
			showFilters: false,
			showCollectionModal: false,
		};
	}

	onSearchScroll(): void {
		if (!this.showMoreButton) {
			return;
		}
		if (
			this.state.filteredCards !== null &&
			this.state.numCards >= this.state.filteredCards.length
		) {
			return;
		}
		const rect = this.showMoreButton.getBoundingClientRect();
		if (rect.top < window.innerHeight) {
			this.setState({ numCards: this.state.numCards + 12 });
		}
	}

	private scrollCb;

	public componentDidMount(): void {
		this.loadPlaceholders();

		this.scrollCb = () => this.onSearchScroll();
		document.addEventListener("scroll", this.scrollCb);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("scroll", this.scrollCb);
	}

	public render(): React.ReactNode {
		const { t, collection } = this.props;

		if (
			!this.props.owner &&
			!collection &&
			this.props.collectionLoadingStatus !== LoadingStatus.LOADING
		) {
			return (
				<div className="message-container">
					<h3>{t("This user's collection is private.")}</h3>
					<a href="/decks/">
						{t("We can help you find a new deck though!")}
					</a>
				</div>
			);
		}

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				{t("Back to card list")}
			</button>
		);

		return (
			<div className="cards">
				<CardFilterManager
					cardData={this.props.cardData}
					onFilter={dbfs =>
						this.setState({
							filteredCards: dbfs
								.map(dbf => this.props.cardData.fromDbf(dbf))
								.filter(isCollectibleCard),
						})
					}
				>
					<aside
						className={
							"infobox full-xs" +
							(this.state.showFilters ? "" : " hidden-xs")
						}
						id="cards-infobox"
					>
						{backButton}
						{this.renderFilters()}
						{backButton}
					</aside>
					<main
						className={
							"card-list-wrapper" +
							(this.state.showFilters ? " hidden-xs" : "")
						}
					>
						{this.renderContent()}
					</main>
				</CardFilterManager>
			</div>
		);
	}

	private renderContent(): React.ReactNode {
		const { t } = this.props;

		if (
			!this.props.cardData ||
			this.props.collectionLoadingStatus === LoadingStatus.LOADING ||
			this.state.filteredCards === null
		) {
			return <LoadingSpinner active />;
		}
		if (
			this.props.collection == null &&
			this.props.owner &&
			this.props.collectionLoadingStatus !== LoadingStatus.LOADING
		) {
			return (
				<div className="message-container">
					<Modal
						visible={this.state.showCollectionModal}
						onClose={() =>
							this.setState({ showCollectionModal: false })
						}
					>
						<CollectionSetup />
					</Modal>
					<h2>Browse and share your collection!</h2>
					{this.props.account ? (
						<p>
							<Trans>
								We couldn't find a collection for{" "}
								<strong>
									<PrettyBlizzardAccount
										account={this.props.account}
									/>
								</strong>.
							</Trans>
						</p>
					) : (
						<p>
							{t(
								"We couldn't find a collection for your account.",
							)}
						</p>
					)}
					<a
						href="#"
						className="btn promo-button"
						onClick={e => {
							e.preventDefault();
							this.setState({ showCollectionModal: true });
						}}
					>
						{t("Set up collection uploading")}
					</a>
				</div>
			);
		}
		return (
			<>
				<NetworkNAdUnit id="nn_mobile_mpu1" mobile center />
				<button
					className="btn btn-default visible-xs"
					id="filter-button"
					type="button"
					onClick={() =>
						this.setState({
							showFilters: !this.state.showFilters,
						})
					}
				>
					<span className="glyphicon glyphicon-filter" />
					{t("Filters")}
				</button>
				<Sticky top={10}>
					<NetworkNAdUnit id="nn_bb1" center />
				</Sticky>
				<TextFilter
					value={this.props.text}
					onChange={value => this.props.setText(value)}
				/>
				<div id="card-list">{this.renderCards()}</div>
				{this.renderShowMoreButton()}
			</>
		);
	}

	private renderShowMoreButton(): React.ReactNode {
		if (
			!this.state.filteredCards ||
			this.state.filteredCards.length <= this.state.numCards
		) {
			return null;
		}
		return (
			<div
				id="more-button-wrapper"
				ref={ref => (this.showMoreButton = ref)}
			>
				<button
					type="button"
					className="btn btn-default"
					onClick={() =>
						this.setState({
							numCards: this.state.numCards + 20,
						})
					}
				>
					Show more…
				</button>
			</div>
		);
	}

	private renderCards(): React.ReactNode {
		const cards = this.state.filteredCards.slice();
		cards.sort(cardSorting);
		return cards.slice(0, this.state.numCards).map(card => {
			const counts = this.props.collection.collection[card.dbfId];
			let normal = 0;
			let golden = 0;
			if (counts) {
				[normal, golden] = counts;
			}
			if (this.props.golden.indexOf("GOLDEN") !== -1) {
				normal = 0;
			}
			if (this.props.golden.indexOf("NORMAL") !== -1) {
				golden = 0;
			}
			const count = normal + golden;
			const maxCount = card.rarity === "LEGENDARY" ? 1 : 2;
			return (
				<div
					className={
						"collection-card" +
						(count >= maxCount
							? " complete"
							: count === 0
								? " missing"
								: "")
					}
					key={card.id}
				>
					<CardImage
						card={card}
						placeholder={this.getCardPlaceholder(card)}
					/>
					<div className="collection-counts">
						{this.props.golden.indexOf("GOLDEN") === -1 ? (
							<p>
								{normal}/{maxCount}
							</p>
						) : null}
						{this.props.golden.indexOf("NORMAL") === -1 ? (
							<p className="count-golden">
								{golden}/{maxCount}
							</p>
						) : null}
					</div>
				</div>
			);
		});
	}

	renderFilters(): React.ReactNode {
		const showReset = this.props.canBeReset;
		const { t, collection } = this.props;
		const { filteredCards } = this.state;

		const maxCount = (card: HearthstoneJSONCardData) => {
			return card.rarity === "LEGENDARY" ? 1 : 2;
		};

		const filters = [
			<ResetHeader
				key="reset"
				onReset={() => this.props.reset()}
				showReset={showReset}
			>
				{this.props.owner
					? "My Collection"
					: t(`${this.props.battleTag || t("Unknown")}'s Collection`)}
			</ResetHeader>,
		];

		if (this.props.visibility && this.props.collection) {
			filters.push(
				<section id="visibility-setting" key="visibility">
					<CollectionVisibility
						visibility={this.props.visibility}
						account={this.props.account}
					/>
				</section>,
			);
		}

		filters.push(
			<Fragment key="progress">
				<ClassFilter
					filters="AllNeutral"
					value={this.props.playerClass as FilterOption[]}
					onChange={value => this.props.setPlayerClass(value)}
				/>
				<section>
					<InfoboxFilterGroup
						onClick={value => {
							this.props.setGolden(value);
						}}
						selectedValue={this.props.golden}
						header={t("Quality")}
						deselectable
					>
						<InfoboxFilter value="NORMAL">
							{t("Normal")}
							{filteredCards && collection ? (
								<span className="infobox-value">
									{filteredCards.reduce(
										(acc, curr) =>
											acc +
											(collection.collection[curr.dbfId]
												? Math.min(
														maxCount(curr),
														collection.collection[
															curr.dbfId
														][0],
												  )
												: 0),
										0,
									)}{" "}
									/{" "}
									{filteredCards.reduce(
										(acc, curr) => acc + maxCount(curr),
										0,
									)}
								</span>
							) : null}
						</InfoboxFilter>
						<InfoboxFilter value="GOLDEN">
							{t("Golden")}
							{filteredCards && collection ? (
								<span className="infobox-value">
									{filteredCards.reduce(
										(acc, curr) =>
											acc +
											(collection.collection[curr.dbfId]
												? Math.min(
														maxCount(curr),
														collection.collection[
															curr.dbfId
														][1],
												  )
												: 0),
										0,
									)}{" "}
									/{" "}
									{filteredCards.reduce(
										(acc, curr) => acc + maxCount(curr),
										0,
									)}
								</span>
							) : null}
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</section>
			</Fragment>,
		);

		filters.push(
			<Fragment key="type">
				<CostFilter
					onChange={value => this.props.setCost(value)}
					value={this.props.cost}
				/>
				<RarityFilter
					value={this.props.rarity}
					onChange={value => this.props.setRarity(value)}
					collection={collection}
				/>
				<TypeFilter
					value={this.props.type}
					onChange={value => this.props.setType(value)}
					collection={collection}
				/>
				<SetFilter
					onChange={value => this.props.setSet(value)}
					value={this.props.set}
					collection={collection}
					onlyCollectibleSets
				/>
				<TribeFilter
					value={this.props.tribe}
					onChange={value => this.props.setTribe(value)}
					collection={collection}
				/>
				<MechanicsFilter
					value={this.props.mechanics}
					onChange={value => this.props.setMechanics(value)}
					collection={collection}
				/>
			</Fragment>,
		);

		filters.push(
			<Sticky bottom={0} key="ads">
				<NetworkNAdUnit id="nn_mpu1" />
			</Sticky>,
		);

		return filters;
	}

	onSortChanged(sortBy, sortDirection): void {
		this.props.setSortBy(sortBy);
		this.props.setSortDirection(sortDirection);
	}

	private getCardPlaceholder(card: any): string {
		switch (card.type) {
			case "WEAPON":
				return PLACEHOLDER_WEAPON;
			case "SPELL":
				return PLACEHOLDER_SPELL;
			case "HERO":
				return PLACEHOLDER_HERO;
			default:
				return PLACEHOLDER_MINION;
		}
	}

	private loadPlaceholders(): void {
		const minion = new Image();
		minion.src = PLACEHOLDER_MINION;
		const spell = new Image();
		spell.src = PLACEHOLDER_SPELL;
		const weapon = new Image();
		weapon.src = PLACEHOLDER_WEAPON;
		const hero = new Image();
		hero.src = PLACEHOLDER_HERO;
	}
}

export default withTranslation()(Collection);
