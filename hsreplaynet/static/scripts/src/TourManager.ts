import { cookie } from "cookie_js";
import * as Shepherd from "tether-shepherd";

export interface StepDefinition {
	id: string;
	[key: string]: any;
}

export default class TourManager {
	private tours = {};

	public createTour(
		name: string,
		steps: StepDefinition[],
		customDefaults?: object,
		force?: boolean
	): Shepherd.Tour {
		if (!force && this.hasSeen(name)) {
			// no need to show tours we've already seen
			return;
		}

		if (this.tours[name]) {
			return;
		}

		const defaultDefaults = {
			scrollTo: false,
			showCancelLink: true
		};
		const tourDefaults = Object.assign(
			{},
			defaultDefaults,
			customDefaults || {}
		);

		const tour = new Shepherd.Tour({
			defaults: tourDefaults
		});

		this.tours[name] = tour;

		steps.map((step: StepDefinition, index: number) => {
			const first = index === 0;
			const last = index === steps.length - 1;

			const buttons = [];
			const classes = [];
			const callbacks = [];

			if (!first) {
				buttons.push({
					text: "Back",
					classes: "btn btn-default",
					action: () => tour.back()
				});
			}
			if (last) {
				buttons.push({
					text: "Done",
					classes: "btn btn-success",
					action: () => tour.complete()
				});
			} else {
				buttons.push({
					text: "Next",
					classes: "btn btn-primary",
					action: () => tour.next()
				});
			}

			const id = step.id;
			delete step.id;

			// allow arrays for multiline text
			if (Array.isArray(step.text)) {
				step.text = step.text.join("<br />");
			}

			// add default classes
			if (!step.classes) {
				step.classes = "";
			} else {
				step.classes += " ";
			}
			step.classes += classes.join(" ");

			// add default buttons
			step = Object.assign({}, { buttons }, step);

			// callback for attachTo
			const attachCallback = null;
			if (typeof step.attachTo === "function") {
				callbacks.push(instance => {
					const result = step.attachTo();
					instance.options.attachTo =
						result && result.element ? result : null;
				});
			}

			tour.addStep(id, step);

			if (callbacks.length) {
				const stepInstance = tour.getById(id);
				stepInstance.on("before-show", () => {
					callbacks.forEach(callback => {
						callback(stepInstance);
					});
				});
			}
		});

		const saveAndDestroy = () => {
			this.markSeen(name);
			delete this.tours[name];
		};
		tour.on("complete", saveAndDestroy);
		tour.on("cancel", saveAndDestroy);

		tour.start();

		return tour;
	}

	public hasSeen(tour: string): boolean {
		const id = this.buildTourIdentifier(tour);
		return cookie.get(id, "0") !== "0";
	}

	public markSeen(tour: string): void {
		const id = this.buildTourIdentifier(tour);
		cookie.set(id, "1", { expires: 10 * 365 });
	}

	protected buildTourIdentifier(tour: string): string {
		return "tour_" + tour.toLowerCase() + "_seen";
	}
}
