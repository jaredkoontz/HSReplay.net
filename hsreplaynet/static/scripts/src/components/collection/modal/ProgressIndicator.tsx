import React from "react";

interface Props {
	progress: number;
	total: number;
	"aria-labelledby"?: string;
}

export default class ProgressIndicator extends React.Component<Props> {
	public render(): React.ReactNode {
		if (this.props.total < 1) {
			return null;
		}

		const steps = [];
		for (let i = 0; i < this.props.total; i++) {
			const step = i + 1;
			const classNames = ["progress-indicator-step"];
			if (step <= this.props.progress) {
				classNames.push("active");
			}
			if (step === this.props.progress) {
				classNames.push("current");
			}
			steps[i] = <div key={step} className={classNames.join(" ")} />;
		}

		const progress = steps.reduce<React.ReactNode[]>(
			(prev, current, index) => {
				const step = index + 1;
				const classNames = ["progress-indicator-join"];
				if (step <= this.props.progress) {
					classNames.push("active");
				}
				if (prev.length > 0) {
					return prev.concat(
						<div
							key={`join-${index}`}
							className={classNames.join(" ")}
						/>,
						current,
					);
				}
				return [current];
			},
			[],
		);

		return (
			<div
				className="progress-indicator"
				role="progressbar"
				aria-valuenow={this.props.progress}
				aria-valuemin={1}
				aria-valuemax={this.props.total}
				aria-labelledby={this.props["aria-labelledby"]}
			>
				{progress}
			</div>
		);
	}
}
