import React from "react";

export interface Btn {
	label: string | JSX.Element;
	value: string;
	id?: string;
	className?: string;
	"aria-labelledby"?: any;
	disabled?: boolean;
}

interface Props {
	name: string;
	id?: string;
	buttons: Btn[];
	value: string | null;
	disabled?: boolean;
	className?: string;
	onChange?: (button: any) => void;
	required?: boolean;
}

export default class BtnGroup extends React.Component<Props> {
	btnRefs: { [value: string]: HTMLElement };

	constructor(props: Props, context?: any) {
		super(props, context);
		this.btnRefs = {};
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<{}>,
		prevContext: any,
	): void {
		if (prevProps.value !== this.props.value) {
			const prevBtn = this.btnRefs[prevProps.value];
			const currentBtn = this.btnRefs[this.props.value];
			if (prevBtn === document.activeElement) {
				currentBtn && currentBtn.focus();
			}
		}
	}

	renderButtons() {
		const onClick = (btn: Btn) =>
			this.props.disabled || btn.disabled
				? null
				: event => {
						event.preventDefault();
						this.props.onChange && this.props.onChange(btn.value);
				  };

		const availableValues = this.props.buttons.map((btn: Btn) => btn.value);
		const noneChecked = this.props.value === null;

		return this.props.buttons.map((btn: Btn, i: number) => {
			const disabled = this.props.disabled || btn.disabled;
			const selected = this.props.value === btn.value;
			const classNames = [""];
			if (selected) {
				classNames.push("active");
			}
			if (disabled) {
				classNames.push("disabled");
			}
			return (
				<label
					id={btn.id}
					className={btn.className + classNames.join(" ")}
					onClick={onClick(btn)}
					onKeyDown={
						disabled
							? null
							: e => {
									const { keyCode } = e;
									if (keyCode === 38 || keyCode === 37) {
										e.preventDefault();
										this.props.onChange(
											availableValues[Math.max(i - 1, 0)],
										);
										return;
									}
									if (keyCode === 40 || keyCode === 39) {
										e.preventDefault();
										this.props.onChange(
											availableValues[
												Math.min(
													i + 1,
													availableValues.length - 1,
												)
											],
										);
										return;
									}
									if (keyCode === 32) {
										e.preventDefault();
										this.props.onChange(availableValues[i]);
										return;
									}
							  }
					}
					tabIndex={!disabled && (selected || noneChecked) ? 0 : -1}
					ref={ref => (this.btnRefs[btn.value] = ref)}
					role="radio"
					aria-checked={selected}
					aria-disabled={disabled}
				>
					{btn.label}
					<input
						type="radio"
						name={this.props.name}
						value={btn.value}
						checked={this.props.value === btn.value}
						onChange={onClick(btn)}
						required={this.props.required}
						tabIndex={-1}
						style={{
							position: "absolute",
							clip: "rect(0,0,0,0)",
							height: "0px",
							pointerEvents: "none",
						}}
					/>
				</label>
			);
		});
	}

	public render(): React.ReactNode {
		return (
			<div
				role="radiogroup"
				id={this.props.id}
				className={this.props.className}
				aria-labelledby={this.props["aria-labelledby"]}
				aria-disabled={this.props.disabled}
			>
				{this.renderButtons()}
			</div>
		);
	}
}
