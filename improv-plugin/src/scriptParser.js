/*
	TODO:
	1. migrate this script to TypeScript
	2. node types should be defined as new types that extends GraphNode from renderer/editor/graph/node.ts. json templates will break eventually
	3. consolidate global functions into Graph class
*/
const nearley = require('nearley')
const grammar = require('./grammar')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null

const DEBUG = true
const DELAY = 200

var ScriptTypes = {
	RETURN: "RETURN",
	VIEW: "VIEW",
	MARKER: "MARKER",
	UNMARKER: "UNMARKER",
	ACTION: "ACTION",
	JUMP: "JUMP",
	GOTO: "GOTO"
}

const CondTypes = {
	AND: "AND",
	OR: "OR",
	SELECT: "SELECT",
	TRUE: "TRUE",
	FALSE: "FALSE",
	INPUT: "INPUT",
	NEAR: "NEAR"
}

const NodeTypes = {
	...CondTypes,
	ROOT: "ROOT",
	VIEW: "VIEW",
	ACTION: "ACTION",
	VARIABLE: "VARIABLE",
	UPDATE_VARIABLE: "UPDATE_VARIABLE",
	GET_VARIABLE: "GET_VARIABLE"
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
async function InitializeGraphTemplates() {
	if (Object.keys(graphs).length === 0) {
		for (let nodeType in NodeTypes) {
			const path = '../improv-plugin/src/nodeTypes/'
			let rawText = await readFile(`${path}${nodeType}.json`, 'utf8')
			graphs[nodeType] = JSON.parse(rawText)
		}
	}
}

var inputDirectory = undefined
var nextTimelineStartTimeGlobal = 0

async function generateGraphDataObjects(rootImprovScriptPath, outputDir) {
	let extension = rootImprovScriptPath.split('.').pop()
	if (extension !== "imp") {
		console.error("File extension not supported. Improv script required.")
	}
	console.log(`parsing improv script...`)
	outputDirectory = outputDir
	let timeline = await readScriptFileAndParse(rootImprovScriptPath, undefined, true)
	console.log('improv script parsed...')
	return timeline//timelinesManifest.map(timeline => timeline._graph)
}
module.exports.generateGraphDataObjects = generateGraphDataObjects

async function readScriptFileAndParse(scriptPath, lastView, isFirstRun = false) {
	await InitializeGraphTemplates();
	return new Promise(res => {
		readFile(scriptPath, { encoding: 'utf8' }, (err, rawText) => {
			if (err) {
				console.error(`error reading script (${scriptPath}): ${err}`)
			}
			let lines = rawText.split("\n")
			console.log('creating graph...')
			if (!inputDirectory) {
				inputDirectory = scriptPath.slice(0, scriptPath.lastIndexOf('/'))
				inputDirectory = inputDirectory.slice(0, inputDirectory.lastIndexOf('/') + 1)
			}
			let scriptName = scriptPath.slice(scriptPath.lastIndexOf('/') + 1, scriptPath.lastIndexOf('.'))
			let timeline = new Timeline(readScriptFileAndParse, scriptName, scriptName)
			let lastViewStartTimeLocal = lastView ? lastView.startTimeGlobal : 0
			let lastViewDuration = lastView ? lastView.duration : 0
			let lastUnitInterval = { startTimeLocal: timeline.startTimeGlobal - lastViewStartTimeLocal, duration: lastViewDuration }
			let graphFromNode = findLast(timeline._graph.nodes, n => n.title == 'Output')
			console.log('parsing lines...')
			parseLines(scriptName, lines, timeline, lastUnitInterval, graphFromNode)
				.then(timeline => {
					let timelinePath = `${outputDirectory}/${scriptName}.graph`
					timelineJson = JSON.stringify(timeline._graph)
					writeFile(timelinePath, timelineJson)
						.then(_ => {
							let lastTimelineInManifest = null
							for (let timeline of timelinesManifest) {
								timeline.startTimeGlobal = lastTimelineInManifest ? lastTimelineInManifest.startTimeGlobal + lastTimelineInManifest.duration : 0
								lastTimelineInManifest = timeline
							}
							//let manifest = JSON.stringify(timelinesManifest.map(t => ({ scriptName: t.scriptName, sceneId: t.sceneId, startTimeGlobal: t.startTimeGlobal, duration: t.duration })))
							//writeFile(`${outputDirectory}/manifest.json`, manifest)
							//	.then(_ => res(timeline))

							res(timeline)
						})
				})
		})
	})
}

var timelinesManifest = []
var outputDirectory = undefined
var inputDirectory = undefined
var nextTimelineStartTimeGlobal = 0

class Timeline {
	scriptName = ""
	sceneId = ""
	startTimeGlobal = 0
	duration = 0
	intervals = []
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
	_graph = { nodes: [], links: [], last_link_id: -1, last_node_id: -1 }
	_nodeHistory = []
	_nextViewId = -1

	constructor(readScriptFileAndParse, sceneId, scriptName) {
		this.sceneId = sceneId
		this.scriptName = scriptName
		this._readScriptFileAndParse = readScriptFileAndParse
		//function to read a new script
		timelinesManifest.push(this)
		this.startTimeGlobal = nextTimelineStartTimeGlobal
		this._graph = this.createNodeGroup(NodeTypes.ROOT).node
	}
	_getIdx(type) {
		if (!this._indices.hasOwnProperty(type)) {
			this._indices[type] = 0
		}
		return this._indices[type]++
	}
	_addInterval(startTimeLocal, duration, type, idx, parentGroupId) {
		let i = { id: this._getIdx("INTERVAL"), type, idx, startTimeLocal: startTimeLocal, duration, track: this.CurrTrackId, group: this.CurrGroupId, parent: parentGroupId ? parentGroupId : this.CurrGroupId }
		this.intervals.push(i)
		let endTimeLocal = startTimeLocal + duration
		if (endTimeLocal > this.duration) {
			this.duration = endTimeLocal
		}
		let timelineEndTimeGlobal = this.startTimeGlobal + this.duration
		if (timelineEndTimeGlobal > nextTimelineStartTimeGlobal) {
			nextTimelineStartTimeGlobal = timelineEndTimeGlobal
		}
		return i
	}
	generateViewId() {
		this._nextViewId += 1
		return this._nextViewId
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
		let markerInterval = this._addInterval(startTimeLocal, DELAY, ScriptTypes.MARKER, markerIdx)
		//--this.CurrTrackId
		return markerInterval
	}
	addUnmarker(name, startTimeLocal) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let unmarkerInterval = this._addInterval(startTimeLocal, DELAY, ScriptTypes.UNMARKER, markerIdx)
		return unmarkerInterval
	}
	addGoto(startTimeLocal, timelineIndex) {
		let gotoInterval = this._addInterval(startTimeLocal, DELAY, ScriptTypes.GOTO, this.gotos.length)
		let timeline = timelinesManifest[timelineIndex]
		if (timeline) {
			gotoInterval.line = `GOTO ${timeline.scriptName}`
		}
		let id = this._getIdx(ScriptTypes.GOTO)
		this.gotos.push({ id, timelineIndex })
		return gotoInterval
	}
	addReturn(startTimeLocal, returnName) {
		let returnInterval = this._addInterval(startTimeLocal, DELAY, ScriptTypes.RETURN, this.gotos.length)
		returnInterval.line = `RETURN ${returnName}`
		return returnInterval
	}
	addJump(startTimeLocal, duration, condExp, toTimeLocal, groupId, jumpMode = 0) {
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
			let duplicate = this.intervals.find(i => {
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
		let jumpInterval = this._addInterval(startTimeLocal, duration, ScriptTypes.JUMP, this.jumps.length, groupId)
		let condIdxs = []
		if (condIdx >= 0) {
			condIdxs.push(condIdx)
		}
		let id = this._getIdx(ScriptTypes.JUMP)
		this.jumps.push({ id, condIdxs, toTimeLocal })
		if (DEBUG) {
			let joinedConds = condIdxs.join('_')
			joinedConds = (joinedConds.length > 0 ? '_condIdx_' : '') + joinedConds
			jumpInterval.line = `from_${startTimeLocal}_to_${toTimeLocal}${joinedConds}`
		}
		return jumpInterval
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
		let viewInterval = this._addInterval(startTimeLocal, duration, ScriptTypes.VIEW, this.views.length)

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
				this.addJump(startTimeLocal, duration, null, startTimeLocal, this.CurrGroupId, JumpModes.IMMEDIATE)
				break;
			case ViewModes.RETURN:
				this.addJump(startTimeLocal, duration, null, parentView.startTimeLocal, this.CurrGroupId, JumpModes.IMMEDIATE)
				break;
			case ViewModes.CONTINUE:
				break;
		}
		return viewInterval
	}
	addTransition(duration, transitionType, view) {
		view.outTransitionType = transitionType
		view.outTransitionDuration = duration
	}
	addAction(startTimeLocal, duration, speaker, text) {
		let actionInterval = this._addInterval(startTimeLocal, duration, ScriptTypes.ACTION, this.actions.length)
		this.actions.push({ id: this._getIdx(ScriptTypes.ACTION), speaker, text })
		return actionInterval
	}

	createConditionNodes(condExp, graphToNode, originSlot = 0, targetSlot = 0) {
		if (!condExp) {
			return null
		}
		if (condExp.result) {
			condExp = condExp.result
		}
		let type = CondTypes[condExp.op.trim()]
		let fullPath = condExp.rhs.root ? condExp.rhs.root.trim() + condExp.rhs.path.map(p => p.trim()) : undefined

		//if logic node, call recurisively to get lhs/rhs links
		if (type == CondTypes.AND || type == CondTypes.OR) {
			//create AND/OR node
			let logicNode = this.createNodeGroup(type).node.nodes[0]
			logicNode.pos["0"] = graphToNode.pos["0"]
			logicNode.pos["1"] = graphToNode.pos["1"] - 100
			//link lhs/rhs to AND/OR node inputs
			let lhs = this.createConditionNodes(condExp.lhs, logicNode, 0, 0)
			logicNode.inputs[0].link = lhs.properties.toLink
			let rhs = condExp.rhs.root ? null : this.createConditionNodes(condExp.rhs, logicNode, 0, 1)
			logicNode.inputs[1].link = rhs.properties.toLink
			//link to graph output and return
			logicNode.properties.toLink = this.makeLink(logicNode, originSlot, graphToNode, targetSlot, 'boolean')

			return logicNode
		}

		//create node
		let booleanNode = this.createNodeGroup(NodeTypes[type]).node
		let booleanNodeOutputNode = findLast(booleanNode.nodes, n => n.type.includes('logic'))
		for (let n of booleanNode.nodes) {
			n.pos["0"] += graphToNode.pos["0"]
			n.pos["1"] += graphToNode.pos["1"] + 100
		}
		//set subject's id value
		let varNameNode = findLast(booleanNode.nodes, n => n.title == "VarName")
		varNameNode.title = fullPath
		varNameNode.properties.value = fullPath
		
		//let linkType = graphToNode.type.includes('logic') ? 'boolean' : -1
		booleanNodeOutputNode.properties.toLink = this.makeLink(booleanNodeOutputNode, 2, graphToNode, targetSlot, "boolean")
		
		//link to graph output and return
		return booleanNodeOutputNode
	}

	createNodeGroup(nodeType, graphFromNode, originSlot = 0, targetSlot = 0, linkType = -1) {
		//deep clone the new node object (don't maintain refereces)
		let node = JSON.parse(JSON.stringify(graphs[nodeType]))

		//for all nodes update: ids, positions, input ids, output ids
		let oldToNewNodeIds = {}
		for (let n of node.nodes) {
			if (nodeType == NodeTypes.VIEW) {
				n.pos["0"] += graphFromNode ? graphFromNode.pos["0"] : 0
				n.pos["1"] += graphFromNode ? graphFromNode.pos["1"] - 380 : 0
			} else {
				n.pos[0] += graphFromNode ? graphFromNode.pos["0"] - 400 : 0
				n.pos[1] += graphFromNode ? graphFromNode.pos["1"] - 800 : 0
			}
			oldToNewNodeIds[n.id] = this._graph.nodes.length
			n.id = this._graph.nodes.length
			this._graph.nodes.push(n)
		}

		//update all link ids.
		// link format: [id,fromNodeId,fromSlotIdx,toNodeId,toSlotIdx,linkType (-1, 'boolean')]
		let oldToNewLinkIds = {}
		for ( let idx = 0; idx < node.links.length; ++idx) {
			let linkArray = node.links[idx]
			oldToNewLinkIds[linkArray[0]] = this._graph.links.length
			linkArray[0] = this._graph.links.length 
			linkArray[1] = oldToNewNodeIds[linkArray[1]]
			linkArray[3] = oldToNewNodeIds[linkArray[3]]
			this._graph.links.push(linkArray)
		}

		for (let n of node.nodes) {
			for (let input of n.inputs) {
				if (input.link !== null) {
					input.link = oldToNewLinkIds[input.link]
				}
			}
			for (let output of n.outputs) {
				for (let idx = 0; output.links && idx < output.links.length; ++idx) {
					output.links[idx] = oldToNewLinkIds[output.links[idx]]
				}
			}
		}

		//combine node / links arrays
		this._graph.last_node_id = this._graph.nodes.length - 1
		this._graph.last_link_id = this._graph.links.length - 1

		//attach to the existing graph's last output
		let linkId = undefined
		let toNode = findLast(node.nodes, n => n.title == 'Input')
		if (graphFromNode !== undefined) {
			//let outputNode = findLast(graphFromNode.nodes, n => n.title == 'Output')
			let isLogicNode = node.nodes[0].type.includes('logic')
			if (isLogicNode) {
				toNode = node.nodes[0]
			}
			linkId = this.makeLink(graphFromNode, originSlot, toNode, targetSlot, linkType)
		}		

		return { node, linkId }
	}

	makeLink(fromNode, originSlot,  toNode, targetSlot, linkType) {
		let originNode = this._graph.nodes[fromNode.id] 
		let targetNode = this._graph.nodes[toNode.id] 
		let linkId = this._graph.last_link_id + 1		
		this._graph.links.push([linkId, originNode.id, originSlot, targetNode.id, targetSlot, linkType])
		this._graph.last_link_id = linkId

		originSlot = (originSlot < originNode.outputs.length) ? originSlot : 0
		if (originNode.outputs[originSlot].links == null) {
			originNode.outputs[originSlot].links = []
		}

		originNode.outputs[originSlot].links.push(linkId)
		targetNode.inputs[targetSlot].link = linkId
		return linkId
	}

	async ingestStmt(stmt, startTimeLocal, lastUnitInterval, lineText, lastGraphOutputNode) {
		let interval = null
		let node = null
		let graphOutput = this._graph.nodes.find(n => n.title == 'Output')

		if (stmt.rule == 'comment') {
			throw `[${stmt}] Error: comments should be skipped and not processed`
		} else if (stmt.rule == 'goto') { //TODO: change lastUnitInterval instead of creating goto, then check trasitions uses same approach, then remove extra returns
			if (!this.comments) {
				this.comments = []
			}
			if (stmt.comment) {
				this.comments.push(stmt.comment)
			}

			let scriptName = stmt.path.slice(stmt.path.lastIndexOf('/') + 1)
			let impPath = `${inputDirectory}${stmt.path}/${scriptName}.imp`

			var dur = Number.isInteger(stmt.duration) ? stmt.duration : lastUnitInterval.duration
			let gotoInterval = this.addGoto(this.duration, null)
			interval = gotoInterval

			let foundTimelineIdx = timelinesManifest.findIndex(t => t.sceneId === scriptName || t.scriptName === scriptName)
			if (foundTimelineIdx < 0) {
				let foundTimeline = await this._readScriptFileAndParse(impPath, lastUnitInterval)
				foundTimelineIdx = timelinesManifest.length - 1
				gotoInterval.line = `GOTO ${scriptName}`
			}
			let goto = this.gotos[gotoInterval.idx]
			goto.timelineIndex = foundTimelineIdx

			if (DEBUG) {
				gotoInterval.line = lineText
			}

		} else if (stmt.rule == 'view') {
			let viewInterval = this.addView(
				startTimeLocal,
				Number.isInteger(stmt.duration) ? stmt.duration : lastUnitInterval.duration,
				stmt.viewType,
				stmt.viewMovement,
				stmt.viewSource ? stmt.viewSource : stmt.viewTarget,
				stmt.viewTarget,
				ViewModes.CONTINUE,
				lastUnitInterval)

			if (stmt.markers) {
				for (let marker of stmt.markers) {
					let addedMarker = this.addMarker(marker, Math.round((viewInterval.startTimeLocal + (viewInterval.duration / 2))))
					if (DEBUG) {
						addedMarker.line = lineText
					}
				}
			}
			if (stmt.unmarkers) {
				for (let unmarker of stmt.unmarkers) {
					let addedUnmarker = this.addUnmarker(unmarker, Math.round((viewInterval.startTimeLocal + (viewInterval.duration / 2))))
					if (DEBUG) {
						addedUnmarker.line = lineText
					}
				}
			}
			if (DEBUG) {
				viewInterval.line = lineText
			}
			//console.log(interval)
			interval = viewInterval

			let { node: newNode, linkId } = this.createNodeGroup(NodeTypes.VIEW, lastGraphOutputNode)
			if(lastGraphOutputNode?.properties.isCondLink){
				let inputNode = findLast(newNode.nodes, n => n.title == "Input")
				lastGraphOutputNode.properties.toLink = this.makeLink(lastGraphOutputNode, 0, inputNode, 0, -1)
			}
			node = newNode
			let viewIdNode = findLast(newNode.nodes, n => n.title == "ViewIdVal")
			viewIdNode.properties.value = this.generateViewId()

		} else if (stmt.rule == 'action') {
			let isDefaultTime = line => !line.duration || line.duration === 0
			let noNaN = n => !n ? 0 : n
			let totalDurationOfTimedLines = stmt.lines.reduce((a, b) => noNaN(a.duration) + noNaN(b.duration), { duration: 0 })
			let durationOfUntimedLines = lastUnitInterval.duration - totalDurationOfTimedLines
			let defaultTime = durationOfUntimedLines === 0 ? lastUnitInterval.duration : Math.round(durationOfUntimedLines / stmt.lines.filter(a => isDefaultTime(a)).length)

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
			let lastTickNode = findLast(this._graph.nodes, n => n.title == "TickInput")
			let { newNode, linkId } = this.createNodeGroup(NodeTypes.ACTION, lastTickNode)
			node = newNode
			interval = ({ startTimeLocal: startTimeLocal, duration: actionDuration })

		} else if (stmt.rule == 'cond') {
			let duration = Number.isInteger(stmt.duration) ? stmt.duration : lastUnitInterval.duration
			let toTimeLocal = this.duration
			let jmp = this.addJump(
				startTimeLocal,
				Number.isInteger(stmt.duration) ? stmt.duration : lastUnitInterval.duration,
				stmt,
				toTimeLocal,
				undefined,
				JumpModes.CONDITION)
			interval = jmp
			if (DEBUG) {
				jmp.line = lineText
			}

			let toNode = findLast(this._graph.nodes, n => n.title == "Cond")
			toNode.properties.isCondLink = true
			//let fromNode = findLast(this._graph.nodes, n => n.title == "TickInput")
			let booleanNode = this.createConditionNodes(stmt, toNode, 0, 2)
			//booleanNode.fromLink = this.makeLink(fromNode, 2, booleanNode, 0, 'boolean')
			//booleanNode.properties.toLink = this.makeLink(booleanNode, 0, toNode, 1, 'boolean')
			node = toNode

		} else if (stmt.rule == 'transition') {
			this.addTransition(stmt.transitionTime, stmt.transitionType, lastUnitInterval)

			//when there's a condition present the unit will loop back on `itself until the condition is met
			if (stmt.cond) {
				//OVERRIDE GROUP ID SO THAT THIS JUMP IS INCLUEDED ON ORIGINAL VIEW GROUP
				let jump = this.addJump(
					lastUnitInterval.startTimeLocal,
					lastUnitInterval.duration,
					stmt.cond.result,
					this.duration,
					this.CurrGroupId,
					JumpModes.TRANSITION)
				interval = jump

				//make the unit loop on the condition
				let loopJump = this.jumps[lastUnitInterval.skipInterval.idx]
				loopJump.toTimeLocal = lastUnitInterval.startTimeLocal

				if (DEBUG) {
					jump.line = lineText
				}
			} else {
				interval = ({ startTimeLocal: lastUnitInterval.startTimeLocal, duration: lastUnitInterval.duration })
			}
		}
		++this.CurrTrackId

		return { interval, node }
	}
}

let sceneJumpReturnFunctions = {}

async function parseLines(
	scriptName,
	lines,
	timeline,
	lastUnitInterval,
	lastOutputNode,
	lineCursor = 0,
	prevStmt = undefined,
	lastDefinedDuration = undefined,
	lastLine = undefined,
	envs = [],
	viewEnvs = []
) {
	let originalTimeline = timeline
	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively	
	let nextIntervalStartTimeLocal = 0//lastView.duration
	lastUnitInterval = lastUnitInterval ? lastUnitInterval : { startTimeLocal: 0, duration: 0 }
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

				lastUnitInterval.originalDuration = lastUnitInterval.originalDuration ? lastUnitInterval.originalDuration : lastUnitInterval.duration

				if (!lastUnitInterval.skipInterval) {
					let env = envs[envs.length - 1]
					let toTimeLocal = env ? env.lastUnitInterval.startTimeLocal : lastUnitInterval.startTimeLocal
					lastUnitInterval.skipInterval = timeline.addJump(
						nextIntervalStartTimeLocal,
						DELAY,
						null,
						toTimeLocal,
						timeline.CurrGroupId,
						JumpModes.TRANSITION)
				}
				nextIntervalStartTimeLocal = timeline.duration

				envs.push({
					timeline,
					nextIntervalStartTimeLocal,
					lastDefinedDuration,
					lastUnitInterval,
					stmt,
					prevStmt,
					timelineCurrTrackId: timeline.CurrTrackId,
					timelineCurrGroupId: timeline.CurrGroupId,
					lastViewNode: lastOutputNode
				})
			}
			else if (isTabDecreased(stmt, prevStmt)) {
				let startTimeLocal = -1
				let currViewEnd = lastUnitInterval.startTimeLocal + lastUnitInterval.duration
				let returnJumpTimes = [currViewEnd]
				//KEEP IN ORDER WITH ABOVE
				let depth = prevStmt.depth
				//don't pop the parent scope since it does't get reintroduced on consecutive conditions
				let env = envs[envs.length - 1]

				while (depth >= stmt.depth) {
					if (stmt.rule == 'cond') {
						env = envs.length == 1 || depth - 1 <= stmt.depth ? envs[envs.length - 1] : envs.pop()
						returnJumpTimes.push(env.lastUnitInterval.startTimeLocal + env.lastUnitInterval.duration)
					}
					depth -= 1
				}
				startTimeLocal = env.lastUnitInterval.startTimeLocal + env.lastUnitInterval.duration
				if (startTimeLocal < 0) {
					throw `[${filePath}] Error: no scoped environments found on tab decrease`
				}

				returnJumpTimes = returnJumpTimes
					.filter((v, i, a) => a.indexOf(v) === i) //unique entries only
					.filter(v => !timeline.intervals.find(interval => interval.type === ScriptTypes.GOTO && interval.startTimeLocal === v)) //don't add return jumps on top of gotos
				for (let rjStartTimeLocal of returnJumpTimes) {
					let existingReturnJump = timeline.intervals.find(interval => interval.type === ScriptTypes.JUMP && interval.startTimeLocal === rjStartTimeLocal)
					if (existingReturnJump == undefined) {
						timeline.addJump(rjStartTimeLocal, DELAY, null, startTimeLocal, env.timelineCurrGroupId, JumpModes.IMMEDIATE)
					} else {
						let jump = timeline.jumps[existingReturnJump.idx]
						jump.toTimeLocal = startTimeLocal
					}
				}

				timeline = env.timeline
				lastDefinedDuration = env.lastDefinedDuration
				lastUnitInterval = env.lastUnitInterval
				prevStmt = env.prevStmt
				timeline.CurrGroupId = env.timelineCurrGroupId
				lastOutputNode = env.lastViewNode
			}
			lintStmt(scriptName, stmt, prevStmt, line, lastLine, lineCursor)

			if (stmt.duration) {
				lastDefinedDuration = stmt.duration
			} else {
				stmt.duration = lastDefinedDuration
			}

		} catch (error) {
			console.error(`${scriptName} - ${error.message}`)
			process.exit(1)
		}

		let startTimeLocal = 0
		if (lastUnitInterval.hasOwnProperty('startTimeLocal')) {
			startTimeLocal = lastUnitInterval.startTimeLocal
		}
		if (stmt.rule == "view" && prevStmt.rule == "action") {
			nextIntervalStartTimeLocal = timeline.duration
		}

		if (stmt.rule == "view" || stmt.rule == "sceneHeading") {
			startTimeLocal = nextIntervalStartTimeLocal
		}

		if (prevStmt && prevStmt.rule == "cond") {
			startTimeLocal = timeline.duration
		}
		//add view for actions
		let actionInterval = null
		if (stmt.rule == "action" && prevStmt.rule == "cond") {
			let lastView = timeline.views[lastUnitInterval.idx]
			let stmtDuration = stmt.duration ? stmt.duration : lastView.duration
			let viewInterval = timeline.addView(startTimeLocal, stmtDuration, lastView.viewType, lastView.movementType, lastView.viewSource, lastView.viewTarget, ViewModes.CONTINUE, lastView)
			actionInterval = viewInterval
		}
		//IF SCENE ALREADY EXISTS ADD TO TIMELINE FOR THE SCENE		
		if (stmt.rule == 'sceneHeading') {
			let sceneId = `${stmt.sceneName}${stmt.location ? ', ' + stmt.location : ''}`
			let timelineForSceneIdx = timelinesManifest.findIndex(t => t.sceneId == sceneId)
			if (timelineForSceneIdx < 0) {
				//TODO: check if this is correct
				if (timeline.sceneId && timeline.sceneId != sceneId) {
					timeline = new Timeline(timeline._readScriptFileAndParse, sceneId, stmt.sceneName)
				}
				prevStmt = stmt
				continue
			} else {
				let timelineForScene = timelinesManifest[timelineForSceneIdx]
				let goto = timeline.addGoto(startTimeLocal, timelineForSceneIdx)
				let condExp = {
					op: "TRUE",
					lhs: null,
					rhs: { root: `from_${timeline.scriptName}`, path: [] }
				}
				let firstView = timelineForScene.views[0]
				let groupId = 0//timelineForScene.NextGroupId
				timelineForScene.NextGroupId = groupId
				let jumpToScene = timelineForScene.addJump(0, firstView.duration, condExp, timelineForScene.duration + DELAY, groupId, JumpModes.CONDITION)

				timelineForScene.duration += DELAY

				let jumpToReturn = (toTimeLocal) => timelineForScene.addJump(toTimeLocal, DELAY, null, 0, groupId, JumpModes.IMMEDIATE)

				if (!sceneJumpReturnFunctions.hasOwnProperty(timelineForScene.scriptName)) {
					sceneJumpReturnFunctions[timelineForScene.scriptName] = []
				}
				sceneJumpReturnFunctions[timelineForScene.scriptName].push(jumpToReturn)

				//nextIntervalStartTimeLocal = timelineForScene.startTimeGlobal
				if (!timeline.sceneId) {
					//get script name from temp timeline and remove from manifest
					timelineForScene.scriptName = timeline.scriptName
					let idx = timelinesManifest.findIndex(t => t == timeline)
					timelinesManifest.splice(idx, 1)
				}
				timeline = timelineForScene
				nextIntervalStartTimeLocal = timeline.duration
				prevStmt = stmt
				lastLine = line
				continue
			}
		}

		//INGEST
		let { interval, node } = await timeline.ingestStmt(stmt, startTimeLocal, lastUnitInterval, line, lastOutputNode)

		if (stmt.rule == "goto") {
			nextIntervalStartTimeLocal = interval.startTimeLocal + interval.duration
		}

		//add view for actions
		if (actionInterval != null) {
			let actionView = timeline.views[actionInterval.idx]
			actionView.track = interval.track
			actionView.groupId = interval.parent
			lastUnitInterval = actionInterval
			//lastOutputNode = findLast(node.nodes, n => n.title == 'Output')
		}

		if (stmt.rule == "view") {
			nextIntervalStartTimeLocal = timeline.duration
			lastUnitInterval = interval//timeline.views[timeline.views.length - 1]
			lastOutputNode = findLast(timeline._graph.nodes, n => n.title == 'Output')
		}
		if(stmt.rule == "cond"){
			lastOutputNode = node
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
	let mergedTimeline = timelinesManifest.find(t => t.scriptName == originalTimeline.scriptName)
	let returnToParentScope = mergedTimeline.addReturn(nextIntervalStartTimeLocal, mergedTimeline.scriptName)

	let sceneJumps = sceneJumpReturnFunctions[mergedTimeline.scriptName]
	while (sceneJumps && sceneJumps.length > 0) {
		let jumpToReturnFunction = sceneJumps.pop()
		jumpToReturnFunction(mergedTimeline.duration)
	}
	//SORT BY TYPE
	//mergedTimeline.sortIntervals()
	return timeline
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

function findLast(items, predicate) {
	for (var i = items.length - 1; i >= 0; i--) {
		var item = items[i];

		if (predicate(item)) {
			return item;
		}
	}
}