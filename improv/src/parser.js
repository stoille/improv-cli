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

//post-processing statements
//TODO: remove mutation of currState, lastState - nasty
function ingestStmt(stmt, lastStmt, currState, lastState) {
	let obj = stmt.result
	let curr = Object.assign({}, currState)
	let last = Object.assign({}, lastState)

	//TODO: error checking
	switch (stmt.rule) {
		case 'comment':
			if (!curr.comments) {
				curr.comments = []
			}
			curr.comments += obj.comment
			break
		case 'sceneHeading':
			curr.sceneHeading = obj.sceneHeading
			break
		case 'shot':
			curr.id = obj.viewSource.root
			curr.states.action.states.load.update = [{
				target: 'ready',
				cond: `#${curr.id}.action.states.load.loaded`,
				in: `#${curr.id}.action.states.load.loaded`,
			}]
			curr.states.action.states.play.viewType = obj.viewType
			if (obj.viewMovement) {
				curr.states.action.states.play.states.viewMovement.viewMovementType = obj.viewMovement
			}
			break
		case 'action':
			curr.states.action.states.play.states.lines.states = [...Object.values(curr.states.action.states.play.states.lines.states), ...obj].map((a, idx, arr) => ({
				text: a.text,
				time: a.time,
				on: {
					onDone: (idx === arr.length - 1 ? idx : idx + 1).toString()
				}
			})).reduce((al, a, idx) => {
				al[idx] = a
				return al
			}, {})
			break
		case 'transition': //push transition onto a stack and, once the next state's id is known, apply its transition condition to the prev state
			transitions.push(obj)
			break
		case 'cond':
			curr.states.action.states.ready.on.update = [{
				target: 'play',
				cond: obj.map(cond => getOp(cond.op, JSON.stringify(cond.rhs).replace(/\"([^(\")"]+)\":/g, "$1:")))
			}]
			break
	}
	//always name current states after their play condition
	if (lastStmt && lastStmt.rule === 'cond') {
		curr.id = `${lastStmt.result.reduce((s, c) => s ? `${s},${c.rhs.root}` : c.rhs.root, null)}`
	}
	return {curr,last}
}

function getOp(op, args) {
	switch (op) {
		default:
			return `${op}(${args})`
			break
	}
}

function applyTransition(obj, currState, lastState){
	currState.states.action.states.play.states.viewTransition.viewTransitionType = obj.transitionType
	lastState.on.update = [{
		target: currState.id,
		cond: obj.cond ? obj.cond.map(cond => getOp(cond.op, JSON.stringify(cond.rhs).replace(/\"([^(\")"]+)\":/g, "$1:"))) : undefined
	}]
}

const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null

let lineCursor = 0,
	lastStmt, lastLine, envs = []
let lastState = {
	id: "root",
	on: {},
	states: {}
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
		let currStmt = parseLine(line)

		if (currStmt.rule === 'comment' ||
			isEmptyOrSpaces(line)) {
			continue
		}

		let tabDecreased = currStmt && lastStmt && currStmt.depth < lastStmt.depth
		if (tabDecreased) {
			let env = envs.pop()
			currState = env.currState
			lastState = env.lastState
			lastStmt = env.lastStmt
			//break
		}

		try {
			lintStmt(currStmt, lastStmt, line, lastLine, lineCursor)
		} catch (error) {
			console.error(error)
			continue
		}

		let newState
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
			newState = parseLines(lines)
			currState.states[newState.id] = newState 
			continue
		}

		try {
			let {curr,last} = ingestStmt(currStmt, lastStmt, currState, lastState)
			newState = curr
			lastState = last
		} catch (e) {
			console.error(e)
		}

		if (newState.id && (newState.id !== currState.id)) {
			if(currState.id){
				lastState = currState
			}
			if (!lastState.states.hasOwnProperty(newState.id)) {
				lastState.states[newState.id] = newState
			}

			currState = newState

			//if there are any positions, apply them now that the newstate id is known
			if(transitions.length){
				applyTransition(transitions.pop(), currState, lastState)
			}
		}

		lastLine = line
		lastStmt = currStmt
	}
	
	return currState
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

function makeState(currState, parallel = true) {
	let state = ({
		id: undefined,
		parallel: parallel,
		on: {
			update: []
		},
		states: {
			action: {
				initial: "preload",
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
								cond: "loaded",
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
							update: []
						}
					},
					play: {
						parallel: true,
						viewType: currState && currState.states.action ? currState.states.action.states.play.viewType : undefined,
						on: {
							pause: "pause"
						},
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
								states: {}
							},
							viewMovement: {
								initial: "play",
								viewMovementType: currState && currState.states.action ? currState.states.action.states.play.viewMovementType : undefined,
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
							viewTransition: {
								initial: "play",
								viewTransitionType: currState && currState.states.action ? currState.states.action.states.play.viewTransitionType : undefined,
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
					pause: {
						on: {
							play: "play"
						}
					}
				}
			}
		}
	})
	return state
}