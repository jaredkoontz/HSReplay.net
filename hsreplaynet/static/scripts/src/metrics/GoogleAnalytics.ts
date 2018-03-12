import InfluxMetricsBackend from "./InfluxMetricsBackend";
import MetricsReporter from "./MetricsReporter";

const INFLUX_CLIENT = new MetricsReporter(
	new InfluxMetricsBackend(INFLUX_DATABASE_JOUST),
	(series: string): string => "hsreplaynet_" + series,
);

export default class GoogleAnalytics {
	public static async event(
		category: string,
		action: string,
		label?: string,
		params?: UniversalAnalytics.FieldsObject,
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (typeof ga !== "function") {
				resolve();
				return;
			}
			const requiredParams: UniversalAnalytics.FieldsObject = {
				eventCategory: category,
				eventAction: action,
				eventLabel: label,
			};
			const defaults: UniversalAnalytics.FieldsObject = {
				hitType: "event",
				hitCallback: () => resolve(),
			};
			ga("send", "event", { ...defaults, ...requiredParams, ...params });
		});
	}
}

export class SubscriptionEvents extends GoogleAnalytics {
	public static onSubscribe(
		usdValue: number,
		location: string,
		params?: UniversalAnalytics.FieldsObject,
	): Promise<void> {
		return this.event("Checkout", "subscribe", location, {
			...params,
			eventValue: Math.ceil(+usdValue / 100),
		});
	}
}

export class TwitchStreamPromotionEvents extends GoogleAnalytics {
	public static onClickLiveNow(
		deck: string,
		params?: UniversalAnalytics.FieldsObject,
	): Promise<void> {
		INFLUX_CLIENT.writePoint(
			"twitch_click_live_now",
			{ count: "1i" },
			{ deck },
		);
		return this.event("Twitch", "view", deck, params);
	}

	public static onVisitStream(
		stream: string,
		params?: UniversalAnalytics.FieldsObject,
	): Promise<void> {
		INFLUX_CLIENT.writePoint(
			"twitch_visit_stream",
			{ count: "1i" },
			{ stream },
		);
		return this.event("Twitch", "visit", stream, params);
	}
}

export class ReferralEvents extends GoogleAnalytics {
	public static onCopyRefLink(which: string): Promise<void> {
		return this.event("Referrals", "copy", which);
	}
}

export class CollectionEvents extends GoogleAnalytics {
	public static onEnableDustWidget(): Promise<void> {
		INFLUX_CLIENT.writePoint("hsreplaynet_enable_dust_filter", {
			count: "1i",
		});
		return this.event("Dust Filter", "enable");
	}

	public static onViewModal(): Promise<void> {
		INFLUX_CLIENT.writePoint("hsreplaynet_collection_modal_open", {
			count: "1i",
		});
		return this.event("Collection Modal", "open");
	}
}
