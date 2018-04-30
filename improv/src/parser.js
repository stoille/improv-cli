const nearley = require("nearley")
const grammar = require("./grammar")

function parseLine(lineText) {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), { keepHistory: false })
	parser.feed(lineText)
	return parser.results[0]
}

class Unit {
	constructor(parent) {
		this.parent = parent ? parent : null
		if(parent){
			this.comments = []
			this.conditions = []
			this.scene = parent.scene ? Object.create( parent.scene) : null
			if(this.scene){
				this.scene.shots = []
			}
			parent.children.push(this)
		}
		this.children = []
	}

	get lastShot (){
		return this.scene.shots[this.scene.shots.length - 1]
	}

	ingestStmt(stmt){
		for (const prop in stmt) {
			let val = stmt[prop]
			switch (prop) {
				case 'comment':
					this.comments.push(val)
					break
				default:
					this[prop] = val
					break
				case 'sceneHeading':
					this.scene = val
					this.scene.shots = []
					break
				case 'shot':
					val.actions = []
					this.scene.shots.push(val)
					break
				case 'exp':
					if (val.op == 'AWAIT') {
						this.actions.push(val)
					} else {
						this.conditions.push(val)
					}
					break
				case 'dialogue':
				case 'action':
					this.lastShot.actions.push(val)
					break
			}
		}
	}
}

module.exports.parseLines = (lines) => {
	let root = new Unit()
	let currUnit = root
	let lastStmt = null
	
	const canSkipLine = line => !line || line === '\n' || line === ''
	const canSkipStmt = stmt => !stmt
	
	const isStartOfChild = (currStmt, lastStmt) => lastStmt == null 
		|| (currStmt.exp && currStmt.exp.op != 'AWAIT')
	const isEndOfChild = (currStmt, lastStmt) => currStmt.depth < lastStmt.depth

	for(let line of lines){
		if (canSkipLine(line)) continue
		var currStmt = parseLine(line)
		if (canSkipStmt(currStmt)) continue

		//another scene or indent starts a new unit
		if (isStartOfChild(currStmt, lastStmt)){
			currUnit = new Unit(currUnit)
		} else if(isEndOfChild(currStmt, lastStmt)){
			let depth = lastStmt.depth - currStmt.depth
			while(depth--){
				currUnit = currUnit.parent
			}
		}
		//inject lines into unit
		currUnit.ingestStmt(currStmt)
		
		lastStmt = currStmt
	}
	return root
}