export default class CheckoutProcess {
	public readonly plan: string;
	public readonly handler: StripeCheckoutHandler;
	public readonly label: string;
	public onstart: () => void;
	private promise: Promise<stripe.StripeTokenResponse>;

	constructor(plan, handler: StripeCheckoutHandler, label?: string) {
		this.plan = plan;
		this.handler = handler;
		this.label = label;
	}

	public checkout(options?: StripeCheckoutOptions) {
		if (this.promise) {
			return this.promise;
		}
		let resolved = false;
		this.promise = new Promise((resolve, reject) => {
			const dollars = options.amount
				? Math.ceil(options.amount / 100)
				: null;
			options = Object.assign({}, options, {
				token: (token: stripe.StripeTokenResponse): void => {
					resolved = true;
					this.trackInteraction("subscribe", dollars).then(() => {
						resolve(token);
					});
				},
				opened: () => {
					if (this.onstart) {
						this.onstart();
					}
					this.trackInteraction("open", dollars);
				},
				closed: () => {
					if (resolved) {
						return;
					}
					this.trackInteraction("close", dollars).then(() => {
						reject();
					});
				},
			});
			this.handler.open(options);
		});
		return this.promise;
	}

	private trackInteraction(action: string, value?: any): Promise<{}> {
		return new Promise((resolve, reject) => {
			if (typeof ga !== "function") {
				resolve();
				return;
			}
			ga("send", {
				hitType: "event",
				eventCategory: "Checkout",
				eventAction: action,
				eventLabel: this.label,
				eventValue: value,
				hitCallback: () => resolve(),
				nonInteraction: false,
			});
			setTimeout(() => resolve(), 2000);
		});
	}
}
