import React from "react";
import { TransProps } from "react-i18next/src/trans";

declare module "react-i18next" {
	interface Props extends TransProps {
		defaults?: string;
		components?: React.ReactNode[];
	}

	export class Trans extends React.Component<Props> {}
}
