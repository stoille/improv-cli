const nearley = require("nearley")
const grammar = require("./grammar")

function parseLine(lineText) {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), { keepHistory: false })
	parser.feed(lineText)
	return parser.results[0]
}

class Unit {
	constructor(parent) {
		this.type = 'unit'
		this.parent = null
		this.decorators = []
		this.conditions = []
		this.scene= ({
			type: 'scene',
			shots: [{actions:[]}]
		})
		if(parent){
			this.parent = parent
			this.scene = Object.create(parent.scene)
			this.scene.shots = [{actions: []}]
			delete this.scene.transition
		}
	}

	get lastShot (){
		return this.scene.shots[this.scene.shots.length - 1]
	}

	ingestStmt(stmt){
		for (const prop in stmt) {
			let val = stmt[prop]
			if(typeof val !== 'object') { continue }
			
			let obj = Object.assign({type:prop}, val)
			
			switch (prop) {
				case 'comment':
					//TODO: find out why this is necessary
					obj = {type:prop, text: val.join('')}
					this.decorators.push(obj)
					break
				default:
					this[prop] = obj
					break
				case 'transition':
					this.scene[prop] = obj
				break
				case 'sceneHeading':
					this.scene = Object.assign(obj, this.scene)
					this.scene.shots = []
					break
				case 'shot':
					obj.actions = []
					this.scene.shots.push(obj)
					break
				case 'exp':
					if (obj.op == 'AWAIT') {
						this.lastShot.actions.push(obj)
					} else {
						this.conditions.push(obj)
					}
					break
				case 'dialogue':
					this.lastShot.actions.push(obj)
					break
				case 'action':
					this.lastShot.actions.push(obj)
					break
			}
		}
	}
}

const canSkipLine = l => !l || l === '\n' || l === ''
const canSkipStmt = s => !s || typeof s === 'number'

const isStartOfChild = (currStmt, lastStmt) => lastStmt === null ||
	(currStmt.exp && currStmt.exp.op != 'AWAIT')
const isEndOfChild = (currStmt, lastStmt) => (currStmt.exp && currStmt.exp.op === 'AWAIT') || (lastStmt && currStmt.depth < lastStmt.depth)

module.exports.parseLines = (lines) => {
	let root = new Unit()
	//root.scene = null
	let currUnit = root
	let lastStmt = null
	
	for(let line of lines){
		if (canSkipLine(line)) {continue}
		var currStmt = parseLine(line)
		if (canSkipStmt(currStmt)) {continue}

		//a decreased indent denotes return to parent unit
		if (isEndOfChild(currStmt, lastStmt)) {
			let depth = lastStmt.depth - currStmt.depth
			while (depth--) {
				currUnit = currUnit.parent
			}
		}
		//another scene or indent starts a new unit
		if (isStartOfChild(currStmt, lastStmt)){
			let childUnit = new Unit(currUnit)
			currUnit.lastShot.actions.push(childUnit)
			currUnit = childUnit
		}

		//inject lines into unit
		currUnit.ingestStmt(currStmt)

		lastStmt = currStmt
	}
	return root
}