import React from "react";
import CheckoutForm, { PaymentMethod } from "../payments/CheckoutForm";
import { cookie } from "cookie_js";

interface Props {
	analyticsLabel?: string;
	preselect?: boolean;
	onInteract?: () => void;
}

export default class PremiumCheckout extends React.Component<Props> {
	public render(): React.ReactNode {
		const element = document.getElementById("payment-details-data");
		const paymentData = JSON.parse(element.textContent);

		const {
			apiKey: stripeApiKey,
			coupon: stripeCoupon,
			target: stripeSubmitUrl,
			plans: stripePlans,
			defaultSource: stripeDefaultSource,
		} = paymentData.stripe;

		const {
			plans: paypalPlans,
			target: paypalSubmitUrl,
		} = paymentData.paypal;

		return (
			<CheckoutForm
				stripeDefaultSource={stripeDefaultSource}
				stripeApiKey={stripeApiKey}
				stripeCoupon={stripeCoupon}
				stripePlans={stripePlans}
				stripeElementsSubmitUrl={stripeSubmitUrl}
				stripeCheckoutSubmitUrl={stripeSubmitUrl}
				defaultPaymentMethod={
					this.props.preselect ? PaymentMethod.CREDITCARD : null
				}
				paypalPlans={paypalPlans}
				paypalSubmitUrl={paypalSubmitUrl}
				onInteract={() => {
					if (this.props.onInteract) {
						this.props.onInteract();
					}
				}}
				onSubscribe={(value: number) => {
					cookie.set(
						"just-subscribed",
						JSON.stringify({
							value,
							label: this.props.analyticsLabel,
						}),
						{
							path: "/",
						},
					);
				}}
			/>
		);
	}
}
