import InfluxMetricsBackend from "./InfluxMetricsBackend";
import MetricsReporter from "./MetricsReporter";
import UserData from "../UserData";
import { Step } from "../components/collection/modal/CollectionSetupDialog";
import { fetchCSRF } from "../helpers";

UserData.create();

const INFLUX_CLIENT = new MetricsReporter(
	new InfluxMetricsBackend(INFLUX_DATABASE_JOUST),
	(series: string): string => "hsreplaynet_" + series,
);

export default class Events {
	public static ga(
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

	public static gaPageView(url: string): void {
		if (typeof ga !== "function") {
			return;
		}
		ga("send", "pageview", url);
	}

	public static fb(eventName: string, params?: any): void {
		if (typeof fbq !== "function") {
			return;
		}
		fbq("track", eventName, { ...params });
	}

	public static fbCustom(eventName: string, params?: any): void {
		if (typeof fbq !== "function") {
			return;
		}
		fbq("trackCustom", eventName, { ...params });
	}
}

/* tslint:disable:max-classes-per-file */

export class SubscriptionEvents extends Events {
	public static onInitiateCheckout(location: string): void {
		this.ga("Checkout", "initiate");
		this.fb("InitiateCheckout");

		// Update the user table timestamp for last premium checkout.

		fetchCSRF("/account/billing/notify-checkout/", {
			credentials: "same-origin",
			method: "POST",
		});
	}

	public static onSubscribe(
		usdValue: number,
		location: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		this.ga("Checkout", "subscribe", location, {
			...params,
			// eventValue needs to be a positive Integer, so let's just ceil
			eventValue: Math.ceil(usdValue),
		});
		this.fb("Purchase", {
			value: usdValue,
			currency: "USD",
		});
	}
}

export class TwitchStreamPromotionEvents extends Events {
	public static onClickLiveNow(
		deck: string,
		params?: UniversalAnalytics.FieldsObject,
	): void {
		INFLUX_CLIENT.writePoint(
			"twitch_click_live_now",
			{ count: "1i" },
			{ deck },
		);
		this.ga("Twitch", "view", deck, params);
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
		this.ga("Twitch", "visit", stream, params);
	}

	public static onFrontpageStreamLoaded(streamer: string): void {
		INFLUX_CLIENT.writePoint(
			"promo_stream_loaded",
			{ count: "1i" },
			{ streamer },
		);
		this.ga("Twitch Promo", "loaded", streamer);
	}

	public static onFrontpageStreamInteraction(streamer: string): void {
		INFLUX_CLIENT.writePoint(
			"promo_stream_interaction",
			{ count: "1i" },
			{ streamer },
		);
		this.ga("Twitch Promo", "interaction", streamer);
	}
}

export class TwitchVodEvents extends Events {
	public static onVodLoaded(vodUrl: string) {
		INFLUX_CLIENT.writePoint("twitch_vod_loaded", { count: "1i" });
		this.ga("Twitch Vod", "loaded", vodUrl);
	}
}

export class ReferralEvents extends Events {
	public static onCopyRefLink(which: string): void {
		this.ga("Referrals", "copy", which);
	}
}

export class CollectionEvents extends Events {
	public static onEnableDustWidget(): void {
		INFLUX_CLIENT.writePoint("enable_dust_filter", {
			count: "1i",
		});
		this.ga("Dust Filter", "enable");
	}

	public static onViewModal(): void {
		INFLUX_CLIENT.writePoint("collection_modal_open", {
			count: "1i",
		});
		this.ga("Collection Modal", "open");
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
		this.ga("Collection Modal", "step", stepValue);
		this.gaPageView("/virtual/collection/step/" + stepValue);
	}
}

export class FilterEvents extends Events {
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
		this.ga("Filters", "interaction", filter);
	}
}

export class DeckEvents extends Events {
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
		this.ga("Decks", "view");
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
		this.ga("Deck", "copy", label);
		this.fbCustom("CopyDeckString");
	}
}

export class DeckTrackerEvents extends Events {
	public static onDownload(label: string): void {
		this.ga("Deck Tracker", "download", label);
		this.fbCustom("DownloadDeckTracker");
	}
}

export class PremiumEvents extends Events {
	public static onView(): void {
		this.ga("Premium", "view");
	}
}
