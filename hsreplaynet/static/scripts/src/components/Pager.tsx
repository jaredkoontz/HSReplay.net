import React from "react";

interface Page {
	number?: number;
	active?: boolean;
	skip?: boolean;
}

interface Props {
	currentPage?: number;
	setCurrentPage?: (page: number) => void;
	pageCount?: number;
	minimal?: boolean;
}

export default class Pager extends React.Component<Props> {
	public render(): React.ReactNode {
		if (
			typeof this.props.pageCount === "number" &&
			this.props.pageCount <= 1
		) {
			return null;
		}

		const safeCurrentPage = this.getCurrentPage();

		const pages = [];
		let lastPage: number | null = null;
		for (const page of this.getPagesToShow()) {
			if (lastPage !== null && lastPage + 1 !== page) {
				pages.push({ skip: true });
			}

			pages.push({
				number: page,
				active: page === +safeCurrentPage,
			});

			lastPage = page;
		}

		const makeOnClick = (
			pageNumber: number,
			keyboard?: boolean,
		) => event => {
			if (keyboard && event.which !== 13) {
				return;
			}

			event.preventDefault();
			const target = event.currentTarget;
			if (target && !keyboard) {
				target.blur();
			}

			this.props.setCurrentPage(pageNumber);
		};

		const previous = safeCurrentPage - 1;
		const next = safeCurrentPage + 1;

		const action = (
			targetPage: number,
			children: any,
			additionalProps?: any,
		) => {
			const min = 1;
			const max = this.props.pageCount || null;

			let type = "span";

			const props = Object.assign(
				{
					className: "weight-normal",
				},
				additionalProps,
			);

			let disabled = true;
			if (targetPage >= min && (max === null || targetPage <= max)) {
				disabled = false;
			}

			if (!disabled) {
				type = "a";
				props["href"] = "#page=" + targetPage;
				props["onClick"] = makeOnClick(targetPage);
				props["onKeyDown"] = makeOnClick(targetPage, true);
			}

			return (
				<li className={disabled ? "disabled" : null}>
					{React.createElement(type, props, children)}
				</li>
			);
		};

		return (
			<nav className="btn-group">
				<ul className="pagination">
					{action(
						previous,
						<>
							<span className="glyphicon glyphicon-arrow-left" />
							<span
								className={
									"space-left" +
									(!this.props.minimal ? " hidden-lg" : "")
								}
							>
								Previous
							</span>
						</>,
						{ title: "Previous page" },
					)}
					{!this.props.minimal
						? pages.map((page: Page, index: number) => {
								let content = null;
								const classNames = ["visible-lg-inline"];

								const pageNumber = page.number;

								if (page.skip) {
									content = (
										<span className="transparent-background fixed-width">
											…
										</span>
									);
								} else {
									content = (
										<a
											href={"#page=" + pageNumber}
											onClick={makeOnClick(pageNumber)}
											onKeyDown={makeOnClick(
												pageNumber,
												true,
											)}
											className="fixed-width"
											aria-label={"Page " + pageNumber}
										>
											{pageNumber}{" "}
											{page.active ? (
												<span className="sr-only">
													(current)
												</span>
											) : null}
										</a>
									);
								}

								if (!content) {
									return null;
								}

								if (page.active) {
									classNames.push("active");
								}

								return (
									<li
										className={classNames.join(" ")}
										key={pageNumber || `spacing-${index}`}
									>
										{content}
									</li>
								);
						  })
						: null}
					{typeof this.props.pageCount === "number" &&
					this.props.pageCount ? (
						<li
							className={!this.props.minimal ? "hidden-lg" : null}
						>
							<span className="transparent-background">
								{safeCurrentPage + " / " + this.props.pageCount}
							</span>
						</li>
					) : null}
					{action(
						next,
						<>
							<span
								className={
									"space-right" +
									(!this.props.minimal ? " hidden-lg" : "")
								}
							>
								Next
							</span>
							<span className="glyphicon glyphicon-arrow-right" />
						</>,
						{ title: "Next page" },
					)}
				</ul>
			</nav>
		);
	}

	protected getCurrentPage(): number {
		let currentPage = +this.props.currentPage;
		if (isNaN(currentPage)) {
			return 1;
		}
		currentPage = Math.max(currentPage, 1);
		if (isNaN(+this.props.pageCount) || !this.props.pageCount) {
			return currentPage;
		}
		return Math.min(currentPage, this.props.pageCount);
	}

	protected getPagesToShow(): number[] {
		const min = 1;
		const max = this.props.pageCount || null;
		const range = 2;

		if (max === null) {
			return [];
		}

		const pivot = Math.min(
			Math.max(this.getCurrentPage(), min + 2 * range + 1),
			max - 2 * range - 1,
		);

		// always show these pages
		const pages = [min];

		if (max > 1) {
			pages.push(min + 1);
		}

		if (max > 2) {
			pages.push(max);
		}

		if (max > 3) {
			pages.push(max - 1);
		}

		for (let page = min; page <= max; page++) {
			if (Math.abs(page - pivot) > range) {
				continue;
			}

			if (page < min || page > max) {
				continue;
			}

			if (pages.indexOf(page) !== -1) {
				continue;
			}

			pages.push(page);
		}

		pages.sort((a, b) => a - b);

		// fill any holes with a width of one page
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			if (
				pages.indexOf(page - 2) !== -1 &&
				pages.indexOf(page - 1) === -1
			) {
				pages.splice(i, 0, page - 1);
			}
		}

		return pages;
	}
}
