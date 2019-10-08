import React from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import UserData from "../../UserData";
import BtnGroup from "../BtnGroup";
import CSRFElement from "../CSRFElement";
import { CheckoutFormInstanceProps } from "./CheckoutForm";
import Feature from "../Feature";

export interface PaypalPlan {
	paypalId: string;
	description: string;
	amount: string;
	currency: string;
}

interface Props extends CheckoutFormInstanceProps, WithTranslation {
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
		if (UserData.hasFeature("semiannual-sale")) {
			if (this.props.plans.length !== 2) {
				throw new Error("Invalid plan configuration");
			}
			let monthlyPlan;
			let semiannualPlan;
			if (+this.props.plans[0].amount < +this.props.plans[1].amount) {
				monthlyPlan = this.props.plans[0];
				semiannualPlan = this.props.plans[1];
			} else {
				monthlyPlan = this.props.plans[1];
				semiannualPlan = this.props.plans[0];
			}
			return [
				{
					label: <h4>{monthlyPlan.description}*</h4>,
					value: monthlyPlan.paypalId,
					className: "btn btn-default",
				},
				{
					label: (
						<h4>
							$20.49 USD the first 6 months**<br />
							<strong>38% OFF</strong>
						</h4>
					),
					value: semiannualPlan.paypalId,
					className: "btn btn-default",
				},
			];
		} else {
			return this.props.plans.map((plan, i) => {
				let discount: React.ReactNode = null;
				if (this.props.plans.length === 2) {
					const otherPlan =
						i === 0 ? this.props.plans[1] : this.props.plans[0];
					if (+plan.amount > +otherPlan.amount) {
						const difference = +otherPlan.amount * 6 - +plan.amount;
						const reduction = Math.floor(
							100 / (+otherPlan.amount * 6) * difference,
						);
						discount = (
							<>
								<br />
								<strong>{`${reduction}% cheaper`}</strong>
							</>
						);
					}
				}
				return {
					label: (
						<h4>
							{plan.description}*{discount}
						</h4>
					),
					value: plan.paypalId,
					className: "btn btn-default",
				};
			});
		}
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
						<Feature feature="semiannual-sale">
							<br />
							**$25.50 USD after the first 6 months.
						</Feature>
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
export default withTranslation()(PaypalCheckoutForm);
