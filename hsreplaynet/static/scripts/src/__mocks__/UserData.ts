const UserData = jest.requireActual("../UserData");

class MockUserData extends UserData.default {
	public static create() {
		// tslint:disable-line:no-empty
	}

	public static getLanguages() {
		return {
			en: "English",
			fr: "Fran\u00e7ais",
			de: "Deutsch",
			ko: "\ud55c\uad6d\uc5b4",
			es: "Espa\u00f1ol (Espa\u00f1a)",
			"es-mx": "Espa\u00f1ol (Latinoam\u00e9rica)",
			ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
			"zh-hant": "\u7e41\u9ad4\u4e2d\u6587(\u53f0\u7063)",
			"zh-hans": "\u4e2d\u6587\uff08\u7b80\u4f53\uff09",
			it: "Italiano",
			"pt-br": "Portugu\u00eas (Brasil)",
			pl: "Polski",
			ja: "\u65e5\u672c\u8a9e",
			th: "\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22",
		};
	}
}

export default MockUserData;
