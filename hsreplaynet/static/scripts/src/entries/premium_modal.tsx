import React from "react";
import ReactDOM from "react-dom";
import CheckoutForm from "../components/payments/CheckoutForm";
import UserData from "../UserData";
import { SubscriptionEvents } from "../metrics/GoogleAnalytics";

let modal;

window.onload = () => {
	modal = document.getElementById("premium-modal");
	if (!modal) {
		return;
	}
	setupModal(modal);
	if (modal.getAttribute("data-load-checkout")) {
		loadCheckout();
	}
};

UserData.create();

const trackModalInteraction = (
	action: string,
	nonInteraction: boolean = false,
	label?: string,
) => {
	if (typeof ga !== "function") {
		return;
	}
	ga("send", {
		hitType: "event",
		eventCategory: "Premium Modal",
		eventAction: action,
		eventLabel: label,
		nonInteraction,
	});
};

let modalIsOpen = null;
let lastFocus = null;
let lastLabel = null;
let loadedCheckout = false;

const loadCheckout = (location?: string) => {
	if (loadedCheckout) {
		return;
	}
	if (!UserData.isAuthenticated()) {
		return;
	}
	window.hsreplaynet_load_hscheckout(
		document.getElementById("modal-checkout"),
		document.getElementById("premium-plan-data"),
		location,
	);
	loadedCheckout = true;
};

const openModal = (modalToOpen, label?: string) => {
	if (modalIsOpen === true) {
		return;
	}
	modalIsOpen = true;
	modalToOpen.style.display = "flex";

	loadCheckout(label);

	// setup focus
	lastFocus = document.activeElement;
	const inner = modalToOpen.children[0];
	inner.setAttribute("tabindex", 0);
	inner.focus();

	lastLabel = label;

	trackModalInteraction("open", false, label);
};

const closeModal = modalToClose => {
	if (modalIsOpen === false) {
		return;
	}

	// reset focus
	if (lastFocus) {
		lastFocus.focus();
		lastFocus = null;
	}
	const inner = modalToClose.children[0];
	inner.setAttribute("tabindex", -1);

	modalIsOpen = false;
	modalToClose.style.display = "none";

	const label = lastLabel;
	lastLabel = null;

	trackModalInteraction("close", false, label);
};

// setup modal
const setupModal = modal => {
	if (!modal) {
		return;
	}
	const closeButton = document.getElementById("premium-modal-close");
	closeButton.style.display = "block";
	closeButton.onclick = e => {
		e.preventDefault();
		closeModal(modal);
	};

	// setup click on background
	modal.onclick = e => {
		if (e.target && e.target !== modal) {
			return;
		}
		e.preventDefault();
		closeModal(modal);
	};

	// setup escape button
	modal.children[0].onkeydown = event => {
		if (event.keyCode === 27) {
			closeModal(modal);
		}
	};
};

const getDataAttributes = (element: Element) => {
	const attributes = element.attributes;
	const dataAttributes = {};
	for (let i = 0; i < attributes.length; i++) {
		const attribute = attributes[i];
		const name = attribute.name;
		// exclude non-data attributes
		if (!name.startsWith("data-")) {
			continue;
		}
		// figure out key name
		const optionName = name.substr(5);
		if (optionName) {
			// camel case
			const camelName = optionName.replace(/-(.)/g, (match, letter) =>
				letter.toUpperCase(),
			);
			// typecast to boolean if possible
			let value: any = attribute.value;
			if (value.toLowerCase() === "true") {
				value = true;
			}
			if (value.toLowerCase() === "false") {
				value = false;
			}
			// typecast to number if possible
			if (typeof value === "string" && !isNaN(+value)) {
				value = +value;
			}
			// save value
			dataAttributes[camelName] = value;
		}
	}

	return dataAttributes;
};

window.hsreplaynet_load_hscheckout = (
	targetElement: HTMLDivElement,
	plansElements: HTMLScriptElement,
	location?: string,
) => {
	const apiKey = targetElement.getAttribute("data-api-key");
	const stripeCheckoutImage = targetElement.getAttribute(
		"data-stripe-checkout-image",
	);
	const stripeCoupon = targetElement.getAttribute("data-stripe-coupon");
	const stripeCheckoutSubmitUrl = targetElement.getAttribute(
		"data-stripe-checkout-submit-url",
	);
	const stripeElementsSubmitUrl = targetElement.getAttribute(
		"data-stripe-elements-submit-url",
	);
	const paypalSubmitUrl = targetElement.getAttribute(
		"data-paypal-submit-url",
	);
	const defaultSource = targetElement.getAttribute(
		"data-stripe-default-source",
	);
	const planData = JSON.parse(plansElements.textContent);
	const supportStripeElements =
		targetElement.getAttribute("data-support-stripe-elements") === "1";

	const stripe = document.createElement("script");
	stripe.src = "https://js.stripe.com/v3/";
	stripe.onload = () => {
		ReactDOM.render(
			<CheckoutForm
				stripeDefaultSource={defaultSource}
				stripeApiKey={apiKey}
				stripeCoupon={stripeCoupon}
				stripePlans={planData.stripe}
				stripeCheckoutImageUrl={stripeCheckoutImage}
				stripeCheckoutSubmitUrl={stripeCheckoutSubmitUrl}
				stripeElementsSubmitUrl={stripeElementsSubmitUrl}
				paypalPlans={planData.paypal}
				paypalSubmitUrl={paypalSubmitUrl}
				supportStripeElements={supportStripeElements}
				onSubscribe={(value: number) => {
					SubscriptionEvents.onSubscribe(value, location, {
						transport: "beacon",
					});
				}}
			/>,
			targetElement,
		);
	};
	document.head.appendChild(stripe);
};

window.hsreplaynet_load_premium_modal = (label?: string) => {
	if (!modal) {
		return;
	}
	// show modal
	openModal(modal, label);
	const learnMore = document.getElementById("premium-modal-learn-more");
	if (learnMore) {
		learnMore.onclick = () => trackModalInteraction("details");
	}
};
