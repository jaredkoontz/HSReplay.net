import React from "react";
import StripeElementsCheckoutForm, {
	StripePlan,
} from "./StripeElementsCheckoutForm";
import PaypalCheckoutForm, { PaypalPlan } from "./PaypalCheckoutForm";
import BtnGroup from "../BtnGroup";
import UserData from "../../UserData";
import StripeLegacyCheckoutForm from "./StripeLegacyCheckoutForm";
import { Elements, StripeProvider } from "react-stripe-elements";

export const enum PaymentMethods {
	STRIPECHECKOUT = "stripe-checkout",
	CREDITCARD = "creditcard",
	PAYPAL = "paypal",
}

export interface CheckoutFormInstanceProps {
	submitUrl: string;
	onDisable: (disabled: boolean) => any;
	onSubscribe: (value: number) => any;
}

interface Props {
	defaultPaymentMethod?: PaymentMethods;
	stripeApiKey: string;
	stripeDefaultSource?: string;
	stripeCoupon?: string;
	stripePlans: StripePlan[];
	stripeElementsSubmitUrl: string;
	stripeCheckoutImageUrl?: string;
	stripeCheckoutSubmitUrl: string;
	paypalPlans: PaypalPlan[];
	paypalSubmitUrl: string;
	supportStripeElements?: boolean;
	onSubscribe: (value: number) => any;
}

interface State {
	disabled: boolean;
	paymentMethod: PaymentMethods;
}

export default class CheckoutForm extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			disabled: false,
			paymentMethod: props.defaultPaymentMethod
				? props.defaultPaymentMethod
				: this.getValidPaymentMethods()[0].method,
		};
	}

	getValidPaymentMethods() {
		const methods = [];

		if (this.props.supportStripeElements) {
			methods.push({
				method: PaymentMethods.CREDITCARD,
				label: (
					<strong>
						<span className="glyphicon glyphicon-credit-card" />&nbsp;Credit
						Card
					</strong>
				),
			});
		} else {
			methods.push({
				method: PaymentMethods.STRIPECHECKOUT,
				label: (
					<strong>
						<span className="glyphicon glyphicon-credit-card" />&nbsp;Credit
						Card
					</strong>
				),
			});
		}

		if (UserData.hasFeature("paypal")) {
			methods.push({
				method: PaymentMethods.PAYPAL,
				label: (
					<strong>
						<span className="glyphicon glyphicon-lock" />&nbsp;PayPal
					</strong>
				),
			});
		}

		return methods;
	}

	renderPaymentMethods() {
		const methods = this.getValidPaymentMethods();

		if (methods.length < 2) {
			// no selection required
			return null;
		}

		return (
			<div style={{ textAlign: "center" }}>
				<label id="payment-method">Payment method</label>
				<BtnGroup
					name="method"
					className="btn-group btn-group-flex"
					buttons={methods.map(method => ({
						label: method.label,
						value: method.method,
						className: "btn btn-default",
					}))}
					aria-describedby="payment-method"
					value={this.state.paymentMethod}
					onChange={paymentMethod => this.setState({ paymentMethod })}
					disabled={this.state.disabled}
				/>
			</div>
		);
	}

	renderCheckout() {
		switch (this.state.paymentMethod) {
			case PaymentMethods.STRIPECHECKOUT:
				return (
					<StripeLegacyCheckoutForm
						plans={this.props.stripePlans}
						apiKey={this.props.stripeApiKey}
						coupon={this.props.stripeCoupon}
						defaultSource={this.props.stripeDefaultSource}
						submitUrl={this.props.stripeCheckoutSubmitUrl}
						image={this.props.stripeCheckoutImageUrl}
						onDisable={(disabled: boolean) =>
							this.setState({ disabled })
						}
						onSubscribe={this.props.onSubscribe}
					/>
				);
			case PaymentMethods.CREDITCARD:
				return (
					<StripeProvider apiKey={this.props.stripeApiKey}>
						<Elements>
							<StripeElementsCheckoutForm
								plans={this.props.stripePlans}
								defaultSource={this.props.stripeDefaultSource}
								coupon={this.props.stripeCoupon}
								submitUrl={this.props.stripeElementsSubmitUrl}
								onDisable={(disabled: boolean) =>
									this.setState({ disabled })
								}
								onSubscribe={this.props.onSubscribe}
							/>
						</Elements>
					</StripeProvider>
				);
			case PaymentMethods.PAYPAL:
				return (
					<PaypalCheckoutForm
						plans={this.props.paypalPlans}
						submitUrl={this.props.paypalSubmitUrl}
						showCouponWarning={!!this.props.stripeCoupon}
						onDisable={(disabled: boolean) =>
							this.setState({ disabled })
						}
						onSubscribe={this.props.onSubscribe}
					/>
				);
		}
	}

	public render(): React.ReactNode {
		return (
			<div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
				{this.renderPaymentMethods()}
				{this.renderCheckout()}
			</div>
		);
	}
}
