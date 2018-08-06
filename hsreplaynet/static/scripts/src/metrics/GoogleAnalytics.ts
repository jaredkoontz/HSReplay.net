import InfluxMetricsBackend from "./InfluxMetricsBackend";
import MetricsReporter from "./MetricsReporter";
import UserData from "../UserData";
import { Step } from "../components/collection/modal/CollectionSetupDialog";

UserData.create();

const INFLUX_CLIENT = new MetricsReporter(
	new InfluxMetricsBackend(INFLUX_DATABASE_JOUST),
	(series: string): string => "hsreplaynet_" + series,
);

export default class GoogleAnalytics {
	public static event(
		category: string,
		action: string,
		label?: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		if (typeof ga !== "function") {
			return;
		}
		const requiredParams: UniversalAnalytics.FieldsObject = {
			eventCategory: category,
			eventAction: action,
			eventLabel: label,
		};
		const defaults: UniversalAnalytics.FieldsObject = {
			hitType: "event",
		};
		ga("send", "event", { ...defaults, ...requiredParams, ...params });
	}

	public static trackPageView(url: string): void {
		if (typeof ga !== "function") {
			return;
		}
		ga("send", "pageview", url);
	}
}

export class SubscriptionEvents extends GoogleAnalytics {
	public static onSubscribe(
		usdValue: number,
		location: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		this.event("Checkout", "subscribe", location, {
			...params,
			eventValue: Math.ceil(+usdValue / 100),
		});
	}
}

export class TwitchStreamPromotionEvents extends GoogleAnalytics {
	public static onClickLiveNow(
		deck: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		INFLUX_CLIENT.writePoint(
			"twitch_click_live_now",
			{ count: "1i" },
			{ deck },
		);
		this.event("Twitch", "view", deck, params);
	}

	public static onVisitStream(
		stream: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		INFLUX_CLIENT.writePoint(
			"twitch_visit_stream",
			{ count: "1i" },
			{ stream },
		);
		this.event("Twitch", "visit", stream, params);
	}

	public static onFrontpageStreamLoaded(streamer: string): void {
		INFLUX_CLIENT.writePoint(
			"promo_stream_loaded",
			{ count: "1i" },
			{ streamer },
		);
		this.event("Twitch Promo", "loaded", streamer);
	}
}

export class ReferralEvents extends GoogleAnalytics {
	public static onCopyRefLink(which: string): void {
		this.event("Referrals", "copy", which);
	}
}

export class CollectionEvents extends GoogleAnalytics {
	public static onEnableDustWidget(): void {
		INFLUX_CLIENT.writePoint("enable_dust_filter", {
			count: "1i",
		});
		this.event("Dust Filter", "enable");
	}

	public static onViewModal(): void {
		INFLUX_CLIENT.writePoint("collection_modal_open", {
			count: "1i",
		});
		this.event("Collection Modal", "open");
	}

	public static onEnterModalStep(step: Step): void {
		const steps = {
			["" + Step.SIGN_IN]: "SIGN_IN",
			["" + Step.CONNECT_HDT]: "CONNECT_HDT",
			["" + Step.CLAIM_ACCOUNT]: "CLAIM_ACCOUNT",
			["" + Step.UPLOAD_COLLECTION]: "UPLOAD_COLLECTION",
			["" + Step.COMPLETE]: "COMPLETE",
			["" + Step.COLLECTION_DISABLED]: "COLLECTION_DISABLED",
		};
		const stepValue = steps["" + step] || "UNKNOWN";
		INFLUX_CLIENT.writePoint(
			"collection_modal_current_step",
			{
				count: "1i",
				step: stepValue,
			},
			{
				step: stepValue,
				step_number: "" + step,
			},
		);
		this.event("Collection Modal", "step", stepValue);
		this.trackPageView("/virtual/collection/step/" + stepValue);
	}
}

export class FilterEvents extends GoogleAnalytics {
	public static onFilterInteraction(
		page: string,
		filter: string,
		value: string,
	): void {
		INFLUX_CLIENT.writePoint(
			"filter_interaction",
			{
				count: "1i",
			},
			{
				page,
				filter,
				value,
			},
		);
		this.event("Filters", "interaction", filter);
	}
}

export class DeckEvents extends GoogleAnalytics {
	public static onViewDecks(
		isAuthenticated: boolean,
		blizzardAccountCount: number,
		hasCollection: boolean,
	): void {
		INFLUX_CLIENT.writePoint(
			"view_decks",
			{
				count: "1i",
				blizzard_account_count: `${blizzardAccountCount}i`,
			},
			{
				is_authenticated: "" + +isAuthenticated,
				has_blizzard_account: "" + +(blizzardAccountCount > 0),
				has_collection: "" + +hasCollection,
			},
		);
		this.event("Decks", "view");
	}

	public static onCopyDeck(
		label: string,
		dustCost: number,
		hasCollection: boolean,
	): void {
		INFLUX_CLIENT.writePoint(
			"copy_deck",
			{
				count: "1i",
				dust_cost: `${dustCost}i`,
			},
			{
				has_collection: "" + +hasCollection,
			},
		);
		this.event("Deck", "copy", label);
	}
}
