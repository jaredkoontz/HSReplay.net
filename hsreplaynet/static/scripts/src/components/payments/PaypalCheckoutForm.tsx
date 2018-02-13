import React from "react";
import BtnGroup from "../BtnGroup";
import { CheckoutFormInstanceProps } from "./CheckoutForm";
import UserData from "../../UserData";

export interface PaypalPlan {
	paypalId: string;
	description: string;
	amount: string;
	currency: string;
}

interface PaypalCheckoutFormProps
	extends CheckoutFormInstanceProps,
		React.ClassAttributes<PaypalCheckoutForm> {
	plans: PaypalPlan[];
	showCouponWarning?: boolean;
}

interface PaypalCheckoutFormState {
	selectedPlan: null | string;
	submit?: boolean;
}

export default class PaypalCheckoutForm extends React.Component<
	PaypalCheckoutFormProps,
	PaypalCheckoutFormState
> {
	form: HTMLFormElement;

	constructor(props: PaypalCheckoutFormProps, context: any) {
		super(props, context);
		this.state = {
			submit: false,
			selectedPlan: this.props.plans ? this.props.plans[0].paypalId : null
		};
	}

	getPlanButtons() {
		return this.props.plans.map(plan => ({
			label: <h4>{plan.description}*</h4>,
			value: plan.paypalId,
			className: "btn btn-default"
		}));
	}

	private getPlanData(paypalId: string): PaypalPlan | null {
		return this.props.plans
			? this.props.plans.find(p => p.paypalId === paypalId)
			: null;
	}

	submit() {
		if (this.state.selectedPlan === null) {
			return;
		}
		this.props.onDisable(true);
		const planData = this.getPlanData(this.state.selectedPlan);
		if (planData) {
			this.props.onSubscribe(+planData.amount);
		}
		this.setState({ submit: true }, () => this.form.submit());
	}

	renderCouponWarning() {
		if (!this.props.showCouponWarning) {
			return null;
		}

		return (
			<p className="alert alert-warning">
				We currently don't support coupons for PayPal payments.<br />
				<strong>You will be charged the full amount.</strong>
			</p>
		);
	}

	renderGeolocationWarning() {
		const country = UserData.getIpCountry();
		if (!country) {
			return null;
		}

		switch (country.toUpperCase()) {
			case "DE":
				return (
					<p className="alert alert-danger">
						<em>
							PayPal-Zahlungen werden für deutsche PayPal-Konten
							nicht unterstützt. Du wirst die Zahlung
							möglicherweise nicht abschließen können. Andere
							Zahlungsmethoden sind nicht betroffen.
						</em>
						<br />
						<br />
						PayPal payments are not currently supported for German
						PayPal accounts. You may not be able to complete the
						payment. Consider using a different payment method.
					</p>
				);
			case "CN":
				return (
					<p className="alert alert-danger">
						<em>
							目前我们的网站不支持中国PayPal账户。您可能无法完成付款。我们建议使用不同的付款方式。
						</em>
						<br />
						<br />
						PayPal payments are not currently supported for Chinese
						PayPal accounts. You may not be able to complete the
						payment. Consider using a different payment method.
					</p>
				);
			default:
				return null;
		}
	}

	render() {
		const working = this.state.submit;
		return (
			<form
				method="post"
				style={{ textAlign: "center" }}
				action={this.props.submitUrl}
				ref={ref => (this.form = ref)}
			>
				<div style={{ margin: "25px 0 10px 0" }}>
					<label htmlFor="paypal-plan" id="choose-plan">
						Choose your plan
					</label>
					<BtnGroup
						className="btn-group btn-group-flex"
						buttons={this.getPlanButtons()}
						name="plan"
						id="paypal-plan"
						onChange={selectedPlan =>
							this.setState({ selectedPlan })
						}
						value={this.state.selectedPlan}
						aria-labelledby="choose-plan"
						disabled={working}
						required
					/>
				</div>
				<div style={{ margin: "0 0 20px 0" }}>
					<em>
						*Includes an additional $0.50 USD processing fee (PayPal
						only).
					</em>
				</div>
				{this.renderCouponWarning()}
				{this.renderGeolocationWarning()}
				<p>
					<button
						className="promo-button text-premium checkout-button"
						onClick={() => this.submit()}
						disabled={working}
					>
						{!working ? "Pay with PayPal" : "Waiting for PayPal"}
					</button>
				</p>
				<div dangerouslySetInnerHTML={this.props.csrfElement} />
			</form>
		);
	}
}
