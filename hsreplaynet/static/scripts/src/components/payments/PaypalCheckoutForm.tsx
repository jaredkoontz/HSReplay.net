import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../../UserData";
import BtnGroup from "../BtnGroup";
import CSRFElement from "../CSRFElement";
import { CheckoutFormInstanceProps } from "./CheckoutForm";

export interface PaypalPlan {
	paypalId: string;
	description: string;
	amount: string;
	currency: string;
}

interface Props extends CheckoutFormInstanceProps, InjectedTranslateProps {
	plans: PaypalPlan[];
	showCouponWarning?: boolean;
}

interface State {
	selectedPlan: null | string;
	submit?: boolean;
}

class PaypalCheckoutForm extends React.Component<Props, State> {
	form: HTMLFormElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			submit: false,
			selectedPlan: this.props.plans
				? this.props.plans[0].paypalId
				: null,
		};
	}

	getPlanButtons() {
		return this.props.plans.map(plan => ({
			label: <h4>{plan.description}*</h4>,
			value: plan.paypalId,
			className: "btn btn-default",
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
		this.props.onInteract();
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
				<Trans>
					We currently don't support coupons for PayPal payments.<br />
					<strong>You will be charged the full amount.</strong>
				</Trans>
			</p>
		);
	}

	renderGeolocationWarning() {
		const { t } = this.props;
		const country = UserData.getIpCountry();
		if (!country) {
			return null;
		}

		switch (country.toUpperCase()) {
			/* FIXME i18n */
			case "DE":
				return (
					<p className="alert alert-danger">
						{t(
							"PayPal payments are not currently supported for German PayPal accounts. You may not be able to complete the payment. Consider using a different payment method.",
						)}
					</p>
				);
			case "CN":
				return (
					<p className="alert alert-danger">
						{t(
							"PayPal payments are not currently supported for Chinese PayPal accounts. You may not be able to complete the payment. Consider using a different payment method.",
						)}
					</p>
				);
			default:
				return null;
		}
	}

	public render(): React.ReactNode {
		const { t } = this.props;
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
						{t("Choose your plan")}
					</label>
					<BtnGroup
						className="btn-group btn-group-flex"
						buttons={this.getPlanButtons()}
						name="plan"
						id="paypal-plan"
						onChange={selectedPlan => {
							this.props.onInteract();
							this.setState({ selectedPlan });
						}}
						value={this.state.selectedPlan}
						aria-labelledby="choose-plan"
						disabled={working}
						required
					/>
				</div>
				<div style={{ margin: "0 0 20px 0" }}>
					<em>
						{t(
							"*Includes an additional $0.50 USD processing fee (PayPal only).",
						)}
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
						{!working
							? t("Pay with PayPal")
							: t("Waiting for PayPal")}
					</button>
				</p>
				<CSRFElement />
			</form>
		);
	}
}
export default translate()(PaypalCheckoutForm);
