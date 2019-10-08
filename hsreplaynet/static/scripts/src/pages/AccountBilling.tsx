import React from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import CSRFElement from "../components/CSRFElement";
import StripeElementsAddCardForm from "../components/payments/StripeElementsAddCardForm";
import StripeElementsProvider from "../components/payments/StripeElementsProvider";
import SemanticAge from "../components/text/SemanticAge";
import UserData from "../UserData";
import Feature from "../components/Feature";

interface BillingUrls {
	cancel: string;
	paypal_manage: string;
	subscribe: string;
	update_card: string;
}

interface PaypalContext {
	end_of_period: string;
	subscribed: boolean;
	billing_agreements?: PaypalBillingAgreement[];
}

interface PaypalBillingAgreement {
	plan: {
		frequency: "monthly" | "semiannual";
	};
}

interface StripeContext {
	can_cancel: boolean;
	can_cancel_immediately: boolean;
	can_remove_payment_methods: boolean;
	coupon: string;
	credits: number;
	currency: string;
	default_source: string;
	has_upcoming_payment: boolean;
	invoices: Array<StripeInvoice>;
	next_payment_attempt: string;
	payment_methods: Array<StripePaymentMethod>;
	pending_charges: number;
	subscriptions: Array<StripeSubscription>;
}

interface StripeInvoice {
	amount_due: number;
	amount_paid: number;
	amount_remaining: number;
	closed: boolean;
	currency: string;
	date: string;
	forgiven: boolean;
	hosted_invoice_url: string;
	id: string;
	invoice_pdf: string;
	items: Array<string>;
	next_payment_attempt: string;
	number: string;
	paid: boolean;
	period_end: string;
	period_start: string;
	receipt_number: string;
	subtotal: number;
	total: number;
}

interface StripePaymentMethod {
	type: "source" | "legacy_card";
	id: string;
	name: string;
	brand: string;
	exp_month: number;
	exp_year: number;
	last4: string;
}

interface StripeSubscription {
	cancel_at_period_end: boolean;
	current_period_end: string;
	current_period_start: string;
	id: string;
	start: string;
	status: string;
	trial_end: string;
	trial_start: string;
	plan: {
		amount: number;
		id: string;
		name: string;
		price: string;
		frequency: "monthly" | "semiannual";
	};
}

interface Props extends WithTranslation {
	paypal: PaypalContext;
	stripe: StripeContext;
	urls: BillingUrls;
}

interface State {
	canceling: boolean;
	dueToSale: boolean;
}

class AccountBilling extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			canceling: false,
			dueToSale: false,
		};
	}
	public render(): React.ReactNode {
		const { stripe, t, urls } = this.props;

		if (
			this.state.canceling &&
			(stripe.can_cancel || stripe.can_cancel_immediately)
		) {
			const reasons: Array<[string, string]> = [
				["expensive", t("My financial situation has changed")],
				[
					"manual-renew",
					t("I prefer to manually renew my subscriptions"),
				],
				["wild", t("Not enough support for Wild")],
				["missing-features", t("It's missing features I want")],
				["mobile", t("I play only on mobile")],
				["not-useful", t("It's not useful for me")],
				["not-worth", t("It's not worth the price")],
				["stopped-playing", t("I have stopped playing Hearthstone")],
				["one-month", t("I only wanted to subscribe for one month")],
				["other", t("Other (please explain further):")],
			];
			return (
				<section id="account-billing-cancel" className="box-section">
					<h3>{t("Cancel subscription")}</h3>
					<div className="inner">
						<p>
							<Trans>
								HSReplay.net Premium directly funds the
								development of the site. We're sorry to see you
								go! If you are having a problem with the site,
								please{" "}
								<a href={`mailto:${SITE_EMAIL}`}>email us</a> or{" "}
								<a href="https://discord.gg/hearthsim">
									reach out on Discord
								</a>, we'll get you sorted out!
							</Trans>
						</p>

						<hr />
						<h4>{t("How can we improve?")}</h4>

						<p>
							{t(
								"Please help us understand why you are unsubscribing.",
							)}
						</p>

						<form
							method="POST"
							action={urls.cancel}
							className="premium-plan-form"
						>
							<CSRFElement />
							<ul>
								<Feature feature="semiannual-sale">
									<li className="checkbox">
										<label>
											<input
												type="checkbox"
												onChange={() =>
													this.setState({
														dueToSale: true,
													})
												}
											/>
											I want to upgrade to the 6 month
											plan due to the sale
										</label>
										{this.state.dueToSale ? (
											<p>
												<strong>
													Don't cancel here!
												</strong>{" "}
												<a
													href={`mailto:${SITE_EMAIL}`}
												>
													Please contact our support
													team
												</a>.
											</p>
										) : null}
									</li>
								</Feature>
								{reasons.map(reason => (
									<li className="checkbox" key={reason[0]}>
										<label>
											<input
												type="checkbox"
												name={`r-${reason[0]}`}
											/>{" "}
											{reason[1]}
										</label>
									</li>
								))}
							</ul>
							<h4>{t("Please explain further")}</h4>
							<textarea
								className="form-control"
								rows={5}
								name="r-more"
							/>
							<p className="text-muted">
								{t(
									"You will retain access to Premium features until the end of the purchased period.",
								)}
							</p>

							<p>
								{stripe.can_cancel ? (
									<button
										type="submit"
										name="cancel"
										value="at_period_end"
										className="btn btn-danger"
										onClick={e => {
											if (
												!confirm(
													t(
														"Your subscription will remain available for the period you paid for. Proceed?",
													),
												)
											) {
												e.preventDefault();
											}
										}}
									>
										{t("Cancel subscription")}
									</button>
								) : null}{" "}
								{stripe.can_cancel_immediately ? (
									<button
										type="submit"
										name="cancel"
										value="immediately"
										className="btn btn-danger"
										onClick={e => {
											if (
												!confirm(
													t(
														"Your subscription will be immediately terminated, no refund will be issued. Proceed?",
													),
												)
											) {
												e.preventDefault();
											}
										}}
									>
										{t("Cancel immediately")}
									</button>
								) : null}{" "}
								<button
									className="btn btn-info"
									onClick={e => {
										this.setState({ canceling: false });
										e.preventDefault();
									}}
								>
									{t("I changed my mind")}
								</button>
							</p>
						</form>
					</div>
				</section>
			);
		}

		return (
			<>
				{this.renderSubscriptionSection()}

				<section
					id="account-billing-payment-methods"
					className="box-section"
				>
					<h3>{t("Payment methods")}</h3>
					<div className="inner">
						{!stripe.default_source ? (
							<p className="alert alert-info">
								{t(
									"You do not have a default payment method set up.",
								)}
							</p>
						) : null}

						<p>
							<Trans>
								All credit card information is stored and
								handled by{" "}
								<a
									href="https://stripe.com/"
									target="_blank"
									rel="noopener"
								>
									Stripe
								</a>, our payment processor. HSReplay.net does
								not ever see your credit card number.
							</Trans>
						</p>
						{stripe.payment_methods ? (
							<ul id="account-billing-creditcard-list">
								{stripe.payment_methods.map(card => (
									<li
										className="creditcard"
										aria-label={t(
											"{ card_brand } ending in { card_last4 }",
											{
												card_brand: card.brand,
												card_last4: card.last4,
											},
										)}
										key={card.id}
									>
										{card.id === stripe.default_source ? (
											<span className="label label-success">
												{t("Default")}
											</span>
										) : null}
										<h4 className="card-title">
											{card.name}
										</h4>
										<time className="card-expiry">
											{t(
												"Expires {exp_month} / {exp_year}",
												{
													exp_month: card.exp_month,
													exp_year: card.exp_year,
												},
											)}
										</time>

										{stripe.can_remove_payment_methods ? (
											<form
												method="POST"
												action={urls.update_card}
												className="card-remove-form"
											>
												<CSRFElement />
												<input
													type="hidden"
													name="stripe_id"
													value={card.id}
												/>
												<button
													type="submit"
													name="delete"
													className="btn btn-danger"
												>
													{t("Remove card")}
												</button>{" "}
												{card.id !==
												stripe.default_source ? (
													<button
														type="submit"
														name="set_default"
														className="btn btn-primary"
													>
														{t("Set as default")}
													</button>
												) : null}
											</form>
										) : (
											<>
												<br />
												<em className="text-muted small">
													{t(
														"Cannot be removed while subscribed.",
													)}
												</em>
											</>
										)}
									</li>
								))}
							</ul>
						) : null}
						<hr />
						<h4>{t("Add a payment method")}</h4>
						<StripeElementsProvider>
							<StripeElementsAddCardForm
								action={urls.subscribe}
								currency={stripe.currency}
							/>
						</StripeElementsProvider>
					</div>
				</section>

				<section id="account-payment-history" className="box-section">
					<h3>{t("Payment history")}</h3>
					<div className="inner">
						{this.props.stripe.invoices ? (
							<>
								<table className="table table-striped">
									<thead>
										<tr>
											<th>{t("Invoice number")}</th>
											<th>{t("Date")}</th>
											<th>{t("Product")}</th>
											<th>{t("Status")}</th>
											<th>{t("Total")}</th>
										</tr>
									</thead>
									<tbody>
										{this.props.stripe.invoices.map(
											invoice => (
												<tr key={invoice.number}>
													<td>
														<a
															href={
																invoice.hosted_invoice_url ||
																"#"
															}
															target="_blank"
															rel="noopener"
														>
															{invoice.number}
														</a>
													</td>
													<td>
														<SemanticAge
															date={invoice.date}
														/>
													</td>
													<td>
														<ul className="list-unstyled">
															{invoice.items.map(
																item => (
																	<li
																		key={
																			item
																		}
																	>
																		{item}
																	</li>
																),
															)}
														</ul>
													</td>
													<td>
														{this.invoiceStatus(
															invoice,
														)}
													</td>
													<td>
														{invoice.total < 0 ? (
															<Trans
																defaults="{amountWithCurrency} <0>Credit</0>"
																components={[
																	<span className="label label-success">
																		0
																	</span>,
																]}
																tOptions={{
																	amountWithCurrency: this.currencyAmount(
																		invoice.total,
																		invoice.currency,
																	),
																}}
															/>
														) : (
															this.currencyAmount(
																invoice.total,
																invoice.currency,
															)
														)}
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
								<p className="help-block">
									{t(
										"Open payments are periodically retried using your default payment method.",
									)}
								</p>
							</>
						) : (
							<p>{t("You have no recorded payments.")}</p>
						)}
					</div>
				</section>
			</>
		);
	}

	public renderSubscriptionSection(): React.ReactNode {
		const { paypal, stripe, t, urls } = this.props;

		const sub = stripe.subscriptions ? stripe.subscriptions[0] : null;
		let subDescription = null;
		if (sub) {
			if (sub.status === "trialing") {
				subDescription = (
					<p>
						You are currently on a free trial, started on{" "}
						<time>{sub.trial_start}</time>. Your subscription begins
						on <strong>{sub.trial_end}</strong>.
					</p>
				);
			} else if (sub.status === "past_due") {
				subDescription = (
					<p className="alert alert-danger">
						{t(
							"Your membership is past due. You will not be able to use the Premium features until a successful payment.",
						)}
						<br />
						{stripe.next_payment_attempt ? (
							<>
								Next payment attempt:{" "}
								<SemanticAge
									date={stripe.next_payment_attempt}
								/>.
							</>
						) : null}
					</p>
				);
			} else {
				subDescription = (
					<p>
						<Trans>
							Your subscription started{" "}
							<SemanticAge date={sub.start} /> and will
							automatically renew{" "}
							<SemanticAge date={sub.current_period_end} />.{" "}
							Thanks for supporting us!
						</Trans>
					</p>
				);
			}
		}

		return (
			<section id="account-billing-plan" className="box-section">
				<h3>{t("HSReplay.net Premium")}</h3>
				<div className="inner">
					{sub ? (
						<>
							<h4>
								{sub.plan.name} ({sub.plan.price})
							</h4>

							{sub.cancel_at_period_end ? (
								<>
									<form
										method="POST"
										action={urls.subscribe}
										className="premium-plan-form"
									>
										<CSRFElement />
										<input
											type="hidden"
											name="plan"
											value={sub.plan.id}
										/>
										<button
											type="submit"
											className="btn btn-primary"
										>
											{t("Reactivate")}
										</button>
									</form>
									<p>
										Your subscription will cancel{" "}
										<SemanticAge
											date={sub.current_period_end}
										/>.
									</p>
								</>
							) : (
								<>
									{stripe.can_cancel ||
									stripe.can_cancel_immediately ? (
										<p className="premium-plan-form">
											<button
												className="btn btn-danger"
												onClick={e =>
													this.setState({
														canceling: true,
													})
												}
											>
												{t("Cancel subscription")}
											</button>
										</p>
									) : null}

									{subDescription}

									{sub.plan.amount > 0 &&
									!stripe.default_source ? (
										<p className="alert alert-danger">
											<strong>
												{t(
													"You are subscribed but do not have a default payment method set up. Your next payment will fail.",
												)}
												<br />
											</strong>
										</p>
									) : null}
								</>
							)}
						</>
					) : paypal.subscribed ? (
						<>
							{paypal.end_of_period ? (
								<p>
									Your Paypal subscription will cancel{" "}
									<SemanticAge date={paypal.end_of_period} />
								</p>
							) : (
								<p>
									{t(
										"You are currently subscribed using PayPal. Thanks for supporting us!",
									)}
								</p>
							)}

							<p className="alert alert-info">
								<Trans>
									PayPal plans cannot be managed directly from
									this page. To manage your subscription,{" "}
									<a
										href="https://paypal.com/"
										target="_blank"
									>
										sign in to PayPal
									</a>{" "}
									and go to{" "}
									<a
										href={urls.paypal_manage}
										target="_blank"
									>
										Manage preapproved payments
									</a>.
								</Trans>
							</p>
						</>
					) : (
						<p>
							<Trans>
								Subscribe to{" "}
								<a href="/premium/">HSReplay.net Premium</a> to
								support the site and get loads of new features.
							</Trans>
						</p>
					)}

					{stripe.coupon ? (
						<p className="alert alert-success">
							<Trans
								defaults="You have an active coupon for <0>{couponDescription}</0>. The amount will automatically be deducted from your next payment."
								components={[<strong key={0}>0</strong>]}
								tOptions={{
									couponDescription: stripe.coupon,
								}}
							/>
						</p>
					) : null}

					{stripe.pending_charges ? (
						<>
							<hr />
							<h4>{t("Pending charges")}</h4>
							<p>
								<Trans
									defaults="You have {amountWithCurrency} in pending charges.<0></0>These may be from a previous unattempted charge."
									tOptions={{
										amountWithCurrency: this.currencyAmount(
											stripe.pending_charges,
											stripe.currency,
										),
									}}
								/>
							</p>
						</>
					) : null}

					{stripe.credits ? (
						<>
							<hr />
							<h4>{t("Credits")}</h4>
							<p>
								<Trans
									defaults="Your account balance is {amountWithCurrency}."
									tOptions={{
										amountWithCurrency: this.currencyAmount(
											stripe.credits,
											stripe.currency,
										),
									}}
								/>
								<br />
								<em className="text-muted">
									{t(
										"When making a payment, these credits will be withdrawn first. Payments made using PayPal are not supported.",
									)}
								</em>
							</p>
						</>
					) : null}

					<hr />
					<p>
						{UserData.hasFeature("semiannual-sale") &&
						stripe.subscriptions &&
						stripe.subscriptions.some(
							s => s.plan.frequency === "monthly",
						) ? (
							<Trans
								defaults="Want to upgrade to a 6-months subscription for only {amount}? <0>Contact us</0>."
								components={[
									<a href={`mailto:${SITE_EMAIL}`} key={0}>
										0
									</a>,
								]}
								values={{
									amount: "$19.99 USD",
								}}
							/>
						) : (
							<Trans
								defaults="Don't hesitate to <0>contact us</0> if you have issues or questions!"
								components={[
									<a href={`mailto:${SITE_EMAIL}`} key={0}>
										0
									</a>,
								]}
							/>
						)}
					</p>
				</div>
			</section>
		);
	}

	public invoiceStatus(invoice: StripeInvoice): string {
		const { t } = this.props;

		if (invoice.paid) {
			return t("Paid");
		} else if (invoice.forgiven) {
			return t("Forgiven");
		} else if (invoice.closed) {
			return t("Closed");
		} else {
			return t("Open");
		}
	}

	public currencyAmount(amount: number, currency: string): string {
		return `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
	}
}

export default withTranslation()(AccountBilling);
