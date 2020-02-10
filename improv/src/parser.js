const Machine = require('xstate').Machine
const assign = require('xstate').assign
const nearley = require('nearley')
const grammar = require('./grammar')
const uuidv4 = require('uuid/v4')
const util = require('util')
const fs = require('fs')

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
	if (results.cond) return results.cond
	if (results.comment) return results.comment
	if (results.loadScript) return results.loadScript
	return results
}

const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *t*$/) !== null

//TODO: make stream creation stateless
let stream = {
	id: "stream",
	type: 'parallel',
	states: {
		loaders: {
			type: 'parallel',
			states: {}
		},
		units: {
			isRoot: true,
			on: {},
			states: {}
		}
	}
}

function makeLoadState(id) {
	let loaderId = `LOAD - ${id}`
	let state = {
		id: loaderId,
		initial: 'shouldUnload',
		states: {
			'shouldUnload': {
				after: {
					[DEFAULT_UPDATE_TICK]: ['shouldUnload',
						{
							target: 'shouldLoad',
							cond: 'isLoaded'
						}]
				},
			},
			'shouldLoad': {
				after: {
					[DEFAULT_UPDATE_TICK]: ['shouldLoad',
						{
							target: 'shouldUnload',
							cond: 'isShouldUnload'
						}]
				}
			},
		}
	}
	return state
}

module.exports.impToStream = impToStream

async function impToStream(filePath, script, readScriptFileAndParse) {
	let u = {
		isRoot: true,
		on: {},
		states: {}
	}
	let rootUnit = await parseLines(filePath, readScriptFileAndParse, script, u)//stream.states.units)
	isCyclic(rootUnit)
	//stream.states.units = rootUnit
	//return stream
	return rootUnit
}

function isCyclic(obj) {
	var keys = [];
	var stack = [];
	var stackSet = new Set();
	var detected = false;

	function detect(obj, key) {
		if (obj && typeof obj !== 'object') {
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

async function parseLines(filePath, readScriptFileAndParse,
	lines,
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
		} else if (currStmt.rule === 'loadScript') {
			let path = filePath.slice(0, filePath.lastIndexOf('/'))
			path = path.slice(0, path.lastIndexOf('/'))
			path = `${path}${currStmt.result.path}${currStmt.result.path.slice(currStmt.result.path.lastIndexOf('/'))}`
			let parsedScript = await readScriptFileAndParse(`${path}.imp`, { json: true })
			const writeFile = util.promisify(fs.writeFile)
			await writeFile(`${path}.json`, parsedScript)
			let scriptPath = `${path}.json`
			let loadState = {
				id: `LOAD - ${scriptPath} - ${uuidv4()}`,
				initial: 'loading',
				meta: { type: 'loadScript', path: scriptPath },
				states: {
					loading: {}
				}
			}
			parentState.states.interactive.states = {...parentState.states.interactive.states, [loadState.id]: loadState}
			continue
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

		try {
			lintStmt(filePath, currStmt, prevStmt, line, lastLine, lineCursor)
		} catch (error) {
			console.error(error)
			process.exit(1)
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
			return parseLines(filePath, readScriptFileAndParse,
				lines,
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

		currState = curr

		lastLine = line
		prevStmt = currStmt
	}

	return parentState
}

function lintStmt(filePath, currStmt, prevStmt, line, lastLine, lineCursor) {
	let lines = `\n${lineCursor - 1}:${lastLine}\n>>${lineCursor}:${line}`

	if (!prevStmt) {
		if (currStmt.depth > 0) {
			throw `[${filePath}] Error: first statement must be unindented${lines}`
		}
		return
	}

	switch (currStmt.rule) {
		case 'transition':
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
				case 'action':
					if (prevStmt.depth !== currStmt.depth) {
						throw `[${filePath}] Error: transitions must have the same depth as the action before them${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: transition must follow an action.${lines}`
			}
			break
		case 'sceneHeading':
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
				case 'action':
				case 'transition':
					if (prevStmt.depth !== currStmt.depth) {
						throw `[${filePath}] Error: sceneHeading must have the same depth as the statement before it${lines}`
					}
					break
				case 'cond':
					if (prevStmt.depth === currStmt.depth) {
						throw `[${filePath}] Error: sceneHeadings that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: sceneHeading must follow an action or a transition${lines}`
					break;
			}
			break
		case 'shot':
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
				case 'action':
				case 'transition':
				case 'sceneHeading':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === currStmt.depth) {
						throw `[${filePath}] Error: shots that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: shot heading must follow an action, transition or sceneHeading${lines}`
					break;
			}
			break
		case 'action':
			if (currStmt.result.fromCont && !continuedActions.find(a => a.contTo)) {
				throw `[${filePath}] Error: continued action must have a previous`
			}
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
				case 'action':
				case 'shot':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === currStmt.depth) {
						throw `[${filePath}] Error: actions that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: action must follow a shot heading, or another action${lines}`
					break;
			}
			break
		case 'cond':
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
					break
				case 'action':
				case 'shot':
					//TODO: explore eliminating rule that conditions be indented under actions
					if (prevStmt.depth === currStmt.depth) {
						throw `[${filePath}] Error: conditions must always be indented under the action or shot that preceeds them${lines}`
					}
					break
				case 'cond':
					break
				default:
					throw `[${filePath}] Error: conditions must follow an action, shot heading, or a previous condition${lines}`
					break;
			}
			break
	}

	if (tabIncreased(currStmt, prevStmt)) {
		if (currStmt.depth - prevStmt.depth > 1) {
			throw `[${filePath}] Error: statement depth greater than parent${lines}`
		}
		if (currStmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (tabDecreased(currStmt, prevStmt)) {
		if (prevStmt.rule === 'action') {
			let depth = prevStmt.depth - currStmt.depth
			let isOdd = n => n % 2
			if (currStmt.rule === 'cond') {
				if (!isOdd(depth)) {
					throw `[${filePath}] Error: statement depth decreased and does not align with a parent action's conditions${lines}`
				}
			} else if (isOdd(depth)) {
				throw `[${filePath}] Error: statement depth decreased and does not align with a parent unit's action${lines}`
			}
		} else {
			throw `[${filePath}] Error: statement depth decreased but previous statement was not an action${lines}`
		}
	}
}

function addChild(parent, child) {
	if (parent.isRoot) {
		parent.states[child.id] = child
	} else if (parent.meta.type === 'action') {
		parent.states[child.id] = child
	} else if (parent.states.interactive) {
		parent.states.interactive.states[child.id] = child
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
		case 'loadScript':
			if (!curr.comments) {
				curr.comments = []
			}
			curr.comments += obj.comment
			break
		case 'sceneHeading':
			curr = makeState()
			curr.states.setView.meta.scene = obj
			break
		case 'shot':
			curr = makeState(currState)
			curr.id = `${line} - ${uuidv4()}` // line
			curr.meta.type = currStmt.rule
			addChild(parent, curr)

			makeLoader(curr)

			curr.states.setView.meta.viewSource = obj.viewSource ? obj.viewSource : obj.viewTarget
			curr.states.setView.meta.viewTarget = obj.viewTarget
			curr.states.setView.meta.shotType = obj.viewType
			if (obj.viewMovement) {
				curr.states.setView.meta.movementType = obj.viewMovement
			}
			curr.states.setView.meta.shotTime = obj.shotTime

			if (transitions.length) {
				let t = transitions.pop()
				if (t.from.id) {
					applyTransition(t.from, curr, obj.shotTime, t.transitionTime, t.transitionType, t && t.cond ? t.cond.result : undefined)
				} else {
					curr.states.inTransition.meta.type = t.transitionType
				}
			} else if (currStmt.rule === 'action' && parent.id === currState.id) {
				let currAction = parent.states.interactive.states[parent.meta.actionCount - 1]
				applyTransition(currAction, curr, obj.shotTime, obj.transitionTime)
			}

			break
		case 'action':
			let isContinuedAction = obj.fromCont
			let action = isContinuedAction ? continuedActions.pop() : makeAction(`action_${uuidv4()}`)
			action.meta.type = currStmt.rule
			action.meta.marker = obj.marker
			action.meta.unmarker = obj.unmarker

			//create states for each action line and name them after the total interactive time
			let startTime = action.meta.interactiveTime
			let lineStates = [...Object.values(action.states.lines.states), ...obj.lines].map(a => {
				let s = {
					id: uuidv4(),
					meta: {
						speaker: a.meta ? a.meta.speaker : a.speaker,
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
				action.meta.interactiveTime = startTime
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
			curr.states.interactive.states[curr.meta.actionCount] = action
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
			curr.meta.type = currStmt.rule
			curr.id = `${line} - ${uuidv4()}` // line

			//TODO: cleanup this assignment into something more generalizable
			//copy over scene info to new state
			curr.states.setView.scene = currState && currState.states.setView.meta.scene ? currState.states.setView.meta.scene : undefined,
				curr.states.setView.shotType = currState && currState.states.setView.meta.shotType ? currState.states.setView.meta.shotType : undefined,
				curr.states.setView.movementType = currState && currState.states.setView.meta.movementType ? currState.states.setView.meta.movementType : undefined,

				makeLoader(curr)

			let prev = currState.states.interactive.states[currState.meta.actionCount - 1]
			if (!prev) {
				prev = currState
			}
			addChild(prev, curr)

			applyTransition(prev, curr, prev.meta.interactiveTime, 0, 'CUT', currStmt.result)

			parent = curr
			break
	}

	return {
		curr,
		parent
	}
}

//update every DEFAULT_UPDATE_TICK in ms
const DEFAULT_UPDATE_TICK = 16

function addUpdateLoop(state, target) {
	state.after[DEFAULT_UPDATE_TICK] = {
		//internal: true,
		target
	}
}

function makeLoader(curr) {
	curr.states.unloadFar.onEntry = ['log', 'incRec']
	curr.states.loadNear.onEntry = ['log', 'decRec']

	let loader = makeLoadState(curr.id)
	stream.states.loaders.states[loader.id] = loader
	curr.states.loadNear.after = {
		0: { //upon immediate entry
			target: 'setView',
			in: `#stream.loaders.${loader.id}.shouldLoad`
		}
	}
	addUpdateLoop(curr.states.loadNear, 'loadNear')
}

function applyTransition(from, to, shotTime, transitionTime, transitionType, condition) {
	if (!transitionType) {
		transitionType = 'CUT'
	}

	//TODO: refactor to parallel shouldLoad state
	//from.states.loadNear.on.update.push({target: 'interactive', cond:`'${to.id}'].loadNear.done`})
	to.states.inTransition.meta.type = transitionType
	if (from.states.outTransition) {
		from.states.outTransition.meta.type = transitionType
	}

	let cond = condition ? getConds(condition) : undefined
	let interactiveState = from.states.interactive
	if (interactiveState) {
		interactiveState.after[0] = undefined
		interactiveState.after[timeToMS(shotTime)] = {
			target: 'outTransition',
			cond
		}
		if (cond) {
			addUpdateLoop(interactiveState, interactiveState.id)
		}
	}

	from = from.states.lines && from.states[to.id] ? from.states.lines : from
	if (from.after) {
		let t = timeToMS(shotTime)
		//HACK: workaround nearly.js only supporting one slot per after time
		while (from.after[t]) t += 1

		from.after[t] = {
			target: to.meta.index ? to.meta.index : to.id,
			cond,
			in: 'outTransition'
		}
		if (cond) {
			addUpdateLoop(from)
		}
	}

	to.states.inTransition.after = {}
	to.states.inTransition.after[timeToMS(transitionTime)] = 'interactive'

	//loop back to start of transition
	let target = from.meta.from ? from.meta.from : `#${from.id}`
	to.after[timeToMS(shotTime)] = {
		target
	}
	from.meta.from = undefined
	to.meta.from = target
}

function getConds(cond) {
	if (cond.lhs && cond.rhs) {
		return {
			type: cond.op,
			lhs: getConds(cond.lhs.result),
			rhs: getConds(cond.rhs.result)
		}
	} else {
		return {
			type: cond.op,
			root: cond.rhs.root,
			path: cond.rhs.path
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
		initial: 'unloadFar',
		meta: {
			actionCount: 0
		},
		after: {},
		states: {
			unloadFar: {
				after: {
					0: {
						target: "loadNear",
						cond: undefined
					}
				},
				onEntry: {},
				states: {}
			},
			loadNear: {
				after: {
					//0: {
					//	target: 'inTransition',
					//	in: undefined
					//}
				},
				onEntry: {},
				states: {}
			},
			setView: {
				meta: {
					scene: templateState && templateState.states.setView.meta.scene ? templateState.states.setView.meta.scene : undefined,
					shotType: templateState && templateState.states.setView.meta.shotType ? templateState.states.setView.meta.shotType : undefined,
					movementType: templateState && templateState.states.setView.meta.movementType ? templateState.states.setView.meta.movementType : undefined,
				},
				after: {
					0: 'inTransition'
				}
			},
			inTransition: {
				after: {
					0: 'interactive'
				},
				meta: {
					type: templateState && templateState.states.inTransition ? templateState.states.inTransition.meta.type : undefined
				},
				states: {}
			},
			interactive: {
				type: 'parallel', //TODO: sequentialize interactive states
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
			interactiveTime: 0
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

const actions = require('./actions')
const guards = require('./guards')

function printMachineOptions(actions, guards) {
	return `{
	actions: {
		log,
		${Object.keys(actions).reduce((fns, f) => {
		if (f === 'log') { return fns }
		else {
			return `
	$ {
		fns ? fns + ',' : fns
	}
	$ {
		f
	}: assign({
		refs: $ {
			f
		}
	})
	`}
	}, '')},
	},
	guards: {
		${Object.keys(guards).reduce((fns, f) =>
		`${fns ? fns + ',' : fns}
			${f}`
		, '')}
	}
}`
}

function machineOptions(actions, guards) {
	return ({
		actions: Object.keys(actions).reduce((fns, f) => ({
			...fns,
			[f]: assign({
				refs: actions[f]
			})
		}), {}),
		guards: Object.keys(guards).reduce((fns, f) => ({
			...fns,
			[f]: guards[f]
		}), {})
	})
}

const machineContext = {
	refs: {}
}

module.exports.generateMachine = generateMachine

function generateMachine(jsonDefinition) {
	return Machine(jsonDefinition, printMachineOptions(actions, guards), machineContext)
}

module.exports.jsonToXStateMachine = jsonToXStateMachine

function jsonToXStateMachine(jsonDefinition) {
	return `
	import { Machine } from 'xstate'

	export const gameMachine = Machine(${jsonDefinition},\n
		${printMachineOptions},\n
		${JSON.stringify(machineContext)})\n
		var funcs = {}\n
	${printExports(actions)}\n
	${printExports(guards)}
	`
}

function printExports(funcs) {
	return `${Object.keys(funcs).reduce((fns, f, idx, exports) => `${fns}\n\n${funcs[f].toString()}\nfuncs[${f}] = ${f}`, '')}`
}