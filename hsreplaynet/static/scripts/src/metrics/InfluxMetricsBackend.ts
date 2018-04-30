import { MetricsBackend, Point, Tags, Values } from "./MetricsBackend";
import Blob from "blob";

export default class InfluxMetricsBackend implements MetricsBackend {
	constructor(public url: string) {}

	public writePoints(points: Point[]) {
		const url = this.url;
		if (!points.length || !Blob || !url) {
			return;
		}
		const blob = new Blob(
			[
				points
					.map((point: Point) => {
						const tags = [];
						for (const tagKey in point.tags) {
							let tag = point.tags[tagKey];
							if (typeof tag === "boolean") {
								tag = !!tag ? "1" : "0";
							}
							if (typeof tag === "number") {
								tag = "" + tag;
							}
							tags.push(tagKey + "=" + tag);
						}
						const values = [];
						for (const valueKey in point.values) {
							let value = point.values[valueKey];
							if (typeof value === "boolean") {
								value = value ? "t" : "f";
							}
							if (
								typeof value === "string" &&
								!/^\d+i$/.exec(value) &&
								!/^".*"$/.exec(value)
							) {
								value = `"${value}"`;
							}
							values.push(valueKey + "=" + value);
						}
						const line =
							point.series +
							(tags.length ? "," + tags.join(",") : "") +
							" " +
							values.join(",");
						return line;
					})
					.join("\n"),
			],
			{ type: "text/plain" },
		);
		let success = false;
		if (navigator["sendBeacon"]) {
			// try beacon api
			success = (navigator as any).sendBeacon(url, blob);
		}
		if (!success) {
			// fallback to plain old XML http requests
			const request = new XMLHttpRequest();
			request.open("POST", url, true);
			request.withCredentials = false;
			request.send(blob);
		}
	}

	public writePoint(series: string, values: Values, tags?: Tags) {
		this.writePoints([{ series, values, tags }]);
	}
}
