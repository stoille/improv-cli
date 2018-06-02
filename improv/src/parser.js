const nearley = require("nearley")
const grammar = require("./grammar")

function parseLine(lineText) {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), { keepHistory: false })
	parser.feed(lineText)
	//HACK: enforce rule precedence ambiguity - why doesn't nearly.js do this?
	let results = {}
	for (let idx in parser.results) {
		let result = parser.results[idx]
		if (!results[result.rule]) {
			results[result.rule] = result
		}
	}
	if (results.activeObjects) return results.activeObjects
	if( results.sceneHeading ) return results.sceneHeading
	if( results.shot ) return results.shot
	if( results.action ) return results.action
	if( results.transition ) return results.transition
	if( results.dialogue ) return results.dialogue
	if( results.await ) return results.await
	if( results.exp ) return results.exp
	if( results.comment ) return results.comment
	return null
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

	copyLastShotFromParentIfHaveNone(){
		if(this.parent && this.scene.shots.length === 0){
			this.scene.shots = [Object.assign({}, this.parent.lastShot)]
			this.lastShot.actions = []
		}
	}

	ingestStmt(stmt){
		let obj = {}
		switch (stmt.rule) {
			case 'comment':
				//TODO: find out why this is necessary
				obj = {
					type: stmt.rule,
					text: stmt.result.join('')
				}
				this.decorators.push(obj)
				break
			case 'activeObjects':
				this.lastShot.activeObjects = stmt.result.map(d=>d.trim())
				break
			case 'sceneHeading':
				this.scene = Object.assign(stmt.result, this.scene)
				this.scene.shots = []
				break
			case 'shot':
				obj = Object.assign(obj, stmt.result)
				if (this.parent && this.parent.lastShot.activeObjects) {
					obj.activeObjects = this.parent.lastShot.activeObjects.slice()
				} else {
					obj.activeObjects = []
				}
				obj.actions = []
				this.scene.shots.push(obj)
				break
			case 'exp':
				this.copyLastShotFromParentIfHaveNone()
				break
			case 'await':
				this.await = ({
					type: stmt.rule,
					time: stmt.result.time,
					condition: stmt.result.rhs
				})
				break;
			case 'dialogue':
				this.copyLastShotFromParentIfHaveNone()
				this.lastShot.actions.push(stmt.result)
				break
			case 'action':
				this.copyLastShotFromParentIfHaveNone()
				this.lastShot.actions.push(stmt.result)
				break
			case 'transition':
				this.scene[stmt.rule] = stmt.result
				break
			default:
				this[stmt.rule] = stmt.result
				break
		}
	}
}

const canSkipLine = l => !l || l === '\n' || l === ''
const canSkipStmt = s => !s || typeof s === 'number'

const isAwait = stmt => stmt.rule === 'await'
const isControlExp = (stmt) => stmt.rule === 'exp'
const isStartOfUnit = (currStmt, lastStmt) => lastStmt === null || isAwait(lastStmt) || isControlExp(currStmt)
const isEndOfUnit = (currStmt, lastStmt) => isAwait(currStmt) || (lastStmt && lastStmt.rule !== 'activeObjects' && (currStmt.depth < lastStmt.depth))

module.exports.parseLines = (lines) => {
	let rootUnits = []
	let currUnit = null
	let lastStmt = null
	let lineNum = 0
	
	for(let line of lines){
		++lineNum;
		if (canSkipLine(line)) {continue}
		var currStmt = parseLine(line)
		if (canSkipStmt(currStmt)) {
			console.error(`Error Ln ${lineNum}: ${line}`)
			continue
		}

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

			if (isControlStmt) {
				let control = {
					type: 'control',
					condition: currStmt.result,
					child: newUnit
				}
				currUnit.lastShot.actions.push(control)
			} else {
				rootUnits.push(newUnit)
			}
			
			currUnit = newUnit
		}

		//inject lines into unit
		//!isControlStmt prevents lastShot from being reintroduced into a new unit
		if (!isControlStmt){
			currUnit.ingestStmt(currStmt)
		}

		lastStmt = currStmt
	}
	return rootUnits
}