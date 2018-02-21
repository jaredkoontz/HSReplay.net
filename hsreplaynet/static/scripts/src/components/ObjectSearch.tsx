import React from "react";

export const enum Limit {
	SINGLE,
	DOUBLE,
	UNLIMITED
}

interface Props<T> {
	getFilteredObjects: (query: string) => T[];
	getObjectElement: (object: T, count?: number) => JSX.Element;
	getObjectKey: (object: T) => string;
	id: string;
	noDataText: string;
	objectLimit?: Limit;
	placeholder: string;
	sorting: (a: T, b: T) => number;
	label?: string;
	onPaste?: (e: any) => any;
	showOnFocus?: boolean;
	selectedObjects?: T[];
	onObjectsChanged?: (objects: T[]) => void;
	onObjectSelected?: (object: T) => void;
	getMaxCount?: (object: T) => number;
}

interface State {
	searchCount?: number;
	searchText?: string;
	selectedIndex?: number;
	showSearchResults?: boolean;
}

export default class ObjectSearch<T> extends React.Component<Props<T>, State> {
	readonly defaultCount = 10;
	private search: HTMLDivElement;
	private input: HTMLInputElement;
	private objectList: HTMLUListElement;

	constructor(props: Props<T>, context: any) {
		super(props, context);
		this.state = {
			searchCount: this.defaultCount,
			searchText: "",
			selectedIndex: 0,
			showSearchResults: false
		};
	}

	public render(): React.ReactNode {
		const objects = [];
		const matches = this.props.getFilteredObjects(this.state.searchText);
		matches
			.slice(0, this.state.searchCount)
			.forEach((object: T, index: number) => {
				const selected = this.state.selectedIndex === index;
				objects.push(
					<li
						className={selected ? "selected" : undefined}
						key={this.props.getObjectKey(object)}
						onMouseDown={event => {
							if (event.button !== 0) {
								event.preventDefault();
								return;
							}
							this.objectSelected(object);
						}}
						onMouseEnter={() =>
							this.setState({ selectedIndex: index })
						}
					>
						{this.props.getObjectElement(object)}
					</li>
				);
			});

		if (this.state.searchText && !matches.length) {
			objects.push(
				<li>
					<div className="search-message">
						{this.props.noDataText}
					</div>
				</li>
			);
		}

		const onSearchScroll = (event: React.UIEvent<HTMLDivElement>) => {
			if (
				event.target["scrollTop"] + 200 >=
				event.target["scrollHeight"]
			) {
				if (matches.length > this.state.searchCount) {
					this.setState({
						searchCount: this.state.searchCount + this.defaultCount
					});
				}
			}
		};

		let searchResults = null;
		if (this.state.showSearchResults) {
			if (
				this.props.showOnFocus ||
				(objects.length && this.state.searchText.length)
			) {
				searchResults = (
					<div
						className="object-search-results"
						onScroll={onSearchScroll}
						ref={search => (this.search = search)}
					>
						<ul ref={ref => (this.objectList = ref)}>{objects}</ul>
					</div>
				);
			}
		}

		let clear = null;
		if (this.state.searchText) {
			clear = (
				<span
					className="glyphicon glyphicon-remove form-control-feedback"
					onClick={() => this.setState({ searchText: "" })}
				/>
			);
		}

		let selectedObjects = null;
		if (this.props.selectedObjects) {
			selectedObjects = <ul>{this.getSelectedObjects()}</ul>;
		}

		return (
			<div className="object-search search-wrapper">
				<div className="form-group has-feedback">
					<input
						id={this.props.id}
						aria-labelledby={this.props.label}
						ref={input => (this.input = input)}
						className="form-control"
						type="search"
						placeholder={this.props.placeholder}
						onFocus={() =>
							this.setState({ showSearchResults: true })
						}
						onClick={() =>
							this.setState({ showSearchResults: true })
						}
						onBlur={() =>
							this.setState({ showSearchResults: false })
						}
						value={this.state.searchText}
						onChange={e =>
							this.setState({
								searchText: e.target["value"],
								selectedIndex: 0
							})
						}
						onKeyDown={e => this.onKeyDown(e, objects.length)}
						aria-autocomplete="list"
						onPaste={this.props.onPaste}
					/>
					{clear}
				</div>
				{searchResults}
				{selectedObjects}
			</div>
		);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props<T>>,
		prevState: Readonly<State>,
		prevContext: any
	): void {
		if (prevState.searchText !== this.state.searchText) {
			if (this.search) {
				this.search["scrollTop"] = 0;
			}
		}
	}

	objectSelected(object: T): void {
		if (this.props.onObjectSelected) {
			this.props.onObjectSelected(object);
		}
		if (this.props.onObjectsChanged) {
			const selected = this.props.selectedObjects || [];
			if (selected.indexOf(object) === -1) {
				const newSelectedObjects = selected.concat([object]);
				newSelectedObjects.sort(this.props.sorting);
				this.props.onObjectsChanged(newSelectedObjects);
			}
		}
		this.setState({
			searchCount: this.defaultCount,
			showSearchResults: false,
			searchText: "",
			selectedIndex: 0
		});
	}

	onKeyDown(
		event: React.KeyboardEvent<HTMLInputElement>,
		numObjects: number
	): void {
		let height = 35;
		if (
			this.objectList &&
			this.objectList.children &&
			this.objectList.children.length
		) {
			const child = this.objectList.children[0];
			const bounds = child.getBoundingClientRect();
			height = bounds.height - 1;
		}
		let valid = true;
		switch (event.key) {
			case "ArrowDown":
				if (!this.search) {
					return;
				}
				this.setState({
					showSearchResults: true,
					selectedIndex: Math.min(
						numObjects - 1,
						this.state.selectedIndex + 1
					)
				});
				if (this.search["scrollTop"] === 0) {
					this.search["scrollTop"] += 5;
				}
				this.search["scrollTop"] += height;
				break;
			case "ArrowUp":
				if (!this.search) {
					return;
				}
				this.setState({
					showSearchResults: true,
					selectedIndex: Math.max(0, this.state.selectedIndex - 1)
				});
				this.search["scrollTop"] -= height;
				break;
			case "Enter":
				if (!this.state.showSearchResults) {
					return;
				}
				const filteredObjects = this.props.getFilteredObjects(
					this.state.searchText
				);
				if (!filteredObjects.length) {
					return;
				}
				this.objectSelected(filteredObjects[this.state.selectedIndex]);
				break;
			case "Escape":
				this.setState({ showSearchResults: false });
				break;
			default:
				valid = false;
				this.setState({ showSearchResults: true });
				break;
		}
		if (valid) {
			event.preventDefault();
		}
	}

	getSelectedObjects(): JSX.Element[] {
		if (!this.props.selectedObjects) {
			return null;
		}

		const objects = {};
		this.props.selectedObjects.forEach((object: T) => {
			const key = this.props.getObjectKey(object);
			if (typeof objects[key] !== "undefined") {
				objects[key].count++;
			} else {
				objects[key] = {
					object,
					count: 1
				};
			}
		});

		return Object.keys(objects).map(key => {
			const object = objects[key].object;
			const count = objects[key].count;
			const updateObject = (newValue: number) => {
				let updatedCount = count;
				let newSelectedObjects = this.props.selectedObjects.slice(0);
				while (updatedCount < newValue) {
					newSelectedObjects.push(object);
					updatedCount++;
				}
				while (updatedCount > newValue) {
					let index = this.props.selectedObjects.lastIndexOf(object);
					newSelectedObjects.splice(index, 1);
					updatedCount--;
				}
				this.props.onObjectsChanged(newSelectedObjects);
			};

			const maxCount = this.props.getMaxCount
				? this.props.getMaxCount(object)
				: 1;

			return (
				<li>
					{this.props.getObjectElement(object, count)}
					<button
						onClick={() => updateObject(count - 1)}
						className="btn btn-danger"
					>
						<span className={"glyphicon glyphicon-minus"} />
					</button>
					{this.props.objectLimit !== Limit.SINGLE ? (
						<button
							onClick={() => updateObject(count + 1)}
							className="btn btn-primary"
							disabled={maxCount > 0 && count + 1 > maxCount}
						>
							<span className="glyphicon glyphicon-plus" />
						</button>
					) : null}
				</li>
			);
		});
	}
}
