const path = require("path")

var cache = []
function filterCircularRefences(key, value) {
	if (typeof value === 'object' && value !== null) {
		if (cache.indexOf(value) !== -1) {
			// Circular reference to parent found, discard key before printing
			if (key === 'env' || key === 'unit')
				return
		}
		// Store value in our collection
		cache.push(value)
	}

	return value;
}
exports.filterCircularRefences = filterCircularRefences

function resolveHome(filepath) {
	if (filepath[0] === '~') {
		return path.join(process.env.HOME, filepath.slice(1));
	}
	return path.resolve(filepath);
}
exports.resolveHome = resolveHome