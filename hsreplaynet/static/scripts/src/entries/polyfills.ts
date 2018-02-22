if (
	window &&
	window.navigator &&
	window.navigator.userAgent &&
	/Edge\/1[0-4]\./.test(window.navigator.userAgent)
) {
	// Fix for bug in Microsoft Edge: https://github.com/Microsoft/ChakraCore/issues/1415#issuecomment-246424339
	Function.prototype.call = function(t) {
		return this.apply(t, Array.prototype.slice.apply(arguments, [1]));
	};
}
