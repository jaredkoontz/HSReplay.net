/* tslint:disable */
import React from "react";
import ReactDOM from "react-dom";
import Sunwell from "sunwell";
import CSRFElement from "../components/CSRFElement";
import {
	CardClass,
	CardSet,
	CardType,
	MultiClassGroup,
	Rarity,
} from "../hearthstone";

class Fieldset extends React.Component<any> {
	public render(): React.ReactNode {
		return (
			<fieldset name={this.props.name}>
				<legend>{this.props.legend}</legend>
				{this.props.children}
			</fieldset>
		);
	}
}

class LabeledInput extends React.Component<any> {
	labelAfter(): boolean {
		return this.props.type == "checkbox" || this.props.type == "radio";
	}

	public render(): React.ReactNode {
		return (
			<label>
				{this.labelAfter() ? "" : this.props.label}
				<input {...this.props} />
				{this.labelAfter() ? this.props.label : ""}
			</label>
		);
	}
}

class LabeledSelect extends React.Component<any> {
	getOptions(): Array<JSX.Element> {
		const ret: Array<JSX.Element> = [];
		this.props.options.forEach((option: JSX.Element) => {
			ret.push(
				<option value={option[0]} key={option[0]}>
					{option[1]}
				</option>,
			);
		});
		return ret;
	}

	public render(): React.ReactNode {
		return (
			<label>
				{this.props.label}
				<select
					name={this.props.name}
					id={this.props.id}
					onChange={this.props.onChange}
				>
					{this.getOptions()}
				</select>
			</label>
		);
	}
}

interface RadioInputGroupState {
	value?: CardType;
}

class RadioInputGroup extends React.Component<any, RadioInputGroupState> {
	constructor(props: any, context?: any) {
		super(props, context);
		this.state = { value: props.defaultValue };
	}

	getOptions(): Array<JSX.Element> {
		const ret: Array<JSX.Element> = [];
		const onChange = (e: Event) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			this.setState({ value });
			this.props.onChange(e, this.props.name, true);
		};

		this.props.options.forEach((option: JSX.Element) => {
			ret.push(
				<LabeledInput
					type="radio"
					name={this.props.name}
					value={option[0]}
					label={option[1]}
					checked={this.state.value == option[0]}
					onChange={onChange}
					key={option[0]}
				/>,
			);
		});
		return ret;
	}

	public render(): React.ReactNode {
		return (
			<p className={"group-" + this.props.name}>{this.getOptions()}</p>
		);
	}
}

class StatInput extends React.Component<any> {
	public render(): React.ReactNode {
		return <LabeledInput {...this.props} type="number" min={0} max={99} />;
	}
}

class TextureUploadInput extends React.Component<any> {
	public componentDidMount(): void {
		ReactDOM.findDOMNode(this).addEventListener(
			"dragover",
			this.handleDragOver.bind(this),
		);
		ReactDOM.findDOMNode(this).addEventListener(
			"drop",
			this.handleFileSelect.bind(this),
		);
	}

	handleDragOver(event: DragEvent): void {
		event.stopPropagation();
		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
	}

	handleFileSelect(event: DragEvent): void {
		event.stopPropagation();
		event.preventDefault();

		const file = event.dataTransfer.files[0];
		const reader = new FileReader();

		reader.onload = (e: ProgressEvent) => {
			this.props.onChange(this.props.name, e.target["result"], file);
		};

		reader.readAsDataURL(file);
	}

	public render(): React.ReactNode {
		return (
			<p id="texture-upload-input" className="drop-zone">
				<input
					type="hidden"
					name={this.props.name}
					id={"id_" + this.props.name}
				/>
				<span id="texture-upload-label">{this.props.label}</span>
			</p>
		);
	}
}

const RarityOptions = [
	[Rarity.FREE, "Free"],
	[Rarity.COMMON, "Common"],
	[Rarity.RARE, "Rare"],
	[Rarity.EPIC, "Epic"],
	[Rarity.LEGENDARY, "Legendary"],
];

const CardClassOptions = [
	[CardClass.NEUTRAL, "Neutral"],
	[CardClass.DRUID, "Druid"],
	[CardClass.HUNTER, "Hunter"],
	[CardClass.MAGE, "Mage"],
	[CardClass.PALADIN, "Paladin"],
	[CardClass.PRIEST, "Priest"],
	[CardClass.ROGUE, "Rogue"],
	[CardClass.SHAMAN, "Shaman"],
	[CardClass.WARLOCK, "Warlock"],
	[CardClass.WARRIOR, "Warrior"],
];

const MultiClassGroupOptions = [
	[MultiClassGroup.INVALID, "None"],
	[MultiClassGroup.GRIMY_GOONS, "Grimy Goons"],
	[MultiClassGroup.JADE_LOTUS, "Jade Lotus"],
	[MultiClassGroup.KABAL, "Kabal"],
];

const CardSetOptions = [
	[CardSet.INVALID, "None"],
	[CardSet.EXPERT1, "Classic"],
	[CardSet.HOF, "Hall of Fame"],
	[CardSet.NAXX, "Curse of Naxxramas"],
	[CardSet.GVG, "Goblins vs. Gnomes"],
	[CardSet.BRM, "Blackrock Mountain"],
	[CardSet.TGT, "The Grand Tournament"],
	[CardSet.LOE, "League of Explorers"],
	[CardSet.KARA, "One Night in Karazhan"],
	[CardSet.OG, "Whispers of the Old Gods"],
	[CardSet.GANGS, "Mean Streets of Gadgetzan"],
	[CardSet.UNGORO, "Journey to Un'Goro"],
	[CardSet.ICECROWN, "Knigts of the Frozen Throne"],
	[CardSet.LOOTAPALOOZA, "Kobolds and Catacombs"],
	[CardSet.GILNEAS, "The Witchwood"],
	[CardSet.BOOMSDAY, "The Boomsday Project"],
];

const CardTypeOptions = [
	[CardType.MINION, "Minion"],
	[CardType.SPELL, "Spell"],
	[CardType.WEAPON, "Weapon"],
	[CardType.HERO, "Hero"],
	[CardType.HERO_POWER, "Hero Power"],
];

interface CardEditorFormState {
	name?: string;
	text?: string;
	type?: CardType;
	raceText?: string;
	cost?: number;
	attack?: number;
	health?: number;
	silenced?: boolean;
	costHealth?: boolean;
	hideStats?: boolean;
	playerClass?: CardClass;
	multiClassGroup?: MultiClassGroup;
	rarity?: Rarity;
	elite?: boolean;
	premium?: boolean;
	set?: CardSet;
	texture?: string;
	file?: File;
}

// Map betwe
const SunwellNameMap = new Map<string, string>([
	["atk", "attack"],
	["card_class", "cardClass"],
	["card_set", "set"],
	["costs_health", "costsHealth"],
	["hide_stats", "hideStats"],
	["multi_class_group", "multiClassGroup"],
	["race_text", "raceText"],
]);

class CardEditorForm extends React.Component<any, CardEditorFormState> {
	constructor(props: any, context?: any) {
		super(props, context);
		this.state = {
			name: "Sayer of Doom",
			text: "<b>Battlecry</b>: Create an awesome card.",
			type: CardType.MINION,
			raceText: "Custom",
			cost: 4,
			attack: 7,
			health: 7,
			silenced: false,
			costHealth: false,
			hideStats: false,
			playerClass: CardClass.NEUTRAL,
			multiClassGroup: MultiClassGroup.INVALID,
			rarity: Rarity.FREE,
			elite: false,
			premium: false,
			set: CardSet.EXPERT1,
		};
	}

	public componentDidMount(): void {
		ReactDOM.findDOMNode(this).addEventListener(
			"submit",
			this.onFormSubmit.bind(this),
		);
		// Re-render once fonts have loaded
		document["fonts"].onloadingdone = e => {
			this.updatePreview();
		};
		this.updatePreview();
	}

	onFormSubmit(event: Event): void {
		event.preventDefault();

		const textureInput = document.getElementById(
			"id_texture",
		) as HTMLInputElement;
		const file = this.state.file;

		if (!file) {
			console.error("No file!");
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.open("POST", this.props.uploadApiUrl);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("X-CSRFToken", this.props.csrfToken);
		xhr.onload = () => {
			const response = JSON.parse(xhr.responseText);
			if (xhr.status == 201 && response.upload_url && response.url) {
				// Upload the file
				const put = new XMLHttpRequest();
				put.open("PUT", response.upload_url);
				put.onload = () => {
					if (put.status == 204 && textureInput) {
						textureInput.value = response.url;
						// let form = ReactDOM.findDOMNode(this)
						// form.submit();
					} else {
						console.error(
							"Something went wrong during PUT",
							put.status,
						);
					}
				};
				put.send(file);
			} else {
				console.error("Error uploading card art", response.detail);
				event.preventDefault();
			}
		};

		const data = {
			filename: file.name,
			content_type: file.type,
			size: file.size,
		};

		xhr.send(JSON.stringify(data));
	}

	updatePreview(): void {
		this.props.refreshCallback(this.state);
	}

	handleChange(event: Event, key: string, castToInt: boolean): void {
		const state: CardEditorFormState = {};
		let value: any;
		const inputType: string = event.target["type"];

		if (inputType == "checkbox") {
			value = event.target["checked"];
		} else {
			value = event.target["value"];
		}

		if (castToInt) {
			value = parseInt(value);
		}

		if (key == "manual_linebreaks") {
			// TODO
		}

		state[key] = value;
		this.setState(state, this.updatePreview);
	}

	createInput(elementType: any, props: any): JSX.Element {
		const sunwellName = SunwellNameMap.get(props.name) || props.name;
		const castToInt = elementType == LabeledSelect;
		if (elementType != "textarea") {
			props.type = props.type || "text";
		}
		props.type = props.type || "text";
		props.id = "id_" + props.name;
		props.onChange = e => this.handleChange(e, sunwellName, castToInt);
		props.defaultValue = this.state[sunwellName];
		return React.createElement(elementType, props);
	}

	updateTexture(name: string, data: string, file: File) {
		const state: CardEditorFormState = {};
		state.file = file;
		state[name] = data;
		this.setState(state);
		this.updatePreview();
	}

	public render(): React.ReactNode {
		const onChange = this.handleChange.bind(this);
		const updateTexture = this.updateTexture.bind(this);
		return (
			<form method="POST" action="" id={this.props.id}>
				<CSRFElement />
				<Fieldset name="texts" legend="Text">
					<p>
						{this.createInput(LabeledInput, {
							name: "name",
							label: "Name",
							required: true,
						})}
					</p>
					<p>
						<label>
							Description
							{this.createInput("textarea", { name: "text" })}
						</label>
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "manual_linebreaks",
							label: "Manual linebreaks",
						})}
					</p>
					<p>
						{this.createInput(LabeledInput, {
							name: "race_text",
							label: "Race",
							disabled: this.state.type != CardType.MINION,
						})}
					</p>
				</Fieldset>
				<Fieldset name="stats" legend="Stats">
					<p className="h-group">
						{this.createInput(StatInput, {
							name: "cost",
							label: "Cost",
						})}
						{this.createInput(StatInput, {
							name: "atk",
							label: "Attack",
							disabled: this.state.type == CardType.SPELL,
						})}
						{this.createInput(StatInput, {
							name: "health",
							label:
								this.state.type == CardType.WEAPON
									? "Durability"
									: "Health",
							disabled: this.state.type == CardType.SPELL,
						})}
					</p>
					<p className="advanced-option">
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "silenced",
							label: "Silenced",
							disabled: this.state.type != CardType.MINION,
						})}
					</p>
					<p className="advanced-option">
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "costs_health",
							label: "Costs Health instead of Mana",
						})}
					</p>
					<p className="advanced-option">
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "hide_stats",
							label: "Hide stats",
						})}
					</p>
				</Fieldset>
				<Fieldset name="textures" legend="Textures">
					<RadioInputGroup
						name="type"
						onChange={onChange}
						options={CardTypeOptions}
						defaultValue={this.state.type}
					/>
					<p>
						{this.createInput(LabeledSelect, {
							name: "card_class",
							label: "Class",
							options: CardClassOptions,
						})}
						{this.createInput(LabeledSelect, {
							name: "multi_class_group",
							label: "Multi-class group",
							options: MultiClassGroupOptions,
						})}
					</p>
					<p>
						{this.createInput(LabeledSelect, {
							name: "rarity",
							label: "Rarity",
							options: RarityOptions,
						})}
					</p>
					<p className="advanced-option">
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "elite",
							label: "Elite",
						})}
						{this.createInput(LabeledInput, {
							type: "checkbox",
							name: "premium",
							label: "Premium",
						})}
					</p>
					<p>
						{this.createInput(LabeledSelect, {
							name: "card_set",
							label: "Card set",
							options: CardSetOptions,
						})}
					</p>
					<TextureUploadInput
						name="texture"
						label="Drag & drop some card art"
						onChange={updateTexture}
						file={this.state.file}
					/>
				</Fieldset>
			</form>
		);
	}
}

class SunwellRender extends React.Component<any, any> {
	public render(): React.ReactNode {
		return <canvas id={this.props.id} />;
	}
}

class DownloadButton extends React.Component<any> {
	public componentDidMount(): void {
		ReactDOM.findDOMNode(this).addEventListener(
			"click",
			this.handleClick.bind(this),
		);
	}

	handleClick(event: Event): void {
		const element = event.target as HTMLAnchorElement;
		element.download = this.getFilename();
		const canvas = document.getElementById(
			this.props.canvasId,
		) as HTMLCanvasElement;
		if (canvas) {
			element.href = canvas.toDataURL("image/png");
		}
	}

	getFilename(): string {
		const input = document.getElementById(
			this.props.nameInputId,
		) as HTMLInputElement;
		if (!input || !input.value) {
			return "card";
		}
		return input.value
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w\-]+/g, "")
			.replace(/\-\-+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "");
	}

	public render(): React.ReactNode {
		return (
			<a
				href="javascript:;"
				id={this.props.id}
				className="btn btn-primary"
				download
			>
				{this.props.label}
			</a>
		);
	}
}

class PublishButton extends React.Component<any> {
	public render(): React.ReactNode {
		return (
			<button
				type="submit"
				className="btn btn-primary"
				form={this.props.form}
			>
				{this.props.label}
			</button>
		);
	}
}

class CardEditor extends React.Component<any, any> {
	public render(): React.ReactNode {
		const formId = "cardrender-create-form";
		const previewId = "preview-render";

		const refreshCallback = (state: CardEditorFormState): void => {
			this.props.sunwell.createCard(
				state,
				512,
				state.premium,
				document.getElementById(previewId),
			);
		};

		return (
			<div className="flex-container" id="cardrender-editor-reactroot">
				<CardEditorForm
					id={formId}
					refreshCallback={refreshCallback}
					csrfToken={this.props.csrfToken}
					uploadApiUrl={this.props.uploadApiUrl}
				/>
				<div id="cardrender-form-preview">
					<div id="cardrender-form-buttons">
						<DownloadButton
							id="download-card-button"
							label="Download"
							nameInputId="id_name"
							canvasId={previewId}
						/>
						<PublishButton form={formId} label="Publish" />
					</div>
					<SunwellRender id={previewId} />
				</div>
			</div>
		);
	}
}

window.onload = function() {
	const sunwell = new Sunwell({
		titleFont: "belwe_fsextrabold",
		bodyFont: "franklin_gothic_fsMdCn",
		bodyFontSize: 50,
		// bodyLineHeight: 55,
		bodyBaseline: "hanging",
		// bodyFontOffset: {x: 0, y: 0},
		assetFolder: SUNWELL_URL + "assets/",
		cacheSkeleton: true,
		debug: false,
	});

	const root = document.getElementById("cardrender-editor");
	if (root) {
		const csrfToken = root.getAttribute("data-csrf-token") || "";
		const uploadApiUrl = root.getAttribute("data-upload-api");

		ReactDOM.render(
			<CardEditor
				id="cardrender-editor-form"
				sunwell={sunwell}
				csrfToken={csrfToken}
				uploadApiUrl={uploadApiUrl}
			/>,
			root,
		);
	}
};
