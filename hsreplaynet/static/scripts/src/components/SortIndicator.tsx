import React from "react";
import { SortDirection } from "../interfaces";
import { useTranslation } from "react-i18next";

interface Props {
	className?: string;
	direction?: SortDirection | null;
}

const SortIndicator: React.FC<Props> = ({ className, direction }) => {
	let ascClassName = "glyphicon glyphicon-triangle-top";
	let descClassName = "glyphicon glyphicon-triangle-bottom";
	let wrapperClassName = className
		? className + " "
		: "" + "sort-indicator".trim();

	const { t } = useTranslation();

	if (direction !== null) {
		wrapperClassName += " primary";
		if (direction === "ascending") {
			ascClassName += " active";
		} else {
			descClassName += " active";
		}
	}

	return (
		<span className={wrapperClassName}>
			<span className={ascClassName} aria-hidden />
			<span className={descClassName} aria-hidden />
		</span>
	);
};

export default SortIndicator;
