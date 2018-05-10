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
		this.parent = parent ? parent : null
		if(parent){
			this.comments = []
			this.conditions = []
			this.scene = parent.scene ? Object.create( parent.scene ) : null
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
			if(typeof val !== 'object') { continue }
			
			let obj = Object.assign({type:prop}, val)
			
			switch (prop) {
				case 'comment':
					this.comments.push(obj)
					break
				default:
					this[prop] = obj
					break
				case 'transition':
					if(!this.scene){
						this.scene = {}
					}
					this.scene[prop] = obj
				break
				case 'sceneHeading':
					this.scene = this.scene ? Object.assign(this.scene, obj) : obj
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

const isStartOfChild = (currStmt, lastStmt) => lastStmt == null ||
	(currStmt.exp && currStmt.exp.op != 'AWAIT')
const isEndOfChild = (currStmt, lastStmt) => currStmt.depth < lastStmt.depth

module.exports.parseLines = (lines) => {
	let root = new Unit()
	let currUnit = root
	let lastStmt = null
	
	for(let line of lines){
		if (canSkipLine(line)) {continue}
		var currStmt = parseLine(line)
		if (canSkipStmt(currStmt)) {continue}

		//another scene or indent starts a new unit
		if (isStartOfChild(currStmt, lastStmt)){
			currUnit = new Unit(currUnit)
		} else if(isEndOfChild(currStmt, lastStmt)){
			let depth = lastStmt.depth - currStmt.depth
			while(--depth){
				currUnit = currUnit.parent
			}
		}
		//inject lines into unit
		currUnit.ingestStmt(currStmt)
		
		lastStmt = currStmt
	}
	return root
}