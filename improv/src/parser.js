const assign = require('xstate').actions.assign
const nearley = require('nearley')
const grammar = require('./grammar')

let transitions = []

function parseLine(lineText) {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), {
		keepHistory: false
	})
	parser.feed(lineText)
	//HACK: enforce rule precedence ambiguity - why doesn't nearly.js do this?
	let results = {
		depth: 0
	}
	for (let idx in parser.results) {
		let result = parser.results[idx]
		results[result.rule] = result
	}
	if (results.activeObjects) return results.activeObjects
	if (results.sceneHeading) return results.sceneHeading
	if (results.shot) return results.shot
	if (results.action) return results.action
	if (results.transition) return results.transition
	if (results.dialogue) return results.dialogue
	if (results.cond) return results.cond
	if (results.comment) return results.comment
	return results
}

const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null

let lineCursor = 0,
	lastStmt, lastLine, envs = []
let reel = {
	id: "reel",
	parallel: true,
	states: {
		buffer: {
			parallel: true,
			states: {
				loading: {},
				unloading: {}
			}
		},
		units: {
			isRoot: true,
			on: {},
			states: {}
		}
	}
}
let lastState = reel.states.units

module.exports.impToXML = impToXML

function impToXML(script) {
	let parsedScript = parseLines(script, true)
	isCyclic(parsedScript)
	return JSON.stringify(parseLines(script))
}

module.exports.impToJSON = impToJSON

function impToJSON(script) {
	let parsedScript = parseLines(script)
	isCyclic(parsedScript)
	return JSON.stringify(parseLines(script))
}

function isCyclic(obj) {
	var keys = [];
	var stack = [];
	var stackSet = new Set();
	var detected = false;

	function detect(obj, key) {
		if (obj && typeof obj != 'object') {
			return;
		}

		if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
			var oldindex = stack.indexOf(obj);
			var l1 = keys.join('.') + '.' + key;
			var l2 = keys.slice(0, oldindex + 1).join('.');
			console.log('CIRCULAR: ' + l1 + ' = ' + l2 + ' = ' + obj);
			console.log(obj);
			detected = true;
			return;
		}

		keys.push(key);
		stack.push(obj);
		stackSet.add(obj);
		for (var k in obj) { //dive on the object's children
			if (Object.prototype.hasOwnProperty.call(obj, k)) {
				detect(obj[k], k);
			}
		}

		keys.pop();
		stack.pop();
		stackSet.delete(obj);
		return;
	}

	detect(obj, 'obj');
	return detected;
}

module.exports.parseLines = parseLines

function parseLines(lines) {
	let currState = makeState(lastState)
	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively
	while (lineCursor < lines.length) {
		let line = lines[lineCursor]
		lineCursor += 1

		let currStmt
		try {
			currStmt = parseLine(line)
			line = line.trim()
		} catch (error) {
			console.error(error.message)
			continue
		}

		if (currStmt.rule === 'comment' ||
			isEmptyOrSpaces(line)) {
			continue
		}

		let tabDecreased = currStmt && lastStmt && currStmt.depth < lastStmt.depth
		if (tabDecreased) {
			let d = lastStmt.depth - 2
			let env = envs.pop()
			while (d > currStmt.depth) {
				env = envs.pop()
				d -= 2
			}

			currState = env.currState
			lastState = env.lastState
			lastStmt = env.lastStmt
		}

		try {
			lintStmt(currStmt, lastStmt, line, lastLine, lineCursor)
		} catch (error) {
			console.error(error.message)
			continue
		}

		let newState
		try {
			let {
				curr,
				last
			} = ingestStmt(currStmt, lastStmt, currState, lastState, line)
			newState = curr
			lastState = last
		} catch (e) {
			console.error(e.message)
		}

		let tabIncreased = currStmt && lastStmt && currStmt.depth > lastStmt.depth
		if (tabIncreased && currStmt.rule === 'cond') {
			envs.push({
				currState,
				lastState,
				currStmt,
				lastStmt
			})
			lastState = currState
			lastLine = line
			lastStmt = currStmt
			return parseLines(lines)
		}

		//if a new state is found
		if (newState.id && (newState.id !== currState.id)) {
			//populate the parent state with a child
			if (!lastState.states.hasOwnProperty(newState.id)) {
				if (lastState.states.play) {
					if (lastStmt.rule === 'cond' && lastStmt.result.isParallel) {
						lastState.states.play.states.action.states[newState.id] = newState
					} else {
						lastState.states.play.states[newState.id] = newState
					}
				} else { //for root
					lastState.states[newState.id] = newState
					newState.on.update = []
				}
			}
		}

		currState = newState
		lastLine = line
		lastStmt = currStmt
	}

	return lastState
}

function lintStmt(stmt, lastStmt, line, lastLine, lineCursor) {
	if (!lastStmt) {
		return
	}
	let lines = `\n${lineCursor-1}:${lastLine}\n${lineCursor}:${line}`
	switch (stmt.rule) {
		case 'transition':
			switch (lastStmt.rule) {
				case 'comment':
				case 'action':
					break
				default:
					throw `Error: transition must follow an action.${lines}`
			}
			break
		case 'sceneHeading':
			switch (lastStmt.rule) {
				case 'comment':
				case 'action':
				case 'transition':
					break
				default:
					throw `Error: sceneHeading must follow an action or a transition${lines}`
					break;
			}
			break
		case 'shot':
			switch (lastStmt.rule) {
				case 'comment':
				case 'action':
				case 'transition':
				case 'sceneHeading':
				case 'cond':
					break
				default:
					throw `Error: shot heading must follow an action, transition or sceneHeading${lines}`
					break;
			}
			break
		case 'action':
			switch (lastStmt.rule) {
				case 'comment':
				case 'action':
				case 'shot':
				case 'cond':
					break
				default:
					throw `Error: action must follow a shot heading, or another action${lines}`
					break;
			}
			break
		case 'cond':
			switch (lastStmt.rule) {
				case 'comment':
				case 'action':
				case 'shot':
				case 'cond':
					break
				default:
					throw `Error: conditions must follow an action, shot heading, or a previous condition${lines}`
					break;
			}
			break
	}
}

//post-processing statements
//TODO: remove mutation of currState, lastState - could get nasty
function ingestStmt(currStmt, lastStmt, currState, lastState, line) {
	let obj = JSON.parse(JSON.stringify(currStmt.result))
	let curr = Object.assign({}, currState)
	let last = Object.assign({}, lastState)

	//TODO: error checking
	switch (currStmt.rule) {
		case 'comment':
			if (!curr.comments) {
				curr.comments = []
			}
			curr.comments += obj.comment
			break
		case 'sceneHeading':
			curr = makeState(curr)
			curr.meta.scene = obj
			break
		case 'shot':
			curr = makeState(curr)
			curr.id = line 
			//for target: 'inTransition'
			curr.states.load.on.update[0].cond = `ctx.buffer['${curr.id}'].load.done`
			curr.meta.shotType = obj.viewType
			if (obj.viewMovement) {
				curr.meta.movementType = obj.viewMovement
			}

			if (transitions.length) {
				let t = transitions.pop()
				applyTransition(t.from, curr, obj.shotTime, t.transitionTime, t.transitionType, t && t.cond ? t.cond.result : undefined)
			} else {
				applyTransition(currState, curr, obj.shotTime, obj.transitionTime)
			}

			break
		case 'action':
			curr.states.play.states.action.meta.marker = obj.marker
			curr.states.play.states.action.states.lines.initial = '0'
			let totalTime = 0
			let states = [...Object.values(curr.states.play.states.action.states.lines.states), ...obj.lines].map((a, idx, arr) => {
				let s = {
					meta: {
						text: a.meta ? a.meta.text : a.text,
						time: a.meta ? a.meta.time : a.time
					},
					on: {},
					after: {},
					states: {}
				}
				let time = Math.max(1000, timeToMS(a.meta ? a.meta.time : a.time))
				totalTime += time
				s.after = {}
				s.after[time] = ((idx + 1) % arr.length).toString()
				return s
			})
			curr.states.play.states.action.states.lines.states = states
			break
		case 'transition': //push transition onto a stack and, once the next state's id is known, apply its transition condition to the prev state
			transitions.push({
				...obj,
				from: curr
			})
			curr = makeState(curr)
			break
		case 'cond':
			break
	}

	//always name current states after their play condition
	if (lastStmt && lastStmt.rule === 'cond') {
		curr.id = lastLine
		let conds = getConds(lastStmt.result)
		if (lastStmt.result.isParallel) {
			//for first target 'inTransition'
			curr.states.load.on.update[0].cond = conds
			//if the result is parallel, get rid of its link back to action
			curr.on.update = []
		} else {
			curr.states.load.on.update[0].cond = `ctx.buffer['${lastLine}'].load.done`
			last.states.play.states.action.on.update = [...last.states.play.states.action.on.update, {
				target: curr.id,
				cond: conds
			}]
		}

		guards[lastLine] = parseConditions(conds)
	}

	//initialize last if needed
	if (!last.initial && curr.id && last.isRoot) {
		last.initial = curr.id
	}

	return {
		curr,
		last
	}
}

function parseConditions(cond) {
	let s = `function (ctx,evt){return ${cond}}`
	var funcReg = /function *\(([^()]*)\)[ \n\t]*{(.*)}/gmi;
	var match = funcReg.exec(s.replace(/\n/g, ' '))

	if (match) {
		return new Function(match[1].split(','), match[2]).bind(this)
	}

	return null;
}

function SELECT(x) {
	return true
}

function FOO(x) {
	return 'FOO' + x
}

function getConds(cond) {
	let getOp = (op, args) => `ctx.${op}(ctx.${args.replace(/\/$/, "")})`

	if (!cond) {
		return ''
	} else if (cond.op === 'AND') {
		return `${getConds(cond.lhs.result)} && ${getConds(cond.rhs.result)}`
	} else if (cond.op === 'OR') {
		return `${getConds(cond.lhs.result)} || ${getConds(cond.rhs.result)}`
	} else {
		let path = cond.rhs.map(c => `${c.root}/${c.path.join('/')}`).join(',')
		return getOp(cond.op, path)
	}
}

function applyTransition(from, to, shotTime, transitionTime, transitionType, cond) {
	if (!transitionType) {
		transitionType = 'CUT'
	}

	to.states.inTransition.meta.type = transitionType
	from.states.outTransition.meta.type = transitionType

	let condStateId = cond ? getConds(cond) : undefined
	from.states.play.on.update = [{
		target: `outTransition`,
		cond: condStateId
	}]
	from.after = {}
	from.on.update = [{
		target: to.id,
		in: 'outTransition' //TODO: figure out why this isnt working
	}]
	to.states.inTransition.after = {}
	to.states.inTransition.after[timeToMS(transitionTime)] = 'play'
}

function timeToMS(time){
	return time ? ((time.min * 60) + time.sec) * 1000 : 0
}

function makeState(currState) {
	let state = {
		id: undefined,
		initial: 'preload',
		meta: {
			scene: currState && currState.meta ? currState.meta.scene : undefined,
			shotType: currState && currState.meta ? currState.meta.shotType : undefined,
			movementType: currState && currState.meta ? currState.meta.movementType : undefined,
		},
		on: {
			update: [{
				target: 'action',
				in: 'outTransition'
			}]
		},
		states: {
			preload: {
				on: {
					update: [{
						target: "load",
						cond: undefined
					}]
				},
				states: {}
			},
			load: {
				on: {
					update: [{
						target: 'inTransition',
						cond: undefined
					}]
				},
				states: {}
			},
			inTransition: {
				after: {
					1000: 'play'
				},
				meta: {
					type: currState && currState.states.inTransition ? currState.states.inTransition.meta.type : undefined
				},
				states: {}
			},
			play: {
				initial: 'action',
				on: {
					update: [{
						target: "outTransition",
						cond: undefined
					}]
				},
				states: {
					action: {
						parallel: true,
						meta: {},
						on: {
							update: []
						},
						after: {

						},
						states: {
							lines: {
								initial: undefined,
								states:{

								}
							}
						}
					}
				}
			},
			outTransition: {
				type: 'final',
				meta: {
					type: currState && currState.states.outTransition ? currState.states.outTransition.meta.type : undefined
				},
				on: {
					update: 'preload'
				}
			}
		}
	}
	return state
}

var actions = {
	shot: assign({
		cameraType: (ctx, evt) => evt.type,
		target: (ctx, evt) => evt.target,
		source: (ctx, evt) => evt.source,
		shotTime: (ctx, evt) => evt.shotTime,
		transitionType: (ctx, evt) => evt.transitionType,
		movementTime: (ctx, evt) => evt.movementTime
	})
}
module.exports.actions = actions

var guards = {
	//"SELECT - BUSH_A - AND - SELECT - BUSH_B": (ctx, evt) => 'select(ctx.BUSH_A) && select(ctx.BUSH_B)'.parseFunction()
}
module.exports.guards = guards

var context = {
	BUSH_A: true,
	BUSH_B: false,
	LUL: false,
	SELECT: SELECT,
	FOO: FOO,
	WOW: FOO,
	BOOM: FOO,
	TREE: false,
}