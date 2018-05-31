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
						for (let [key, tag] of Object.entries(point.tags)) {
							if (typeof tag === "boolean") {
								tag = !!tag ? "1" : "0";
							}
							if (typeof tag === "number") {
								tag = "" + tag;
							}
							tags.push(key + "=" + tag);
						}
						const values = [];
						for (let [key, value] of Object.entries(point.values)) {
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
							values.push(key + "=" + value);
						}
						return (
							point.series +
							(tags.length ? "," + tags.join(",") : "") +
							" " +
							values.join(",")
						);
					})
					.join("\n"),
			],
			{ type: "text/plain" },
		);
		let success = false;
		if (typeof navigator.sendBeacon === "function") {
			// try beacon api
			success = navigator.sendBeacon(url, blob);
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
