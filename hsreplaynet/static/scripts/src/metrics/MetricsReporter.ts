import { MetricsBackend, Tags, Values } from "./MetricsBackend";

export default class MetricsReporter {
	protected prefixer: (series: string) => string;
	protected tagger: (tags: Tags) => Tags;

	constructor(
		public backend: MetricsBackend,
		prefix?: string | ((series: string) => string),
		tags?: { [tag: string]: string },
	) {
		let prefixer = null;
		if (typeof prefix === "function") {
			prefixer = prefix;
		} else if (typeof prefix === "string") {
			prefixer = (series: string) => prefix + series;
		} else {
			prefixer = (series: string) => series;
		}
		this.prefixer = prefixer;

		let tagger = null;
		if (typeof tags === "function") {
			tagger = tags;
		} else if (typeof tags === "object") {
			tagger = (t: Tags) => Object.assign({}, tags, t);
		} else {
			tagger = (t: Tags) => t;
		}
		this.tagger = tagger;
	}

	public writePoint(series: string, values: Values, tags?: Tags): void {
		this.backend.writePoint(
			this.prefixer(series),
			values,
			this.tagger(tags || {}),
		);
	}
}
