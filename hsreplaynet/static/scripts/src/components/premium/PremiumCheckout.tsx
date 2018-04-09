import React from "react";
import CheckoutForm, { PaymentMethod } from "../payments/CheckoutForm";
import { SubscriptionEvents } from "../../metrics/GoogleAnalytics";

interface Props {
	analyticsLabel?: string;
	preselect?: boolean;
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
				onSubscribe={(value: number) => {
					SubscriptionEvents.onSubscribe(
						value,
						this.props.analyticsLabel,
						{
							transport: "beacon",
						},
					);
				}}
			/>
		);
	}
}
