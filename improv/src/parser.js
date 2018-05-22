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
		this.scene= ({
			type: 'scene'
		})
		if(parent){
			this.parent = parent
			this.scene = Object.assign({},parent.scene)
			this.scene.shots = []
			delete this.scene.transition
		}
	}

	get lastShot (){
		return this.scene && this.scene.shots && this.scene.shots.length && this.scene.shots[this.scene.shots.length - 1]
	}

	copyLastFromParentIfNoShots(){
		if(this.parent && this.scene.shots.length === 0){
			this.scene.shots = [Object.assign({}, this.parent.lastShot)]
			this.lastShot.actions = []
		}
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
					this.copyLastFromParentIfNoShots()
					if (obj.op == 'AWAIT') {
						this.lastShot.actions.push({type:'control', conditions:[obj]})
					} else {
						this.conditions.push(obj)
					}
					break
				case 'dialogue':
					this.copyLastFromParentIfNoShots()
					this.lastShot.actions.push(obj)
					break
				case 'action':
					this.copyLastFromParentIfNoShots()
					this.lastShot.actions.push(obj)
					break
			}
		}
	}
}

const canSkipLine = l => !l || l === '\n' || l === ''
const canSkipStmt = s => !s || typeof s === 'number'

const isAwait = stmt => (stmt.exp && stmt.exp.op === 'AWAIT')
const isControlExp = (stmt) => stmt.exp && stmt.exp.op != 'AWAIT'
const isStartOfUnit = (currStmt, lastStmt) => lastStmt === null || isControlExp(currStmt) || isAwait(lastStmt)
const isEndOfUnit = (currStmt, lastStmt) => isAwait(currStmt) || (lastStmt && currStmt.depth < lastStmt.depth)

module.exports.parseLines = (lines) => {
	let rootUnits = []
	let currUnit = null
	let lastStmt = null
	
	for(let line of lines){
		if (canSkipLine(line)) {continue}
		var currStmt = parseLine(line)
		if (canSkipStmt(currStmt)) {continue}

		//a decreased indent denotes return to parent unit
		if (isEndOfUnit(currStmt, lastStmt)) {
			let depth = lastStmt.depth - currStmt.depth
			while (depth--) {
				currUnit = currUnit.parent
			}
		}
		//another scene or indent starts a new unit
		let isControlStmt = isControlExp(currStmt)
		if (isStartOfUnit(currStmt, lastStmt)){
			let newUnit = new Unit(currUnit)
			
			if (isControlStmt){
				let control = {
					type: 'control',
					conditions: [currStmt.exp],
					child: newUnit
				}
				currUnit.lastShot.actions.push(control)
			} else {
				rootUnits.push(newUnit)
			}
			
			currUnit = newUnit
		}

		//inject lines into unit
		if (!isControlStmt){
			currUnit.ingestStmt(currStmt)
		}

		lastStmt = currStmt
	}
	return rootUnits
}