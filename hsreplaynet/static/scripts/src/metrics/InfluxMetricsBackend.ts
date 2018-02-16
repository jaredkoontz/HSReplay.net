import { MetricsBackend, Point } from "./MetricsBackend";
import Blob from "blob";

export default class InfluxMetricsBackend implements MetricsBackend {
	constructor(public url: string) {}

	public writePoints(points: Point[]) {
		if (!points.length) {
			return;
		}
		let url = this.url;
		if (!Blob) {
			return;
		}
		let blob = new Blob(
			[
				points
					.map(function(point) {
						let tags = [];
						for (let tagKey in point.tags) {
							let tag = point.tags[tagKey];
							if (typeof tag === "boolean") {
								tag = !!tag ? 1 : 0;
							}
							if (typeof tag === "number") {
								tag = "" + tag;
							}
							tags.push(tagKey + "=" + tag);
						}
						let values = [];
						for (let valueKey in point.values) {
							let value = point.values[valueKey];
							if (typeof value === "boolean") {
								value = value ? "t" : "f";
							}
							values.push(valueKey + "=" + value);
						}
						let line =
							point.series +
							(tags.length ? "," + tags.join(",") : "") +
							" " +
							values.join(",");
						return line;
					})
					.join("\n")
			],
			{ type: "text/plain" }
		);
		let success = false;
		if (navigator["sendBeacon"]) {
			// try beacon api
			success = (navigator as any).sendBeacon(url, blob);
		}
		if (!success) {
			// fallback to plain old XML http requests
			let request = new XMLHttpRequest();
			request.open("POST", url, true);
			request.withCredentials = false;
			request.send(blob);
		}
	}

	public writePoint(series: string, values: Object, tags?: Object) {
		this.writePoints([{ series: series, values: values, tags: tags }]);
	}
}
