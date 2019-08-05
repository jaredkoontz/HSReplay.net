import React from "react";
import AdHelper from "../../AdHelper";
import { fetchCSRF } from "../../helpers";

interface Props {
	id: string;
	uniqueId: string;
	width: number | [number, number];
	height: number | [number, number];
}

interface State {
	working: boolean;
	enabled: boolean;
}

export default class AdUnitAdmin extends React.Component<Props, State> {
	constructor(props: Readonly<Props>) {
		super(props);
		this.state = {
			working: false,
			enabled: AdHelper.isAdEnabled(props.uniqueId, true),
		};
	}

	private onClick = async (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		this.toggle(!this.state.enabled);
	};

	private onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		this.toggle(e.target.checked);
	};

	private async toggle(enable: boolean): Promise<void> {
		this.setState({ working: true });
		try {
			await new Promise(resolve => setTimeout(resolve, 500));
			const response = await fetchCSRF(
				`/api/v1/ads/${this.props.uniqueId}/`,
				{
					body: JSON.stringify({ enabled: enable }),
					credentials: "same-origin",
					headers: {
						"Content-Type": "application/json",
					},
					method: "PATCH",
				},
			);
			if (!response.ok) {
				throw new Error("Unable to make changes to ad");
			}
			const outcome = await response.json();
			if ("enabled" in outcome) {
				this.setState(state => ({
					...state,
					enabled: outcome["enabled"],
				}));
			}
		} finally {
			this.setState(state => ({ ...state, working: false }));
		}
	}

	public render(): React.ReactNode {
		const { id, uniqueId, width, height } = this.props;

		const displayWidth: number = Array.isArray(width)
			? Math.max(...width)
			: width;
		const displayHeight: number = Array.isArray(height)
			? Math.max(...height)
			: height;

		const classNames = ["ad-unit__admin"];

		if (this.state.enabled) {
			classNames.push("ad-unit__admin--enabled");
		}

		if (this.state.working) {
			classNames.push("ad-unit__admin--working");
		}

		const minWidth = Array.isArray(width) ? Math.min(...width) : width;
		const maxWidth = Array.isArray(width) ? Math.max(...width) : width;
		const minHeight = Array.isArray(height) ? Math.min(...height) : height;
		const maxHeight = Array.isArray(height) ? Math.max(...height) : height;

		const from = `${minWidth}×${minHeight}`;
		const to = `${maxWidth}×${maxHeight}`;

		return (
			<div
				className={classNames.join(" ")}
				onClick={this.onClick}
				style={{
					width: `${maxWidth}px`,
					height: `${maxHeight}px`,
				}}
			>
				<input
					type="checkbox"
					checked={this.state.enabled}
					disabled={this.state.working}
					onChange={this.onChange}
				/>
				<p>
					#{id} ({uniqueId})
				</p>
				<p>
					{from === to ? (
						from
					) : (
						<>
							{from} / {to}
						</>
					)}
				</p>
			</div>
		);
	}
}
