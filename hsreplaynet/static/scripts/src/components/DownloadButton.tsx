import React from "react";
import { DeckTrackerEvents } from "../metrics/Events";

const DownloadButton: React.FC<{
	id: string;
	title: string;
	subtitle: string;
	icon: string;
	url: string | null;
	className?: string;
	target?: string;
}> = ({ id, title, subtitle, icon, url, className, target }) => (
	<a
		href={url}
		className={`btn download-button promo-button${url ? "" : " disabled"}${
			className ? " " + className : ""
		}`}
		onClick={() => DeckTrackerEvents.onDownload(id)}
		target={target || "_self"}
	>
		<h3>
			<i className={`fa fa-${icon}`} />
			{title}
		</h3>
		<p>{subtitle}</p>
	</a>
);

export default DownloadButton;
