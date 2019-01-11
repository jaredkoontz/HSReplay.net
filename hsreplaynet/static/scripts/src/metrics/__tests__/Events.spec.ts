import { SubscriptionEvents } from "../Events";
import fetch = require("jest-fetch-mock");

describe("SubscriptionEvents", () => {
	describe("onInitiateCheckout", () => {
		test("pings the checkout notification endpoint", () => {
			SubscriptionEvents.onInitiateCheckout("/not-used/");

			expect(fetch.mock.calls.length).toEqual(1);
			expect(fetch.mock.calls[0][0]).toEqual(
				"/account/billing/notify-checkout/",
			);
		});
	});
});
