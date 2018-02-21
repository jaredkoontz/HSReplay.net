import { MetricsBackend, Point } from "./MetricsBackend";

export default class BatchingMiddleware implements MetricsBackend {
	private backend: MetricsBackend;
	private points: Point[] = [];
	private interval: number = null;
	private finalCallback: () => void;
	private timeout: number = 15 * 1000;

	constructor(
		backend: MetricsBackend,
		finalCallback?: () => void,
		interval?: number
	) {
		this.backend = backend;
		this.finalCallback = finalCallback;
		if (interval) {
			this.timeout = interval;
		}
	}

	private _consume() {
		const points = this.points;
		this.points = [];
		this.backend.writePoints(points);
	}

	private _onPush() {
		if (this.interval) {
			return;
		}
		this.interval = window.setInterval(() => this._consume(), this.timeout);
		window.addEventListener("beforeunload", () => {
			if (this.finalCallback) {
				this.finalCallback();
			}
			this._consume();
		});
	}

	public writePoint(series: string, values: Object, tags?: Object) {
		const point: Point = {
			series,
			values
		};
		if (tags) {
			point.tags = tags;
		}
		this.points.push(point);
		this._onPush();
	}

	public writePoints(points: Point[]) {
		this.points = this.points.concat(points);
		this._onPush();
	}
}
