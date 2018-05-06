import React from "react";
import Pager from "./Pager";

interface Props {
	body: any;
	hidden: boolean;
	close: () => void;
	currentPage?: number;
	setCurrentPage: (currentPage: number) => void;
	pageCount?: number;
}

export default class Lightbox extends React.Component<Props> {
	private ref: HTMLDivElement;

	constructor(props: Props, context?: any) {
		super(props, context);
	}

	public componentDidMount(): void {
		window.addEventListener("keydown", this.onKeyDown);
	}

	public componentWillUnmount(): void {
		window.addEventListener("keydown", this.onKeyDown);
	}

	protected onKeyDown = event => {
		if (this.props.hidden) {
			return;
		}
		switch (event.keyCode) {
			case 27: // escape
				event.preventDefault();
				this.props.close();
				break;
			case 32: // space bar
			case 39: // right arrow key
				event.preventDefault();
				if (this.props.currentPage >= this.props.pageCount) {
					return;
				}
				this.props.setCurrentPage(this.props.currentPage + 1);
				break;
			case 37: // left arrow key
				event.preventDefault();
				if (this.props.currentPage <= 1) {
					return;
				}
				this.props.setCurrentPage(this.props.currentPage - 1);
				break;
		}
	};

	public render(): React.ReactNode {
		if (this.props.hidden) {
			return null;
		}

		const hasNext = this.props.currentPage < this.props.pageCount;
		const hasPrevious = this.props.currentPage > 1;

		return (
			<div
				className={"lightbox-background"}
				ref={ref => (this.ref = ref)}
				onClick={event => {
					if (this.ref && event.target !== this.ref) {
						return;
					}

					event.preventDefault();

					this.props.close();
				}}
			>
				<div className="lightbox">
					<div className="close-link">
						<a
							href="#"
							onClick={event => {
								event.preventDefault();
								this.props.close();
							}}
						>
							<span className="glyphicon glyphicon-remove" />
						</a>
					</div>
					<div
						className={
							"lightbox-body" +
							(hasNext || hasPrevious ? " clickable" : "")
						}
						onClick={event => {
							event.preventDefault();
							let advance = true;
							// go back if we're left of the middle
							const x = event.pageX;
							if (x > 0 && x < window.innerWidth / 2) {
								advance = false;
							}
							if (advance) {
								if (hasNext) {
									this.props.setCurrentPage(
										this.props.currentPage + 1,
									);
								}
							} else if (hasPrevious) {
								this.props.setCurrentPage(
									this.props.currentPage - 1,
								);
							}
						}}
						dangerouslySetInnerHTML={this.props.body}
					/>
					<p className="lightbox-pagination text-center">
						<Pager
							currentPage={this.props.currentPage}
							setCurrentPage={this.props.setCurrentPage}
							pageCount={this.props.pageCount}
						/>
					</p>
				</div>
			</div>
		);
	}
}
