
module.exports.isLoaded = isLoaded
function isLoaded(context, event) {
	let searchTerm = 'loaders.'
	let loaderId = event.type.substring(event.type.indexOf(searchTerm) + searchTerm.length)
	loaderId = `${loaderId.substring(0,loaderId.indexOf('.'))}`
	console.log(`isLoaded nevent.type = ${event.type}nloader ID = ${loaderId}`)
	return loaderId in context.refs && context.refs[loaderId] > 1
}

module.exports.isShouldUnload = isShouldUnload
function isShouldUnload(context, event) {
	let searchTerm = 'loaders.'
	let loaderId = event.type.substring(event.type.indexOf(searchTerm) + searchTerm.length)
	loaderId = `${loaderId.substring(0,loaderId.indexOf('.'))}`
	console.log(`isShouldUnload loader ID = ${loaderId}`)
	return loaderId in context.refs && context.refs[loaderId] === 0
}

module.exports.AND = AND
function AND(ctx, evt, {
	lhs,
	rhs
}) {
	return (lhs && funcs[lhs.type](lhs)) && (rhs && funcs[rhs.type](rhs))
}

module.exports.OR = OR
function OR(ctx, evt, {
	lhs,
	rhs
}) {
	return (lhs && funcs[lhs.type](lhs)) || (rhs && funcs[rhs.type](rhs))
}

module.exports.TRUE = TRUE
function TRUE(ctx, evt, {
	lhs,
	rhs
}) {
	return rhs && (rhs.type && funcs[rhs.type](rhs) || rhs.marker in ctx)
}

module.exports.FALSE = FALSE
function FALSE(ctx, evt, {
	lhs,
	rhs
}) {
	return rhs && (rhs.type && !funcs[rhs.type](rhs) || !(rhs.marker in ctx))
}

module.exports.SELECT = SELECT
function SELECT(ctx, evt, {
	rhs
}) {
	//TODO: detect if an object is selected this frame
	return false
}