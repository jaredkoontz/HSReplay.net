import React from "react";
import { addDecorator, configure } from "@storybook/react";
import i18n from "../hsreplaynet/static/scripts/src/i18n";
import "../hsreplaynet/static/styles/main.scss"
import { I18nextProvider } from "react-i18next";

addDecorator(story => (
	<I18nextProvider i18n={i18n}>{story()}</I18nextProvider>),
);

// automatically import all files ending in *.stories.js
const req = require.context("../hsreplaynet/static/scripts/src/components", true, /.stories.tsx$/);

function loadStories() {
	req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
