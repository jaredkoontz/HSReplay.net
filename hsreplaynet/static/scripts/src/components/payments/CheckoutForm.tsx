import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { Elements, StripeProvider } from "react-stripe-elements";
import Stripe from "stripe";
import UserData from "../../UserData";
import BtnGroup from "../BtnGroup";
import PaypalCheckoutForm, { PaypalPlan } from "./PaypalCheckoutForm";
import StripeElementsCheckoutForm, {
	StripePlan,
} from "./StripeElementsCheckoutForm";

export const enum PaymentMethod {
	CREDITCARD = "creditcard",
	PAYPAL = "paypal",
}

export interface CheckoutFormInstanceProps {
	submitUrl: string;
	onDisable: (disabled: boolean) => any;
	onSubscribe: (value: number) => any;
}

interface Props extends InjectedTranslateProps {
	defaultPaymentMethod?: PaymentMethod;
	stripeApiKey: string;
	stripeDefaultSource?: string;
	stripeCoupon?: string;
	stripePlans: StripePlan[];
	stripeElementsSubmitUrl: string;
	stripeCheckoutImageUrl?: string;
	stripeCheckoutSubmitUrl: string;
	paypalPlans: PaypalPlan[];
	paypalSubmitUrl: string;
	onSubscribe: (value: number) => any;
}

interface State {
	disabled: boolean;
	paymentMethod: PaymentMethod;
	stripe: Stripe | null;
}

class CheckoutForm extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			disabled: false,
			paymentMethod: props.defaultPaymentMethod
				? props.defaultPaymentMethod
				: null,
			stripe: (window as any).Stripe
				? (window as any).Stripe(props.stripeApiKey)
				: null,
		};
	}

	public componentDidMount(): void {
		if (document.getElementById("stripe-js")) {
			return;
		}
		const script = document.createElement("script");
		script.id = "stripe-js";
		script.src = "https://js.stripe.com/v3/";
		script.async = true;
		script.onload = () =>
			this.setState({
				stripe: (window as any).Stripe(this.props.stripeApiKey),
			});
		document.head.appendChild(script);
	}

	getValidPaymentMethods() {
		const { t } = this.props;
		const methods = [];

		methods.push({
			method: PaymentMethod.CREDITCARD,
			label: (
				<strong>
					<span className="glyphicon glyphicon-credit-card" />&nbsp;{t(
						"CreditCard",
					)}
				</strong>
			),
		});

		if (UserData.hasFeature("paypal")) {
			methods.push({
				method: PaymentMethod.PAYPAL,
				label: (
					<strong>
						<span className="glyphicon glyphicon-lock" />&nbsp;{t(
							"PayPal",
						)}
					</strong>
				),
			});
		}

		return methods;
	}

	renderPaymentMethods() {
		const { t } = this.props;
		const methods = this.getValidPaymentMethods();

		if (methods.length < 2) {
			// no selection required
			return null;
		}

		return (
			<div style={{ textAlign: "center" }}>
				<label id="payment-method">{t("Payment method")}</label>
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
			case PaymentMethod.CREDITCARD:
				return (
					<StripeProvider stripe={this.state.stripe}>
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
			case PaymentMethod.PAYPAL:
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
			<div className="checkout-form">
				<main
					className={
						this.state.paymentMethod === null
							? "checkout-form-main-collaped"
							: "checkout-form-main-expanded"
					}
				>
					{this.renderPaymentMethods()}
					{this.renderCheckout()}
				</main>
				<footer>
					<small className="help-block text-center">
						<Trans>
							By signing up you agree to our{" "}
							<a href="/about/tos/" target="_blank">
								Terms of Service
							</a>.
						</Trans>
						<br />
						<Trans>
							Subscriptions renew automatically and can be
							cancelled any time from the{" "}
							<a
								href="https://hsreplay.net/account/billing/"
								target="_blank"
							>
								billing settings
							</a>{" "}
							page.
						</Trans>
					</small>
				</footer>
			</div>
		);
	}
}

export default translate()(CheckoutForm);
