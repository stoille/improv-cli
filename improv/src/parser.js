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

let lineCursor = 0, lastStmt, lastLine, envs = []
let lastState = {
	id: "root",
	on: {},
	states: {},
	isRoot: true
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
			while (d > currStmt.depth){
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
			if(!lastState.states.hasOwnProperty(newState.id)){
					lastState.states[newState.id] = newState
			}

			//if there are any positions, apply them now that the newstate id is known
			if (transitions.length) {
				let t = transitions.pop()
				applyTransition(t.from, newState, t.transitionType, t.cond)
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
			curr.states.action.states.play.scene = obj
			break
		case 'shot':
			curr = makeState(curr)
			curr.id = line//.trim()
			curr.states.action.states.load.update = [{
				target: 'ready',
				cond: `#${curr.id}.action.load.loaded`,
				in: `#${curr.id}.action.load.loaded`,
			}]
			curr.states.action.states.play.type = obj.viewType
			if (obj.viewMovement) {
				curr.states.action.states.play.states.movement.type = obj.viewMovement
			}
			
			if (transitions.length) {
				let t = transitions.pop()
				applyTransition(t.from, curr, t.transitionType, t && t.cond ? t.cond.result : undefined)
			} else {
				applyTransition(currState, curr)
			}
			
			break
		case 'action':
			curr.states.action.marker = obj.marker
			curr.states.action.states.play.states.lines.states = [...Object.values(curr.states.action.states.play.states.lines.states), ...obj.text].map((a, idx, arr) => ({
				text: a.text,
				time: a.time,
				on: {
					onDone: (idx === arr.length - 1 || idx === arr.length - 2 ? 'done' : idx + 1).toString()
				}
			})).reduce((al, a, idx, arr) => {
				let i = idx < arr.length - 1 ? idx : 'done'
				al[i] = a
				return al
			}, {})
			break
		case 'transition': //push transition onto a stack and, once the next state's id is known, apply its transition condition to the prev state
			transitions.push({ ...obj,
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
		curr.states.action.states.ready.on.update = [{
			target: 'play',
			cond: conds
		}]

		guards[lastLine] = parseConditions(conds)

		last.states.action.states.load.on.update = [{
			target: 'ready',
			in: [...last.states.action.states.load.on.update[0].in,
				`#${lastLine}.action.ready`]
		}]
	}

	//initialize last if needed
	if(!last.initial && curr.id){
		let isRoot = !last.parallel && !last.initial
		last.initial = isRoot ? curr.id : last.initial
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

function getConds(cond){
	let getOp = (op, args) => `ctx.${op}(ctx.${args.replace(/\/$/, "")})`
	
	if(!cond){
		return ''
	} else if(cond.op === 'AND'){
		return `${getConds(cond.lhs.result)} && ${getConds(cond.rhs.result)}`
	} else if (cond.op === 'OR') {
		return `${getConds(cond.lhs.result)} || ${getConds(cond.rhs.result)}`
	} else {
		let path = cond.rhs.map(c => `${c.root}/${c.path.join('/')}`).join(',')
		return getOp(cond.op, path)
	}
}

function applyTransition(from, to, transitionType, cond) {
	if (!transitionType){
		transitionType = 'CUT'
	}
	
	to.states.action.states.play.states.transition.type = transitionType

	let condStateId = cond ? getConds(cond) : undefined
	from.on.update = [{
		target: to.id,
		cond: condStateId,
		in: 'action.done'
	}]
	to.states.action.states.ready.on.update = [{
		target: 'play',
		cond: condStateId,
		in: `#${from.id}.action.done`,
	}]
}

function makeState(currState, parallel = true) {
	let state = {
		id: undefined,
		parallel: parallel,
		initial: undefined,
		on: {
			update: []
		},
		states: {
			action: {
				initial: "preload",
				on: {},
				states: {
					preload: {
						on: {
							load: "load"
						}
					},
					load: {
						initial: "loading",
						on: {
							update: [{
								target: "ready",
								cond: undefined,
								in: "loaded"
							}]
						},
						states: {
							loading: {
								on: {
									onDone: "loaded"
								}
							},
							loaded: {}
						}
					},
					ready: {
						on: {
							preload: "preload",
							update: "play"
						}
					},
					play: {
						parallel: true,
						on: {
							update: [{
								target: "done",
								in: "action.done"
							}]
						},
						type: currState && currState.states.action ? currState.states.action.type : undefined,
						scene: currState && currState.states.action ? currState.states.action.states.play.scene : undefined,
						states: {
							isStarted: {
								initial: "false",
								states: {
									false: {
										on: {
											update: "true"
										}
									},
									true: {}
								}
							},
							lines: {
								initial: "0",
								states: {
									done: {}
								}
							},
							movement: {
								initial: "play",
								type: currState && currState.states.action ? currState.states.action.states.play.states.movement.type : undefined,
								states: {
									play: {
										on: {
											pause: "pause"
										}
									},
									pause: {
										on: {
											play: "play"
										}
									}
								}
							},
							transition: {
								initial: "play",
								type: currState && currState.states.action ? currState.states.action.states.play.states.transition.type : undefined,
								states: {
									play: {
										on: {
											pause: "pause"
										}
									},
									pause: {
										on: {
											play: "play"
										}
									}
								}
							}
						}
					},
					done: {
						on: {
							update: "preload"
						}
					}
				}
			}
		}
	}
	return state
}

var actions = {
	shot: assign({ 
		cameraType: (ctx,evt) => evt.type,
		target: (ctx, evt) => evt.target,
		source: (ctx, evt) => evt.source,
		shotTime: (ctx, evt) => evt.shotTime,
		transitionType: (ctx, evt) => evt.transitionType,
		transitionTime: (ctx, evt) => evt.transitionTime
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