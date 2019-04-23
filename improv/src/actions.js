module.exports.log = log

function log(context, event) {
	console.log(`${JSON.stringify(event)}: context: ${JSON.stringify(context)}`)
}

module.exports.decRec = decRec

function decRec(context, event) {
	return Object.keys(context.refs).reduce((refs, id) => {
		let searchTerm = 'units.'
		let actionId = event.type.substring(event.type.indexOf(searchTerm) + searchTerm.length)
		actionId = `LOAD - ${actionId.substring(0,actionId.indexOf('.'))}`
		return ({
			...refs,
			[id]: id != actionId && id in context.refs ? context.refs[id] - 1 : 0
		})
	}, {})
}

module.exports.incRec = incRec

function incRec(context, event) {
	let searchTerm = 'units.'
	let actionId = event.type.substring(event.type.indexOf(searchTerm) + searchTerm.length)
	actionId = `LOAD - ${actionId.substring(0,actionId.indexOf('.'))}`
	return ({
		...context.refs,
		[actionId]: actionId in context.refs ? context.refs[actionId] + 1 : 1
	})
}