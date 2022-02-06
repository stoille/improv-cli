/*
	TODO:
	1. migrate this script to TypeScript
	2. node types should be defined as new types that extends GraphNode from renderer/editor/graph/node.ts. json templates will break eventually
	3. consolidate global functions into Graph class
*/
import * as nearley from './nearley'
import * as grammar from './grammar'
import { readFile, writeFile, readJSON } from 'fs'
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null

const DEBUG = true

var ScriptTypes = {
	RETURN: "RETURN",
	VIEW: "VIEW",
	MARKER: "MARKER",
	UNMARKER: "UNMARKER",
	ACTION: "ACTION",
	JUMP: "JUMP",
	GOTO: "GOTO"
}
var NodeTypes = {
	VIEW: "VIEW",
	ACTION: "ACTION",
	SELECT: "SELECT",
	NEAR: "NEAR"
}

var CondTypes = {
	AND: "AND",
	OR: "OR",
	SELECT: "SELECT",
	TRUE: "TRUE",
	FALSE: "FALSE",
	INPUT: "INPUT",
	NEAR: "NEAR"
}

var ViewModes = {
	CONTINUE: "CONTINUE",
	RETURN: "RETURN",
	LOOP: "LOOP"
}

var JumpModes = {
	IMMEDIATE: "IMMEDIATE",
	CONDITION: "CONDITION",
	TRANSITION: "TRANSITION"
}

var graphs = {};

//HACK: node types should be defined as new types that extends GraphNode from renderer/editor/graph/node.ts
(async function InitializeGraphs() {
	if (Object.keys(graphs).length === 0) {
		for (let nodeType in NodeTypes) {
			const path = './nodeTypes/'
			graphs[nodeType] = await readJSON(`${path}${nodeType}`);
		}
	}
})()

var graphsManifest = []
var outputDirectory = undefined
var inputDirectory = undefined
var nextGraphStartTimeGlobal = 0

export async function generateGraphDataObjects(rootImprovScriptPath) {
	let extension = rootImprovScriptPath.split('.').pop()
	if (extension !== "imp") {
		console.error("File extension not supported. Improv script required.")
	}
	const outputDir = rootImprovScriptPath.slice(0, rootImprovScriptPath.lastIndexOf('/'))
	console.log(`parsing improv script to output directory: ${outputDir}`)
	let parsedScript = await readScriptFileAndParse(rootImprovScriptPath, outputDir, undefined, true)
	if (!parsedScript) {
		console.error("parsing error.")
	} else {
		console.log('improv script parsed...')
		return graphsManifest
	}
}

async function readScriptFileAndParse(scriptPath, outputDir, lastView, isFirstRun = false) {
	return new Promise(res => {
		readFile(scriptPath, { encoding: 'utf8' }, (err, rawText) => {
			if (err) {
				console.error(`error reading script (${scriptPath}): ${err}`)
			}
			let lines = rawText.split("\n")
			console.log(`lines: ${lines}`)
			let graph = await impToLGraph(scriptPath, ops.outputDir, readScriptFileAndParse, lines, lastView, isFirstRun)
			graphsManifest.push(graph)
			res(graph)
		})
	})
}

async function impToLGraph(filePath, outputDir, readScriptFileAndParse, lines, lastGraph, isFirstGraphInManifest) {
	if (!outputDirectory && !inputDirectory) {
		inputDirectory = filePath.slice(0, filePath.lastIndexOf('/'))
		inputDirectory = inputDirectory.slice(0, inputDirectory.lastIndexOf('/') + 1)
		outputDirectory = outputDir
	}
	console.log('creating graph...')
	let scriptName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
	let nextGraph = new Graph(readScriptFileAndParse, null, scriptName)
	let lastGraphStartTimeLocal = lastGraph ? lastGraph.startTimeGlobal : 0
	let lastGraphDuration = lastGraph ? lastGraph.duration : 0
	let lastNode = { startTimeLocal: nextGraph.startTimeGlobal - lastGraphStartTimeLocal, duration: lastGraphDuration }
	console.log('parsing lines...')
	let graph = await parseLines(scriptName, lines, nextGraph, lastNode)
	return graph.generateLGraph()
}

class Graph {
	scriptName = ""
	sceneId = ""
	startTimeGlobal = 0
	duration = 0
	nodes = []
	markers = []
	jumps = []
	conds = []
	views = []
	actions = []
	gotos = []
	_indices = {}
	CurrTrackId = 0
	CurrGroupId = 0
	NextGroupId = 1
	_LGraph = undefined

	constructor(readScriptFileAndParse, sceneId, scriptName) {
		this.sceneId = sceneId
		this.scriptName = scriptName
		this._readScriptFileAndParse = readScriptFileAndParse
		//function to read a new script
		graphsManifest.push(this)
		this.startTimeGlobal = nextGraphStartTimeGlobal
	}
	_getIdx(type) {
		if (!this._indices.hasOwnProperty(type)) {
			this._indices[type] = 0
		}
		return this._indices[type]++
	}
	getClip(type, idx) {
		switch (type) {
			case ScriptTypes.MARKER: return this.markers[idx]
			case ScriptTypes.UNMARKER: return this.markers[idx]
			case ScriptTypes.JUMP: return this.jumps[idx]
			case ScriptTypes.VIEW: return this.views[idx]
			case ScriptTypes.ACTION: return this.actions[idx]
			case ScriptTypes.GOTO: return this.gotos[idx]
			default: return undefined
		}
	}
	addMarker(name, startTimeLocal) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let markerNode = this._addNode(startTimeLocal, DELAY, ScriptTypes.MARKER, markerIdx)
		//--this.CurrTrackId
		return markerNode
	}
	addUnmarker(name, startTimeLocal) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let unmarkerNode = this._addNode(startTimeLocal, DELAY, ScriptTypes.UNMARKER, markerIdx)
		return unmarkerNode
	}
	addGoto(startTimeLocal, graphIndex) {
		let gotoNode = this._addNode(startTimeLocal, DELAY, ScriptTypes.GOTO, this.gotos.length)
		let graph = graphsManifest[graphIndex]
		if (graph) {
			gotoNode.line = `GOTO ${graph.scriptName}`
		}
		let id = this._getIdx(ScriptTypes.GOTO)
		this.gotos.push({ id, graphIndex })
		return gotoNode
	}
	addReturn(startTimeLocal, returnName) {
		let returnNode = this._addNode(startTimeLocal, DELAY, ScriptTypes.RETURN, this.gotos.length)
		returnNode.line = `RETURN ${returnName}`
		return returnNode
	}
	addLink(startTimeLocal, duration, condExp, toTimeLocal, groupId, jumpMode = 0) {
		//HACK: don't overlap
		toTimeLocal += 1

		if (jumpMode == JumpModes.TRANSITION) {
			this.CurrGroupId = groupId
			jumpMode = JumpModes.CONDITION
		} else if (jumpMode == JumpModes.CONDITION) {
			this.CurrGroupId = this.NextGroupId
			this.NextGroupId += 1
		}

		let condIdx = this._createConds(condExp)
		//AVOID ADDING DUPLICATES
		if (duration == 1) {
			let jumps = this.jumps
			let duplicate = this.nodes.find(i => {
				if (i.type == ScriptTypes.JUMP) {
					let j = jumps[i.idx]
					return i.startTimeLocal == startTimeLocal && i.duration == duration && j.toTimeLocal == toTimeLocal
				}
				return false
			})
			if (duplicate) {
				let jump = jumps[duplicate.idx]
				jump.toTimeLocal = toTimeLocal
				let condDuplicate = jump.condIdxs.find(idx => condIdx == idx)
				if (condDuplicate) {
					return duplicate
				}
				if (condIdx >= 0) {
					jump.condIdxs.push(condIdx)
				}
				return duplicate
			}
		}
		//ADD NORMAL JUMP INTERVAL IF NO DUPLICATES
		let jumpNode = this._addNode(startTimeLocal, duration, ScriptTypes.JUMP, this.jumps.length, groupId)
		let condIdxs = []
		if (condIdx >= 0) {
			condIdxs.push(condIdx)
		}
		let id = this._getIdx(ScriptTypes.JUMP)
		this.jumps.push({ id, condIdxs, toTimeLocal })
		if (DEBUG) {
			let joinedConds = condIdxs.join('_')
			joinedConds = (joinedConds.length > 0 ? '_condIdx_' : '') + joinedConds
			jumpNode.line = `from_${startTimeLocal}_to_${toTimeLocal}${joinedConds}`
		}
		return jumpNode
	}
	_createConds(condExp) {
		if (!condExp) {
			return -1
		}
		if (condExp.result) {
			condExp = condExp.result
		}
		let cond = {
			type: CondTypes[condExp.op.trim()],
			lhsIdx: this._createConds(condExp.lhs),
			rhsIdx: condExp.rhs.root ? -1 : this._createConds(condExp.rhs),
			value: condExp.rhs.root ? condExp.rhs.root.trim() + condExp.rhs.path.map(p => p.trim()) : undefined
		}
		this.conds.push(cond)
		return this.conds.length - 1
	}
	addView(startTimeLocal, duration, viewType, movementType, viewSource, viewTarget, mode, parentView) {
		//let viewInteval = this._addNode(startTimeLocal, duration, ScriptTypes.VIEW, this.views.length)
		let nodeGraph = this.getGraphForType(NodeTypes.VIEW)
		if (!this._LGraph) {
			this._LGraph = node
		}
		let outputNode

		this.views.push({
			id: this._getIdx(ScriptTypes.VIEW),
			viewType,
			duration,
			startTimeLocal,
			movementType,
			viewSource,
			viewTarget
		})

		switch (mode) {
			case ViewModes.LOOP:
				this.addLink(startTimeLocal, duration, null, startTimeLocal, this.CurrGroupId, JumpModes.IMMEDIATE)
				break;
			case ViewModes.RETURN:
				this.addLink(startTimeLocal, duration, null, parentView.startTimeLocal, this.CurrGroupId, JumpModes.IMMEDIATE)
				break;
			case ViewModes.CONTINUE:
				break;
		}

		return viewInteval
	}
	addTransition(duration, transitionType, view) {
		view.outTransitionType = transitionType
		view.outTransitionDuration = duration
	}
	addAction(startTimeLocal, duration, speaker, text) {
		let actionNode = this._addNode(startTimeLocal, duration, ScriptTypes.ACTION, this.actions.length)
		this.actions.push({ id: this._getIdx(ScriptTypes.ACTION), speaker, text })
		return actionNode
	}
	async ingestStmt(stmt, startTimeLocal, lastUnitNode, lineText) {
		let node = null
		switch (stmt.rule) {
			case 'comment':
				throw `[${stmt}] Error: comments should be skipped and not processed`
			case 'goto': //TODO: change lastUnitNode instead of creating goto, then check trasitions uses same approach, then remove extra returns
				if (!this.comments) {
					this.comments = []
				}
				if (stmt.comment) {
					this.comments.push(stmt.comment)
				}

				let scriptName = stmt.path.slice(stmt.path.lastIndexOf('/') + 1)
				let impPath = `${inputDirectory}${stmt.path}/${scriptName}.imp`

				var dur = Number.isInteger(stmt.duration) ? stmt.duration : lastUnitNode.duration
				let gotoNode = this.addGoto(this.duration, null)
				node = gotoNode

				let foundGraphIdx = graphsManifest.findIndex(t => t.sceneId === scriptName || t.scriptName === scriptName)
				if (foundGraphIdx < 0) {
					let foundGraph = await this._readScriptFileAndParse(impPath, { graph: true }, this, lastUnitNode)
					foundGraphIdx = graphsManifest.length - 1
					gotoNode.line = `GOTO ${scriptName}`
				}
				let goto = this.gotos[gotoNode.idx]
				goto.graphIndex = foundGraphIdx

				if (DEBUG) {
					gotoNode.line = lineText
				}
				break
			case 'view':
				let viewNode = this.addView(
					startTimeLocal,
					Number.isInteger(stmt.duration) ? stmt.duration : lastUnitNode.duration,
					stmt.viewType,
					stmt.viewMovement,
					stmt.viewSource ? stmt.viewSource : stmt.viewTarget,
					stmt.viewTarget,
					ViewModes.CONTINUE,
					lastUnitNode)

				//TODO: all views should add to the lastUnitNode.
				if (lastUnitNode.skipNode) {
					let jump = this.jumps[lastUnitNode.skipNode.idx]
					//jump.toTimeLocal = this.duration
				}

				if (stmt.markers) {
					for (let marker of stmt.markers) {
						let addedMarker = this.addMarker(marker, Math.round((viewNode.startTimeLocal + (viewNode.duration / 2))))
						if (DEBUG) {
							addedMarker.line = lineText
						}
					}
				}
				if (stmt.unmarkers) {
					for (let unmarker of stmt.unmarkers) {
						let addedUnmarker = this.addUnmarker(unmarker, Math.round((viewNode.startTimeLocal + (viewNode.duration / 2))))
						if (DEBUG) {
							addedUnmarker.line = lineText
						}
					}
				}
				node = viewNode
				if (DEBUG) {
					viewNode.line = lineText
				}
				break
			case 'action':
				let isDefaultTime = line => line.duration === 0
				let noNaN = n => !n ? 0 : n
				let totalDurationOfTimedLines = stmt.lines.reduce((a, b) => noNaN(a.duration) + noNaN(b.duration), { duration: 0 })
				let durationOfUntimedLines = lastUnitNode.duration - totalDurationOfTimedLines
				let defaultTime = durationOfUntimedLines === 0 ? lastUnitNode.duration : Math.round(durationOfUntimedLines / stmt.lines.filter(a => isDefaultTime(a)).length)

				let actionDuration = 0
				for (let line of stmt.lines) {
					//set default time to last view length
					if (isDefaultTime(line)) {
						line.duration = defaultTime
					}
					let action = this.addAction(startTimeLocal + actionDuration, line.duration, line.speaker, line.text)
					actionDuration += action.duration
					if (DEBUG) {
						action.line = lineText
					}
				}
				node = ({ startTimeLocal: startTimeLocal, duration: actionDuration })
				break
			case 'cond':
				let duration = Number.isInteger(stmt.duration) ? stmt.duration : lastUnitNode.duration
				let toTimeLocal = this.duration
				let jmp = this.addLink(
					startTimeLocal,
					Number.isInteger(stmt.duration) ? stmt.duration : lastUnitNode.duration,
					stmt,
					toTimeLocal,
					undefined,
					JumpModes.CONDITION)
				node = jmp
				if (DEBUG) {
					jmp.line = lineText
				}
				break
			case 'transition':
				this.addTransition(stmt.transitionTime, stmt.transitionType, lastUnitNode)

				//when there's a condition present the unit will loop back on itself until the condition is met
				if (stmt.cond) {
					//OVERRIDE GROUP ID SO THAT THIS JUMP IS INCLUEDED ON ORIGINAL VIEW GROUP
					let jump = this.addLink(
						lastUnitNode.startTimeLocal,
						lastUnitNode.duration,
						stmt.cond.result,
						this.duration,
						this.CurrGroupId,
						JumpModes.TRANSITION)
					node = jump

					//make the unit loop on the condition
					let loopJump = this.jumps[lastUnitNode.skipNode.idx]
					loopJump.toTimeLocal = lastUnitNode.startTimeLocal

					if (DEBUG) {
						jump.line = lineText
					}
				} else {
					node = ({ startTimeLocal: lastUnitNode.startTimeLocal, duration: lastUnitNode.duration })
				}
				break
		}
		++this.CurrTrackId

		return node
	}
}

let sceneJumpReturnFunctions = {}

async function parseLines(
	scriptName,
	lines,
	graph,
	lastUnitNode,
	lineCursor = 0,
	prevStmt = undefined,
	lastDefinedDuration = undefined,
	lastLine = undefined,
	envs = []
) {
	let originalGraph = graph
	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively	
	let nextNodeStartTimeLocal = 0//lastGraph.duration
	lastUnitNode = lastUnitNode ? lastUnitNode : { startTimeLocal: 0, duration: 0 }
	while (lineCursor < lines.length) {
		let line = lines[lineCursor]
		lineCursor += 1
		if (line == '') {
			continue
		}

		let stmt
		try {
			if (isEmptyOrSpaces(line)) {
				continue
			}

			stmt = parseLine(line)

			if (stmt == undefined) {
				throw `line parsed to undefined statement: ${line}`
			}

			if (!stmt || stmt.rule === 'comment') {
				continue
			}

			line = line.trim()

			if (isTabIncreased(stmt, prevStmt) && stmt.rule == 'cond') {

				lastUnitNode.originalDuration = lastUnitNode.originalDuration ? lastUnitNode.originalDuration : lastUnitNode.duration

				if (!lastUnitNode.skipNode) {
					let env = envs[envs.length - 1]
					let toTimeLocal = env ? env.lastUnitNode.startTimeLocal : lastUnitNode.startTimeLocal
					lastUnitNode.skipNode = graph.addLink(
						nextNodeStartTimeLocal,
						DELAY,
						null,
						toTimeLocal,
						graph.CurrGroupId,
						JumpModes.TRANSITION)
				}
				nextNodeStartTimeLocal = graph.duration

				envs.push({
					graph,
					nextNodeStartTimeLocal,
					lastDefinedDuration,
					lastUnitNode,
					stmt,
					prevStmt,
					graphCurrTrackId: graph.CurrTrackId,
					graphCurrGroupId: graph.CurrGroupId
				})
			}
			else if (isTabDecreased(stmt, prevStmt)) {
				let startTimeLocal = -1
				let currViewEnd = lastUnitNode.startTimeLocal + lastUnitNode.duration
				let returnJumpTimes = [currViewEnd]
				//KEEP IN ORDER WITH ABOVE
				let depth = prevStmt.depth
				//don't pop the parent scope since it does't get reintroduced on consecutive conditions
				let env = envs[envs.length - 1]

				while (depth >= stmt.depth) {
					if (stmt.rule == 'cond') {
						env = envs.length == 1 || depth - 1 <= stmt.depth ? envs[envs.length - 1] : envs.pop()
						returnJumpTimes.push(env.lastUnitNode.startTimeLocal + env.lastUnitNode.duration)
					}
					depth -= 1
				}
				startTimeLocal = env.lastUnitNode.startTimeLocal + env.lastUnitNode.duration
				if (startTimeLocal < 0) {
					throw `[${filePath}] Error: no scoped environments found on tab decrease`
				}

				returnJumpTimes = returnJumpTimes
					.filter((v, i, a) => a.indexOf(v) === i) //unique entries only
					.filter(v => !graph.nodes.find(node => node.type === ScriptTypes.GOTO && node.startTimeLocal === v)) //don't add return jumps on top of gotos
				for (let rjStartTimeLocal of returnJumpTimes) {
					let existingReturnJump = graph.nodes.find(node => node.type === ScriptTypes.JUMP && node.startTimeLocal === rjStartTimeLocal)
					if (existingReturnJump == undefined) {
						graph.addLink(rjStartTimeLocal, DELAY, null, startTimeLocal, env.graphCurrGroupId, JumpModes.IMMEDIATE)
					} else {
						let jump = graph.jumps[existingReturnJump.idx]
						jump.toTimeLocal = startTimeLocal
					}
				}

				graph = env.graph
				lastDefinedDuration = env.lastDefinedDuration
				lastUnitNode = env.lastUnitNode
				prevStmt = env.prevStmt
				graph.CurrGroupId = env.graphCurrGroupId
			}
			lintStmt(scriptName, stmt, prevStmt, line, lastLine, lineCursor)

			if (stmt.duration) {
				lastDefinedDuration = stmt.duration
			} else {
				stmt.duration = lastUnitNode.duration
			}

		} catch (error) {
			console.error(`${scriptName} - ${error.message}`)
			process.exit(1)
		}

		let startTimeLocal = 0
		if (lastUnitNode.hasOwnProperty('startTimeLocal')) {
			startTimeLocal = lastUnitNode.startTimeLocal
		}
		if (stmt.rule == "view" && prevStmt.rule == "action") {
			nextNodeStartTimeLocal = graph.duration
		}

		if (stmt.rule == "view" || stmt.rule == "sceneHeading") {
			startTimeLocal = nextNodeStartTimeLocal
		}

		if (prevStmt && prevStmt.rule == "cond") {
			startTimeLocal = graph.duration
		}
		//add view for actions
		let actionViewNode = null
		if (stmt.rule == "action" && prevStmt.rule == "cond") {
			let lastView = graph.views[lastUnitNode.idx]
			let stmtDuration = stmt.duration ? stmt.duration : lastView.duration
			let view = graph.addView(startTimeLocal, stmtDuration, lastView.viewType, lastView.movementType, lastView.viewSource, lastView.viewTarget, ViewModes.CONTINUE, lastView)
			actionViewNode = view
		}
		//IF SCENE ALREADY EXISTS ADD TO TIMELINE FOR THE SCENE		
		if (stmt.rule == 'sceneHeading') {
			let sceneId = `${stmt.sceneName}${stmt.location ? ', ' + stmt.location : ''}`
			let graphForSceneIdx = graphsManifest.findIndex(t => t.sceneId == sceneId)
			if (graphForSceneIdx < 0) {
				//TODO: check if this is correct
				if (graph.sceneId && graph.sceneId != sceneId) {
					graph = new Graph(graph._readScriptFileAndParse, sceneId, stmt.sceneName)
				}
				continue
			} else {
				let graphForScene = graphsManifest[graphForSceneIdx]
				let goto = graph.addGoto(startTimeLocal, graphForSceneIdx)
				let condExp = {
					op: "TRUE",
					lhs: null,
					rhs: { root: `from_${graph.scriptName}`, path: [] }
				}
				let firstView = graphForScene.views[0]
				let groupId = 0//graphForScene.NextGroupId
				graphForScene.NextGroupId = groupId
				let jumpToScene = graphForScene.addLink(0, firstView.duration, condExp, graphForScene.duration + DELAY, groupId, JumpModes.CONDITION)

				graphForScene.duration += DELAY

				let jumpToReturn = (toTimeLocal) => graphForScene.addLink(toTimeLocal, DELAY, null, 0, groupId, JumpModes.IMMEDIATE)

				if (!sceneJumpReturnFunctions.hasOwnProperty(graphForScene.scriptName)) {
					sceneJumpReturnFunctions[graphForScene.scriptName] = []
				}
				sceneJumpReturnFunctions[graphForScene.scriptName].push(jumpToReturn)

				//nextNodeStartTimeLocal = graphForScene.startTimeGlobal
				if (!graph.sceneId) {
					//get script name from temp graph and remove from manifest
					graphForScene.scriptName = graph.scriptName
					let idx = graphsManifest.findIndex(t => t == graph)
					graphsManifest.splice(idx, 1)
				}
				graph = graphForScene
				nextNodeStartTimeLocal = graph.duration
				prevStmt = stmt
				lastLine = line
				continue
			}
		}

		//INGEST
		let node = await graph.ingestStmt(stmt, startTimeLocal, lastUnitNode, line)

		if (stmt.rule == "goto") {
			nextNodeStartTimeLocal = node.startTimeLocal + node.duration
		}

		//add view for actions
		if (actionViewNode != null) {
			let actionView = graph.views[actionViewNode.idx]
			actionView.track = node.track
			actionView.groupId = node.parent
			lastUnitNode = actionViewNode
		}

		if (stmt.rule == "view") {
			nextNodeStartTimeLocal = graph.duration
			lastUnitNode = node//graph.views[graph.views.length - 1]
		}
		if (stmt.rule !== "goto") {
			prevStmt = stmt
			lastLine = line
		}

		//TODO: extend all action durations in parent views
		/*
		let end = start + duration
		if (end > parentShot.duration) {
			parentShot.duration = end
		}
		*/
	}
	let mergedGraph = graphsManifest.find(t => t.scriptName == originalGraph.scriptName)
	let returnToParentScope = mergedGraph.addReturn(nextNodeStartTimeLocal, mergedGraph.scriptName)

	let sceneJumps = sceneJumpReturnFunctions[mergedGraph.scriptName]
	while (sceneJumps && sceneJumps.length > 0) {
		let jumpToReturnFunction = sceneJumps.pop()
		jumpToReturnFunction(mergedGraph.duration)
	}
	//SORT BY TYPE
	//mergedGraph.sortNodes()
	return mergedGraph
}



function isTabIncreased(stmt, prevStmt) {
	return stmt && prevStmt && stmt.depth > prevStmt.depth
}

function isTabDecreased(stmt, prevStmt) {
	return stmt && prevStmt && stmt.depth < prevStmt.depth
}

function parseLine(lineText) {
	console.log(`generating parser...`)
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), {
		keepHistory: false
	})
	console.log(`parsing line ${lineText}...`)
	parser.feed(lineText)
	//HACK: enforce rule precedence ambiguity - why doesn't nearly.js do this?
	let results = {}
	for (let result of parser.results) {
		results[result.rule] = result
	}

	let addRule = (r, ruleOverride) => ({ rule: ruleOverride ? ruleOverride : r.rule, depth: r.depth, ...r.result })
	if (results.comment) return addRule(results.comment)
	if (results.goto) return addRule(results.goto)
	if (results.transition) return addRule(results.transition)
	if (results.sceneHeading) return addRule(results.sceneHeading)
	if (results.cond) return addRule(results.cond)
	if (results.viewFullUnmarker) return addRule(results.viewFullUnmarker, 'view')
	if (results.viewFullMarker) return addRule(results.viewFullMarker, 'view')
	if (results.viewFullNoMarker) return addRule(results.viewFullNoMarker, 'view')
	if (results.viewNoDurationUnmarker) return addRule(results.viewNoDurationUnmarker, 'view')
	if (results.hotNoDurationMarker) return addRule(results.hotNoDurationMarker, 'view')
	if (results.viewNoDurationNoMarker) return addRule(results.viewNoDurationNoMarker, 'view')
	if (results.viewNoMovementUnmarker) return addRule(results.viewNoMovementUnmarker, 'view')
	if (results.viewNoMovementMarker) return addRule(results.viewNoMovementMarker, 'view')
	if (results.viewNoMovementNoMarker) return addRule(results.viewNoMovementNoMarker, 'view')
	if (results.viewNoSourceUnmarker) return addRule(results.viewNoSourceUnmarker, 'view')
	if (results.viewNoSourceMarker) return addRule(results.viewNoSourceMarker, 'view')
	if (results.viewNoSourceNoMarker) return addRule(results.viewNoSourceNoMarker, 'view')
	if (results.viewNoSourceNoMovementnmarker) return addRule(results.viewNoSourceNoMovementnmarker, 'view')
	if (results.viewNoSourceNoMovementMarker) return addRule(results.viewNoSourceNoMovementMarker, 'view')
	if (results.viewNoSourceNoMovementNoMarker) return addRule(results.viewNoSourceNoMovementNoMarker, 'view')
	if (results.viewNoSourceNoDurationUnmarker) return addRule(results.viewNoSourceNoDurationUnmarker, 'view')
	if (results.viewNoSourceNoDurationMarker) return addRule(results.viewNoSourceNoDurationMarker, 'view')
	if (results.viewNoSourceNoDurationNoMarker) return addRule(results.viewNoSourceNoDurationNoMarker, 'view')
	if (results.viewNoMovementNoDurationUnmarker) return addRule(results.viewNoMovementNoDurationUnmarker, 'view')
	if (results.viewNoMovementNoDurationMarker) return addRule(results.viewNoMovementNoDurationMarker, 'view')
	if (results.viewNoMovementNoDurationNoMarker) return addRule(results.viewNoMovementNoDurationNoMarker, 'view')
	if (results.viewNoSourceNoMovementNoDurationUnmarker) return addRule(results.viewNoSourceNoMovementNoDurationUnmarker, 'view')
	if (results.viewNoSourceNoMovementNoDurationMarker) return addRule(results.viewNoSourceNoMovementNoDurationMarker, 'view')
	if (results.viewNoSourceNoMovementNoDurationNoMarker) return addRule(results.viewNoSourceNoMovementNoDurationNoMarker, 'view')
	if (results.action) return addRule(results.action)
	return undefined
}

function lintStmt(filePath, stmt, prevStmt, line, lastLine, lineCursor) {
	let lines = `\n${lineCursor - 1}:${lastLine}\n>>${lineCursor}:${line}`

	if (prevStmt === null) {
		if (stmt.depth > 0) {
			throw `[${filePath}] Error: first statement must be unindented${lines}`
		}
		return
	}

	switch (stmt.rule) {
		case 'transition':
			switch (prevStmt.rule) {
				case 'cond':
					break
				case 'comment':
				case 'goto':
				case 'action':
					if (prevStmt.depth !== stmt.depth) {
						throw `[${filePath}] Error: transitions must have the same depth as the action before them${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: transition must follow an action.${lines}`
			}
			break
		case 'sceneHeading':
			if (prevStmt) {
				switch (prevStmt.rule) {
					case 'comment':
					case 'goto':
					case 'action':
					case 'transition':
					case 'view':
						if (prevStmt.depth !== stmt.depth) {
							throw `[${filePath}] Error: sceneHeading must have the same depth as the statement before it${lines}`
						}
						break
					case 'cond':
						if (prevStmt.depth === stmt.depth) {
							throw `[${filePath}] Error: sceneHeadings that follow a condition must be indented${lines}`
						}
						break
					default:
						throw `[${filePath}] Error: sceneHeading must follow an action or a transition${lines}`
						break
				}
			}
			break
		case 'view':
			if (prevStmt) {
				switch (prevStmt.rule) {
					case 'comment':
					case 'goto':
					case 'action':
					case 'transition':
					case 'sceneHeading':
					case 'view':
						break
					case 'cond':
						//TODO: explore eliminating condition statement depth rules
						if (prevStmt.depth === stmt.depth) {
							throw `[${filePath}] Error: views that follow a condition must be indented${lines}`
						}
						break
					default:
						throw `[${filePath}] Error: view heading must follow an action, transition or sceneHeading${lines}`
				}
			}
			break
		case 'action':
			switch (prevStmt.rule) {
				case 'comment':
				case 'goto':
				case 'action':
				case 'view':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === stmt.depth) {
						throw `[${filePath}] Error: actions that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: action must follow a view heading, or another action${lines}`
			}
			break
		case 'cond':
			switch (prevStmt.rule) {
				case 'comment':
				case 'goto':
					break
				case 'action':
				case 'view':
					if (prevStmt.depth === stmt.depth) {
						throw `[${filePath}] Error: conditions must always be indented under the action or view that preceeds them${lines}`
					}
					break
				case 'cond':
					break
				default:
					throw `[${filePath}] Error: conditions must follow an action, view heading, or a previous condition${lines}`
					break
			}
			break
	}

	if (isTabIncreased(stmt, prevStmt)) {
		if (stmt.depth - prevStmt.depth > 1) {
			throw `[${filePath}] Error: statement depth greater than parent${lines}`
		}
		if (stmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (isTabDecreased(stmt, prevStmt)) {
		if (prevStmt.rule === 'action' || prevStmt.rule === 'cond') {
			let depth = prevStmt.depth - stmt.depth
			let isOdd = n => n % 2
			if (stmt.rule === 'cond') {
				if (!isOdd(depth)) {
					throw `[${filePath}] Error: statement depth decreased and does not align with a parent action's conditions${lines}`
				}
			} else if (isOdd(depth) && prevStmt.rule !== 'cond') {
				throw `[${filePath}] Error: statement depth decreased and does not align with a parent unit's action${lines}`
			}
		} else {
			throw `[${filePath}] Error: statement depth decreased but previous statement was not an action${lines}`
		}
	}
}