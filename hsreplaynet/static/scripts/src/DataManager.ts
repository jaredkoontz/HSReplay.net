export default class DataManager {
	private static readonly cache = {};
	private static readonly responses = {};
	private static readonly running = {};

	private static genCacheKey(
		url: string,
		params: { [param: string]: string }
	): string {
		const paramStrings = [];
		Object.keys(params).forEach(key => {
			const value = params[key];
			if (value !== undefined && value !== null) {
				paramStrings.push(key + value);
			}
		});
		return this.cleanUrl(url) + paramStrings.sort().join("");
	}

	private static fullUrl(
		url: string,
		params: { [param: string]: string }
	): string {
		url = this.cleanUrl(url);
		const keys = params ? Object.keys(params) : [];
		const query = keys.reduce((prev, key, i) => {
			return (
				prev +
				(i > 0 ? "&" : "?") +
				encodeURIComponent(key) +
				"=" +
				encodeURIComponent(params[key])
			);
		}, "");

		return url + query;
	}

	private static cleanUrl(url: string): string {
		url = url.startsWith("/") ? url : "/analytics/query/" + url;
		if (!url.endsWith("/")) {
			url += "/";
		}
		return url;
	}

	static get(
		url: string,
		params?: { [param: string]: string },
		noCache?: boolean
	): Promise<any> {
		const cacheKey = this.genCacheKey(url, params || {});
		const headers = new Headers();
		if (noCache) {
			headers.append("pragma", "no-cache");
			headers.append("cache-control", "no-cache");
		} else {
			if (this.responses[cacheKey] === 200) {
				return Promise.resolve(this.cache[cacheKey]);
			}
			if (this.responses[cacheKey]) {
				return Promise.reject(this.responses[cacheKey]);
			}
			if (this.running[cacheKey]) {
				return this.running[cacheKey];
			}
		}
		const promise = fetch(this.fullUrl(url, params || {}), {
			credentials: "include",
			headers
		}).then((response: Response) => {
			if (response.status === 200) {
				this.cache[cacheKey] = response.json();
			}
			if (response.status !== 202) {
				this.responses[cacheKey] = response.status;
			}
			this.running[cacheKey] = undefined;
			return this.cache[cacheKey] || Promise.reject(response.status);
		});
		this.running[cacheKey] = promise;
		return promise;
	}

	static has(url: string, params?: any): boolean {
		return this.cache[this.genCacheKey(url, params || {})] !== undefined;
	}
}
