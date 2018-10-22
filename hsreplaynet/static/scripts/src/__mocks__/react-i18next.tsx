import React from "react";
import ICU from "i18next-icu";
const icu = new ICU({ memoize: false });

const hasChildren = node =>
	node && (node.children || (node.props && node.props.children));

const getChildren = node =>
	node && node.children ? node.children : node.props && node.props.children;

const renderNodes = reactNodes => {
	if (typeof reactNodes === "string") {
		return reactNodes;
	}

	return Object.keys(reactNodes).map((key, i) => {
		const child = reactNodes[key];
		const isElement = React.isValidElement(child);

		if (typeof child === "string") {
			return child;
		} else if (hasChildren(child)) {
			const inner = renderNodes(getChildren(child));
			return React.cloneElement(child, { ...child.props, key: i }, inner);
		} else if (typeof child === "object" && !isElement) {
			return Object.keys(child).reduce(
				(str, childKey) => `${str}${child[childKey]}`,
				"",
			);
		}

		return child;
	});
};

const mockTranslate = (key, options) => {
	return icu.parse(key, options);
};

const mockI18n = {
	hasResourceBundle: (lng: string, ns: string) => false,
};

export const translate = () => Component => props => (
	<Component t={mockTranslate} i18n={mockI18n} {...props} />
);
