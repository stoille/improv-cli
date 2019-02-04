const nearley = require('nearley')
const grammar = require('./grammar')

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
function ingestStmt(state, stmt) {
	let s = Object.assign({}, state)
	let isArray = stmt.result.length
	let obj = isArray ? stmt.result : Object.assign({}, stmt.result)

	//TODO: error checking
	switch (stmt.rule) {
		case 'comment':
			if (!s.comments) {
				s.comments = []
			}
			s.comments += obj.comment
			break
		case 'sceneHeading':
			s.sceneHeading = obj.sceneHeading
			break
		case 'shot':
			s.id = obj.viewSource.root
			s.states.action.states.load.update = [{
				target: 'ready',
				cond: `#${s.id}.action.states.load.loaded`,
				in: `#${s.id}.action.states.load.loaded`,
			}]
			s.states.action.states.play.viewType = obj.viewType
			if (obj.viewMovement){
				s.states.action.states.play.states.viewMovement.viewMovementType = obj.viewMovement
			}
			break
		case 'action':
			s.states.action.states.play.states.lines.states = obj.map((a, idx) => ({
				text: a.text,
				time: a.time,
				on: {
					onDone: (idx + 1).toString()
				}
			})).reduce((al, a, idx) => {
				al[idx] = a
				return al
			}, {})
			break
		case 'transition':
			s.states.action.states.load.on.update = [...s.states.action.states.load.on.update, {
				target: 'ready',
				cond: `loaded`,
				in: `loaded`,
			}]
			s.states.action.states.play.states.viewTransition.viewTransitionType = obj.viewTransitionType
			break
		case 'cond':
			s.id = `${obj.reduce((s, c) => s ? `${s},${c.rhs.root}` : c.rhs.root, null)}`
			s.states.action.states.load.on.update = [...s.states.action.states.load.on.update, {
				target: 'ready',
				cond: `#${s.id}.${s.id}.load.loaded`,
				in: `#${s.id}.${s.id}.load.loaded`
			}]
			s.states.action.states.ready.on[obj.op] = [{
				target: 'play',
				cond: getOp(obj.op)
			}]
			break
	}
	return s
}

function getOp(op, args) {
	switch (op) {
		case 'TOUCH':
			return `isTouching('${args}')`
			break
		default:
			return `${op}('${args}')`
			break
	}
}

const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null
const canSkipStmt = s => !s || typeof s === 'number'
let lineCursor = 0

function parseLines(lines, depth = 0, lastStmt, lastLine) {
	let states = {}
	let parent = newState()

	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively
	while (lineCursor < lines.length) {
		let line = lines[lineCursor++]
		let stmt = parseLine(line)

		let tabDecreased = stmt && stmt.depth < depth
		if (tabDecreased) {
			break
		}

		if (isEmptyOrSpaces(line)) {
			continue
		}

		try {
			lintStmt(stmt, lastStmt, line, lastLine, lineCursor)
		} catch (error) {
			console.error(error)
			continue
		}

		let child = ingestStmt(parent, stmt)
		if (child.error) {
			console.error(child.error)
			continue
		}

		if (stmt.rule === 'cond') {
			let childStates = parseLines(lines, depth + 1, lastStmt, lastLine)
			child.states = { ...child.states,
				...childStates
			}
			parent.states[child.id] = child
		} else if(child.id){
			states[child.id] = child
		}
		
		if (stmt.rule !== 'comment') {
			lastStmt = stmt
			lastLine = line
		}
	}
	return states
}
module.exports.parseLines = parseLines

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

function newState(prevState) {
	let state = ({
		id: prevState ? prevState.id : undefined,
		parallel: true,
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
							update: []
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
						viewType: prevState ? prevState.states.action.states.play.viewType : undefined,
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
								viewMovementType: prevState ?prevState.states.action.states.play.viewMovementType : undefined,
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
								viewTransitionType: prevState ? prevState.states.action.states.play.viewTransitionType : undefined,
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