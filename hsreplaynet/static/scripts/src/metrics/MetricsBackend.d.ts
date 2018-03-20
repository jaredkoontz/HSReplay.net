export interface Point {
	series: string;
	values: Values;
	tags?: Tags;
}

interface Values {
	[value: string]: any;
}

interface Tags {
	[tag: string]: string;
}

export interface MetricsBackend {
	writePoint(series: string, values: Values, tags?: Tags);
	writePoints(points: Point[]);
}
