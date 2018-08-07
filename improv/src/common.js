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