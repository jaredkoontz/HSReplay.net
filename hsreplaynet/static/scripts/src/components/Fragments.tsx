import React from "react";
import * as _ from "lodash";
import { capitalize } from "../helpers";

const TRUE_STRING = "yes";
const FALSE_STRING = "no";

interface FragmentMap {
	[key: string]: any;
}

interface InternalFragmentMap {
	[key: string]: string;
}

interface Props {
	defaults: FragmentMap;
	debounce?: string | string[];
	immutable?: string | string[];
	delay?: number;
	keepDefaults?: boolean;
}

interface State {
	childProps: FragmentMap;
	intermediate: InternalFragmentMap;
}

/**
 * This component maps url fragments (such as index.html#a=1&b=2) to it's child's props.
 * A default key pageNumber:1 will result in the props pageNumber:1 and setPageNumber:(newPageNumber).
 */
export default class Fragments extends React.Component<Props, State> {
	private listener: any | null;
	private timeout: any | null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			childProps: this.getParts(), // populate with initial url parts
			intermediate: {},
		};
		this.listener = null;
		this.timeout = null;
	}

	public reset(key?: string): void {
		let childProps = {};
		if (key) {
			childProps = Object.assign({}, this.state.childProps);
			delete childProps[key];
		}
		this.setState({ childProps });
	}

	public render(): React.ReactNode {
		let props = {};

		const values = Object.assign(
			{},
			this.props.defaults,
			this.state.childProps,
		);
		for (const key in values) {
			const suffix = capitalize(key);
			// prepare the callback
			const callback = this.isDebounced(key)
				? (
						value: any,
						debounce?: boolean,
						callback?: () => void,
				  ): void => {
						this.onChange(key, value, debounce, callback);
				  }
				: (value: any, callback?: () => void): void => {
						this.onChange(key, value, undefined, callback);
				  };
			const callbackKey = "set" + suffix;
			// assign the props
			props[key] = this.cast(
				key,
				typeof this.state.intermediate[key] !== "undefined"
					? this.state.intermediate[key]
					: values[key],
			);
			props[callbackKey] = callback;
			if (this.isArray(key)) {
				props["toggle" + suffix] = (
					value: any,
					callback?: () => void,
				): void => {
					this.onToggle(key, value, callback);
				};
			}
			props["default" + suffix] = this.cast(
				key,
				this.props.defaults[key],
			);
			props["custom" + suffix] =
				typeof this.state.childProps[key] !== "undefined"
					? this.cast(key, this.state.childProps[key])
					: null;
		}

		props = Object.assign({}, props, {
			canBeReset: Object.keys(this.state.childProps).length > 0,
			reset: (key?) => this.reset(key),
		});

		return React.cloneElement(this.props.children as any, props);
	}

	onChange(
		key: string,
		value: any,
		debounce?: boolean,
		callback?: () => void,
	): void {
		if (!this.isValidKey(key)) {
			console.error(
				`Attempted to change undefined fragment key "${key}"`,
			);
			return;
		}

		if (this.isImmutable(key)) {
			return;
		}

		if (typeof debounce === "undefined") {
			debounce = this.isDebounced(key);
		}

		if (
			!this.props.keepDefaults &&
			_.isEqual(value, this.props.defaults[key])
		) {
			value = null;
		}

		if (debounce) {
			const intermediate = Object.assign({}, this.state.intermediate, {
				[key]: this.stringify(key, value),
			});
			this.setState({ intermediate });
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(() => {
				this.timeout = null;
				for (const key in this.state.intermediate) {
					this.onChange(
						key,
						this.state.intermediate[key],
						false,
						callback,
					);
				}
			}, this.props.delay || 100);
		} else {
			this.setState((prevState: State) => {
				let newProps = {};
				if (value === null) {
					newProps = Object.assign(newProps, prevState.childProps);
					delete newProps[key];
				} else {
					newProps = Object.assign(newProps, prevState.childProps, {
						[key]: this.stringify(key, value),
					});
				}
				return {
					childProps: newProps,
					intermediate: {},
				};
			}, callback);
		}
	}

	onToggle(key: string, value: any, callback?: () => void): void {
		if (!this.isArray(key)) {
			console.error(`Cannot toggle non-array "${key}"`);
			return;
		}
		let targetArray = this.cast(key, this.state.childProps[key]);
		if (targetArray.indexOf(value) !== -1) {
			targetArray = targetArray.filter(x => x !== value);
		} else {
			targetArray.push(value);
		}
		this.onChange(key, targetArray, undefined, callback);
	}

	cast(key: string, value: any): any {
		if (this.isArray(key)) {
			if (!value) {
				value = [];
			}
			if (typeof value === "string") {
				value = value.split(",");
			}
			return value;
		}

		switch (typeof this.props.defaults[key]) {
			case "number":
				value = +value;
				break;
			case "string":
				value = "" + value;
				break;
			case "boolean":
				value = value === TRUE_STRING || value == true;
				break;
		}
		return value;
	}

	stringify(key: string, value: any): string {
		if (this.isArray(key)) {
			if (Array.isArray(value)) {
				value = value.join(",");
			}
		}

		const defaultValue = this.props.defaults[key];

		switch (typeof this.props.defaults[key]) {
			case "boolean":
				value = value ? TRUE_STRING : FALSE_STRING;
				break;
			case "string":
				if (this.isNullOrEmpty(value) && this.isNullOrEmpty(defaultValue)) {
					return "";
				}
				break;
		}

		if (value === defaultValue) {
			return "";
		}

		return "" + value;
	}

	isArray(key: string): boolean {
		return Array.isArray(this.props.defaults[key]);
	}

	isNullOrEmpty(value: string): boolean {
		return value === null || value === undefined || value === "";
	}

	isDebounced(key: string): boolean {
		let keys = this.props.debounce;
		if (!Array.isArray(keys)) {
			keys = [keys];
		}
		return keys.indexOf(key) !== -1;
	}

	isImmutable(key: string): boolean {
		let keys = this.props.immutable;
		if (!Array.isArray(keys)) {
			keys = [keys];
		}
		return keys.indexOf(key) !== -1;
	}

	public componentDidMount(): void {
		this.listener = window.addEventListener("hashchange", () => {
			this.setState({ childProps: this.getParts() });
		});
	}

	public componentWillUnmount(): void {
		window.removeEventListener("hashchange", this.listener);
		this.listener = null;
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			!_.isEqual(nextProps, this.props) ||
			!_.isEqual(nextState, this.state)
		);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (!window || !window.location) {
			return;
		}

		const hash = window.location.hash;

		const parts = Object.assign({}, Fragments.parseFragmentString(hash));

		// find ones that we're added or changed
		for (const key of Object.keys(this.state.childProps)) {
			const value = this.state.childProps[key];
			if (value) {
				parts[key] = value;
			} else {
				delete parts[key];
			}
		}

		// find ones that were removed
		for (const key of Object.keys(prevState.childProps)) {
			if (
				typeof this.state.childProps[key] === "undefined" &&
				typeof parts[key] !== "undefined"
			) {
				delete parts[key];
			}
		}

		const hasData = Object.keys(parts).length > 0;
		const fragments = Fragments.encodeFragmentString(parts);

		if (fragments === hash) {
			return;
		}

		if (!hasData && !hash) {
			return;
		}

		window.location.replace(fragments);

		if (!hasData && typeof history !== "undefined") {
			// hide the hash in the url if supported
			history.replaceState(
				"",
				document.title,
				window.location.pathname + window.location.search,
			);
		}
	}

	isValidKey(key: string): boolean {
		return typeof this.props.defaults[key] !== "undefined";
	}

	getPart(key: string): string {
		if (!this.isValidKey(key)) {
			console.error(`Refusing to return fragment part "${key}"`);
			return;
		}
		if (!window || !window.location) {
			return "";
		}
		const parts = Fragments.parseFragmentString(window.location.hash);
		return parts[key] || "";
	}

	// returns the parts of the fragment that are relevant
	getParts(): FragmentMap {
		if (!window || !window.location) {
			return {};
		}
		const parts = Fragments.parseFragmentString(window.location.hash);
		const map = {};
		for (const key of Object.keys(parts)) {
			if (!this.isValidKey(key)) {
				continue;
			}
			if (this.isImmutable(key)) {
				continue;
			}
			map[key] = parts[key];
		}
		return map;
	}

	static parseFragmentString(fragment: string): FragmentMap {
		const result = {};
		if (fragment.startsWith("#") && fragment.indexOf("=") !== -1) {
			fragment = fragment.substr(1);
			for (const part of fragment.split("&")) {
				const atoms = part.split("=");
				const key = decodeURIComponent(atoms[0]);
				const value = decodeURIComponent(atoms.slice(1).join(""));
				result[key] = value;
			}
		}
		return result;
	}

	static encodeFragmentString(map: FragmentMap): string {
		let fragment = "#_";

		const parts = [];
		for (const key in map) {
			parts.push(
				encodeURIComponent(key) + "=" + encodeURIComponent(map[key]),
			);
		}

		if (parts.length) {
			fragment = "#" + parts.join("&");
		}

		return fragment;
	}
}
