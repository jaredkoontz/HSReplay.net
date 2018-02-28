import { MetricsBackend } from "./MetricsBackend";

export default class MetricsReporter {
	protected prefixer: (series: string) => string;

	constructor(
		public backend: MetricsBackend,
		prefix?: string | ((series: string) => string),
	) {
		let prefixer = null;
		if (!prefix) {
			prefixer = (series: string) => series;
		} else if (typeof prefix === "string") {
			prefixer = (series: string) => prefix + series;
		} else {
			prefixer = prefix;
		}
		this.prefixer = prefixer;
	}

	public writePoint(series: string, values: Object, tags?: Object): void {
		this.backend.writePoint(this.prefixer(series), values, tags);
	}
}
