const assign = require('xstate').actions.assign
const nearley = require('nearley')
const grammar = require('./grammar')
const uuidv4 = require('uuid/v4')

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

module.exports.impToXML = impToXML

function impToXML(script) {
	let parsedScript = parseLines(script, reel.states.units)
	isCyclic(parsedScript)
	return JSON.stringify(parseLines(script))
}

module.exports.impToJSON = impToJSON

function impToJSON(script) {
	let parsedScript = parseLines(script, reel.states.units)
	isCyclic(parsedScript)
	return JSON.stringify(parsedScript)
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

function tabIncreased(currStmt, prevStmt) {
	return currStmt && prevStmt && currStmt.depth > prevStmt.depth
}

function tabDecreased(currStmt, prevStmt) {
	return currStmt && prevStmt && currStmt.depth < prevStmt.depth
}
module.exports.parseLines = parseLines

function parseLines(lines,
	parentState,
	currState = makeState(),
	lineCursor = 0,
	prevStmt = undefined,
	lastLine = undefined,
	envs = [],
	transitions = [],
	continuedActions = []
) {
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
			process.exit(1)
		}

		if (currStmt.rule === 'comment' ||
			isEmptyOrSpaces(line)) {
			continue
		}

		try {
			lintStmt(currStmt, prevStmt, line, lastLine, lineCursor)
		} catch (error) {
			console.error(error)
			process.exit(1)
		}

		if (tabDecreased(currStmt, prevStmt)) {
			let d = prevStmt.depth - 2
			let env = envs.pop()
			while (d > currStmt.depth) {
				env = envs.pop()
				d -= 2
			}

			currState = env.currState
			parentState = env.parentState
			prevStmt = env.prevStmt
			transitions = env.transitions
			continuedActions = env.continuedActions
		}

		let {
			curr,
			parent
		} = ingestStmt(currStmt, prevStmt, currState, parentState, line, transitions)


		if (tabIncreased(currStmt, prevStmt) && currStmt.rule === 'cond') {
			envs.push({
				currState,
				parentState,
				currStmt,
				prevStmt,
				transitions,
				continuedActions
			})
			return parseLines(lines,
				parent,
				curr,
				lineCursor,
				currStmt,
				line,
				envs,
				transitions,
				continuedActions)
		}
		parentState = parent

		if (currState.id !== curr.id) {
			currState = curr
		}
		lastLine = line
		prevStmt = currStmt
	}

	return parentState
}

function lintStmt(currStmt, prevStmt, line, lastLine, lineCursor) {
	let lines = `\n${lineCursor-1}:${lastLine}\n>>${lineCursor}:${line}`

	if (!prevStmt) {
		if(currStmt.depth > 0){
			throw `Error: first statement must be unindented${lines}`
		}
		return
	}

	switch (currStmt.rule) {
		case 'transition':
			switch (prevStmt.rule) {
				case 'comment':
				case 'action':
					if (prevStmt.depth !== currStmt.depth) {
						throw `Error: transitions must have the same depth as the action before them${lines}`
					}
					break
				default:
					throw `Error: transition must follow an action.${lines}`
			}
			break
		case 'sceneHeading':
			switch (prevStmt.rule) {
				case 'comment':
				case 'action':
				case 'transition':
					if (prevStmt.depth !== currStmt.depth) {
						throw `Error: sceneHeading must have the same depth as the statement before it${lines}`
					}
					break
				case 'cond':
					if (prevStmt.depth === currStmt.depth) {
						throw `Error: sceneHeadings that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `Error: sceneHeading must follow an action or a transition${lines}`
					break;
			}
			break
		case 'shot':
			switch (prevStmt.rule) {
				case 'comment':
				case 'action':
				case 'transition':
				case 'sceneHeading':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === currStmt.depth) {
						throw `Error: shots that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `Error: shot heading must follow an action, transition or sceneHeading${lines}`
					break;
			}
			break
		case 'action':
			if (currStmt.result.fromCont && !continuedActions.find(a => a.contTo)) {
				throw `Error: continued action must have a previous`
			}
			switch (prevStmt.rule) {
				case 'comment':
				case 'action':
				case 'shot':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === currStmt.depth) {
						throw `Error: actions that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `Error: action must follow a shot heading, or another action${lines}`
					break;
			}
			break
		case 'cond':
			switch (prevStmt.rule) {
				case 'comment':
					break
				case 'action':
				case 'shot':
					//TODO: explore eliminating rule that conditions be indented under actions
					if (prevStmt.depth === currStmt.depth) {
						throw `Error: conditions must always be indented under the action or shot that preceeds them${lines}`
					}
					break
				case 'cond':
					break
				default:
					throw `Error: conditions must follow an action, shot heading, or a previous condition${lines}`
					break;
			}
			break
	}

	if (tabIncreased(currStmt, prevStmt)){ 
		if(currStmt.depth - prevStmt.depth > 1){
			throw `Error: statement depth greater than parent${lines}`
		}
		if(currStmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (tabDecreased(currStmt, prevStmt)) {
		if (prevStmt.rule === 'action') {
			let depth = prevStmt.depth - currStmt.depth
			let isOdd = n => n % 2
			if (currStmt.rule === 'cond') {
				if (!isOdd(depth)) {
					throw `Error: statement depth decreased and does not align with a parent action's conditions${lines}`
				}
			} else if (isOdd(depth)) {
				throw `Error: statement depth decreased and does not align with a parent unit's action${lines}`
			}
		} else {
			throw `Error: statement depth decreased but previous statement was not an action${lines}`
		}
	}
}

function addChild(parent, child) {
	if (parent.isRoot) {
		parent.states[child.id] = child
	} else if (parent.meta.type === 'action') {
		parent.states[child.id] = child
	} else if (parent.states.play) {
		parent.states.play.states[child.id] = child
	}
	if (child.id && !parent.parallel && !parent.initial) {
		parent.initial = child.id
	}
}

//post-processing statements
//TODO: remove mutation of currState, parentState - could get nasty
function ingestStmt(currStmt, prevStmt, currState, parentState, line, transitions) {
	let obj = JSON.parse(JSON.stringify(currStmt.result))
	let curr = Object.assign({}, currState)
	let parent = Object.assign({}, parentState)

	//TODO: error checking
	switch (currStmt.rule) {
		case 'comment':
			if (!curr.comments) {
				curr.comments = []
			}
			curr.comments += obj.comment
			break
		case 'sceneHeading':
			curr = makeState()
			curr.meta.scene = obj
			break
		case 'shot':
			curr = makeState(currState)
			curr.id = `${line} - ${uuidv4()}` // line
			curr.meta.type = 'shot'
			addChild(parent, curr)

			curr.meta.shotType = obj.viewType
			if (obj.viewMovement) {
				curr.meta.movementType = obj.viewMovement
			}
			curr.meta.shotTime = obj.shotTime

			if (transitions.length) {
				let t = transitions.pop()
				if(t.from.id){
					applyTransition(t.from, curr, obj.shotTime, t.transitionTime, t.transitionType, t && t.cond ? t.cond.result : undefined)
				}
			} else if (currStmt.rule === 'action' && parent.id === currState.id) {
				let currAction = parent.states.play.states[parent.meta.actionCount - 1]
				applyTransition(currAction, curr, obj.shotTime, obj.transitionTime)
			} else {
				applyTransition(currState, curr, obj.shotTime, obj.transitionTime)
			}

			break
		case 'action':
			let isContinuedAction = obj.fromCont
			let action = isContinuedAction ? continuedActions.pop() : makeAction(`action_${uuidv4()}`)
			action.meta.type = 'action'
			action.meta.marker = obj.marker

			//create states for each action line and name them after the total play time
			let startTime = action.meta.playTime
			let lineStates = [...Object.values(action.states.lines.states), ...obj.lines].map(a => {
				let s = {
					id: uuidv4(),
					meta: {
						text: a.meta ? a.meta.text : a.text,
						time: a.meta ? a.meta.time : a.time,
						startTime,
					},
					on: {},
					after: {},
					states: {}
				}
				let time = timeToMS(a.meta ? a.meta.time : a.time)
				startTime += time
				action.meta.playTime = startTime
				s.after = {}
				s.after[time] = startTime.toString()
				return s
			})
			//don't loop back last line on self
			let lastLineState = lineStates[lineStates.length - 1]
			lastLineState.after = {}
			//reduce into an object keyed off total time
			action.states.lines.states = lineStates.reduce((ls, s) => {
				ls[s.meta.startTime] = s
				return ls
			}, {})

			//action.id = undefined
			action.meta.index = curr.meta.actionCount
			curr.states.play.states[curr.meta.actionCount] = action
			curr.meta.actionCount += 1

			//push continued actions
			if (obj.contTo) {
				continuedActions.push(action)
			}
			break
		case 'transition': //push transition onto a stack and, once the next state's id is known, apply its transition condition to the prev state
			transitions.push({
				...obj,
				from: curr
			})
			break
		case 'cond':
			curr = makeState()
			curr.id = `${line} - ${uuidv4()}` // line
			let prev = currState.states.play.states[currState.meta.actionCount - 1]
			if(!prev){
				prev = currState
			}
			addChild(prev, curr)

			applyTransition(prev, curr, prev.meta.playTime, 0, 'CUT', currStmt.result)

			parent = curr

			let conds = getConds(currStmt.result)
			guards[line] = conds
			break
	}

	return {
		curr,
		parent
	}
}

function applyTransition(from, to, shotTime, transitionTime, transitionType, condition) {
	if (!transitionType) {
		transitionType = 'CUT'
	}

	//TODO: refactor to parallel load state
	//from.states.load.on.update.push({target: 'play', cond:`'${to.id}'].load.done`})
	to.states.inTransition.meta.type = transitionType
	if (from.states.outTransition) {
		from.states.outTransition.meta.type = transitionType
	}

	let cond = condition ? getConds(condition) : undefined
	let playState = from.states.play
	if (playState) {
		playState.after[0] = undefined
		playState.after[timeToMS(shotTime)] = {
			target: 'outTransition',
			cond
		}
	}

	from = from.states.lines && from.states[to.id] ? from.states.lines : from
	if (from.after) {
	//	from.after = {}
		from.after[timeToMS(shotTime)] = {
			target: to.meta.index ? to.meta.index : to.id,
			cond,
			in: 'outTransition'
		}
	}

	to.states.inTransition.after = {}
	to.states.inTransition.after[timeToMS(transitionTime)] = 'play'

	//loop back to start of transition
	let target = from.meta.from ? from.meta.from : `#${from.id}`
	to.after[timeToMS(shotTime)] = {
		target
	}
	from.meta.from = undefined
	to.meta.from = target
}

function SELECT(x) {
	return true
}

function FOO(x) {
	return 'FOO' + x
}

function getConds(cond) {
	if (cond.lhs && cond.rhs) {
		return {
			type: cond.op,
			lhs: getConds(cond.lhs.result),
			rhs: getConds(cond.rhs.result)
		}
	} else {
		let path = cond.rhs.map(c => `${c.root}/${c.path.join('/')}`).join(',').replace(/\/$/, "")
		return {
			type: cond.op,
			path
		}
	}
}

function timeToMS(time) {
	if (Number.isInteger(time)) {
		return time
	}
	const minToSec = min => 60 * min
	const secToMS = sec => 1000 * sec
	return time ? secToMS(minToSec(time.min) + time.sec) : 0
}

function makeState(templateState) {
	if (templateState && templateState.meta.type === 'action') {
		templateState = undefined
	}
	let state = {
		id: undefined, //`state_${uuidv4()}`, //TODO: use uuid
		initial: 'preload',
		meta: {
			scene: templateState && templateState.meta ? templateState.meta.scene : undefined,
			shotType: templateState && templateState.meta ? templateState.meta.shotType : undefined,
			movementType: templateState && templateState.meta ? templateState.meta.movementType : undefined,
			actionCount: 0
		},
		after: {},
		states: {
			preload: {
				after: {
					0: {
						target: "load",
						cond: undefined
					}
				},
				states: {}
			},
			load: {
				after: {
					0: {
						target: 'inTransition',
						in: undefined
					}
				},
				states: {}
			},
			inTransition: {
				after: {
					0: 'play'
				},
				meta: {
					type: templateState && templateState.states.inTransition ? templateState.states.inTransition.meta.type : undefined
				},
				states: {}
			},
			play: {
				parallel: true,
				after: {
					0: 'outTransition',
					cond: undefined
				},
				states: {}
			},
			outTransition: {
				type: 'final',
				id: `outTransition_${uuidv4()}`,
				meta: {
					type: templateState && templateState.states.outTransition ? templateState.states.outTransition.meta.type : undefined
				},
				on: {}
			}
		}
	}
	return state
}

function makeAction(id) {
	return {
		id,
		initial: 'lines',
		meta: {
			playTime: 0
		},
		after: {

		},
		states: {
			lines: {
				id: `lines - ${uuidv4()}`,
				after: {},
				meta: {
					type: 'lines'
				},
				initial: '0',
				states: {
					outTransition: {
						type: 'final',
						meta: {
							type: 'CUT'
						}
					}
				}
			}
		}
	}
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