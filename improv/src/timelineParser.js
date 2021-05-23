const nearley = require('nearley')
const grammar = require('./grammar')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *t*$/) !== null
const { resolveHome } = require('./common')
const { start } = require('xstate/lib/actions')

var DEBUG = true

var IntervalTypes = {
	RETURN: 0,
	SCENE: 1,
	VIEW: 2,
	MARKER: 4,
	UNMARKER: 8,
	ACTION: 16,
	JUMP: 32,
	GOTO: 64
}

var CondTypes = {
	AND: 0,
	OR: 1,
	SELECT: 2,
	TRUE: 4,
	FALSE: 8,
	INPUT: 16
}

var ViewModes = {
	CONTINUE: 0,
	RETURN: 1,
	LOOP: 2
}

var JumpModes = {
	IMMEDIATE: 0,
	CONDITION: 1,
	TRANSITION: 2
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
	scenes = []
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

	constructor(readScriptFileAndParse, sceneId, scriptName) {
		this.sceneId = sceneId
		this.scriptName = scriptName
		this._readScriptFileAndParse = readScriptFileAndParse
		//function to read a new script
		timelinesManifest.push(this)
		this.startTimeGlobal = nextTimelineStartTimeGlobal
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
	sortIntervals() {
		this.intervals.sort((a, b) => a.groupId - b.groupId || a.track - b.track || a.type - b.type)
	}
	getClip(type, idx) {
		switch (type) {
			case IntervalTypes.SCENE: return this.scenes[idx]
			case IntervalTypes.MARKER: return this.markers[idx]
			case IntervalTypes.UNMARKER: return this.markers[idx]
			case IntervalTypes.JUMP: return this.jumps[idx]
			case IntervalTypes.VIEW: return this.views[idx]
			case IntervalTypes.ACTION: return this.actions[idx]
			case IntervalTypes.GOTO: return this.gotos[idx]
			default: return undefined
		}
	}
	addScene(startTimeLocal, scenePlacement, sceneName, location, timeOfDay) {
		let sceneId = `${sceneName}${location ? ', ' + location : ''}`
		this.sceneId = sceneId
		let sceneInterval = this._addInterval(startTimeLocal, 1, IntervalTypes.SCENE, this.scenes.length)
		this.scenes.push({ id: this._getIdx(IntervalTypes.SCENE), scenePlacement, sceneName, location: location ? location : null, timeOfDay })
		return sceneInterval
	}
	addMarker(name, startTimeLocal) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let markerInterval = this._addInterval(startTimeLocal, 1, IntervalTypes.MARKER, markerIdx)
		//--this.CurrTrackId
		return markerInterval
	}
	addUnmarker(name, startTimeLocal) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let unmarkerInterval = this._addInterval(startTimeLocal, 1, IntervalTypes.UNMARKER, markerIdx)
		return unmarkerInterval
	}
	addGoto(startTimeLocal, timelineIndex) {
		let gotoInterval = this._addInterval(startTimeLocal, 1, IntervalTypes.GOTO, this.gotos.length)
		let timeline = timelinesManifest[timelineIndex]
		if (timeline) {
			gotoInterval.line = `GOTO ${timeline.scriptName}`
		}
		let id = this._getIdx(IntervalTypes.GOTO)
		this.gotos.push({ id, timelineIndex })
		return gotoInterval
	}
	addReturn(startTimeLocal) {
		let returnInterval = this._addInterval(startTimeLocal, 1, IntervalTypes.RETURN, this.gotos.length)
		returnInterval.line = "RETURN"
		return returnInterval
	}
	addJump(startTimeLocal, duration, condExp, toTimeLocal, groupId, jumpMode = 0) {

		//if (duration > 1) {
		if (jumpMode == JumpModes.TRANSITION) {
			this.CurrGroupId = groupId
			jumpMode = JumpModes.CONDITION
		} else if (jumpMode == JumpModes.CONDITION) {
			``
			this.CurrGroupId = this.NextGroupId
			this.NextGroupId += 1
		}
		//}

		let condIdx = this._getConds(condExp)
		//AVOID ADDING DUPLICATES
		if (duration == 1) {
			let jumps = this.jumps
			let duplicate = this.intervals.find(i => {
				if (i.type == IntervalTypes.JUMP) {
					let j = jumps[i.idx]
					return i.startTimeLocal == startTimeLocal && i.duration == duration && j.toTimeLocal == toTimeLocal
				}
				return false
			})
			if (duplicate) {
				let jump = jumps[duplicate.idx]
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
		let jumpInterval = this._addInterval(startTimeLocal, duration, IntervalTypes.JUMP, this.jumps.length, groupId)
		let condIdxs = []
		if (condIdx >= 0) {
			condIdxs.push(condIdx)
		}
		let id = this._getIdx(IntervalTypes.JUMP)
		this.jumps.push({ id, condIdxs, toTimeLocal })
		if (DEBUG) {
			let joinedConds = condIdxs.join('_')
			joinedConds = (joinedConds.length > 0 ? '_condIdx_' : '') + joinedConds
			jumpInterval.line = `from_${startTimeLocal}_to_${toTimeLocal}${joinedConds}`
		}
		return jumpInterval
	}
	_getConds(condExp) {
		if (!condExp) {
			return -1
		}
		if (condExp.result) {
			condExp = condExp.result
		}
		let cond = {
			type: CondTypes[condExp.op.trim()],
			lhsIdx: this._getConds(condExp.lhs),
			rhsIdx: condExp.rhs.root ? -1 : this._getConds(condExp.rhs),
			value: condExp.rhs.root ? condExp.rhs.root.trim() + condExp.rhs.path.map(p => p.trim()) : undefined
		}
		this.conds.push(cond)
		return this.conds.length - 1
	}
	addView(startTimeLocal, duration, viewType, movementType, viewSource, viewTarget, mode, parentView) {
		let viewInteval = this._addInterval(startTimeLocal, duration, IntervalTypes.VIEW, this.views.length)
		this.views.push({
			id: this._getIdx(IntervalTypes.VIEW),
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

		return viewInteval
	}
	addTransition(duration, transitionType, view) {
		view.outTransitionType = transitionType
		view.outTransitionDuration = duration
	}
	addAction(startTimeLocal, duration, speaker, text) {
		let actionInterval = this._addInterval(startTimeLocal, duration, IntervalTypes.ACTION, this.actions.length)
		this.actions.push({ id: this._getIdx(IntervalTypes.ACTION), speaker, text })
		return actionInterval
	}
	async ingestStmt(stmt, startTimeLocal, lastView, lineText) {
		let interval = null
		switch (stmt.rule) {
			case 'comment':
				throw `[${stmt}] Error: comments should be skipped and not processed`
			case 'goto':
				if (!this.comments) {
					this.comments = []
				}
				if (stmt.comment) {
					this.comments.push(stmt.comment)
				}
				let scriptName = stmt.path.slice(stmt.path.lastIndexOf('/') + 1)
				let impPath = `${inputDirectory}${stmt.path}/${scriptName}.imp`

				var dur = Number.isInteger(stmt.duration) ? stmt.duration : lastView.duration
				let gotoInterval = this.addGoto(startTimeLocal + dur, null)
				interval = gotoInterval

				let foundTimelineIdx = timelinesManifest.findIndex(t => t.sceneId === scriptName || t.scriptName === scriptName)
				if (foundTimelineIdx < 0) {
					let foundTimeline = await this._readScriptFileAndParse(impPath, { timeline: true }, this, this)
					foundTimelineIdx = timelinesManifest.length - 1
					gotoInterval.line = `GOTO ${scriptName}`
				}
				let goto = this.gotos[gotoInterval.idx]
				goto.timelineIndex = foundTimelineIdx

				if (DEBUG) {
					gotoInterval.line = lineText
				}
				break
			case 'sceneHeading':
				let sceneInterval = this.addScene(startTimeLocal, stmt.scenePlacement, stmt.sceneName, stmt.location, stmt.sceneTime)
				interval = sceneInterval
				if (DEBUG) {
					sceneInterval.line = lineText
				}
				break
			case 'view':
				let viewInterval = this.addView(
					startTimeLocal,
					Number.isInteger(stmt.duration) ? stmt.duration : lastView.duration,
					stmt.viewType,
					stmt.viewMovement,
					stmt.viewSource ? stmt.viewSource : stmt.viewTarget,
					stmt.viewTarget,
					ViewModes.CONTINUE,
					lastView)

				if (stmt.markers) {
					for (let marker of stmt.markers) {
						let addedMarker = this.addMarker(marker, viewInterval.startTimeLocal)
						if (DEBUG) {
							addedMarker.line = lineText
						}
					}
				}
				if (stmt.unmarkers) {
					for (let unmarker of stmt.unmarkers) {
						let addedUnmarker = this.addUnmarker(unmarker, viewInterval.startTimeLocal)
						if (DEBUG) {
							addedUnmarker.line = lineText
						}
					}
				}
				interval = viewInterval
				if (DEBUG) {
					viewInterval.line = lineText
				}
				break
			case 'action':
				let isDefaultTime = line => line.duration === 0
				let noNaN = n => !n ? 0 : n
				let totalDurationOfTimedLines = stmt.lines.reduce((a, b) => noNaN(a.duration) + noNaN(b.duration), { duration: 0 })
				let durationOfUntimedLines = lastView.duration - totalDurationOfTimedLines
				let defaultTime = durationOfUntimedLines === 0 ? lastView.duration : Math.round(durationOfUntimedLines / stmt.lines.filter(a => isDefaultTime(a)).length)

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
				interval = ({ startTimeLocal: startTimeLocal, duration: actionDuration })
				break
			case 'cond':
				let duration = Number.isInteger(stmt.duration) ? stmt.duration : lastView.duration
				let toTimeLocal = this.duration
				let jmp = this.addJump(
					startTimeLocal,
					Number.isInteger(stmt.duration) ? stmt.duration : lastView.duration,
					stmt,
					toTimeLocal,
					undefined,
					JumpModes.CONDITION)
				interval = jmp
				if (DEBUG) {
					jmp.line = lineText
				}
				break
			case 'transition':
				this.addTransition(stmt.transitionTime, stmt.transitionType, lastView)

				//when there's a condition present the unit will loop back on itself until the condition is met
				if (stmt.cond) {
					let toTimeLocal = this.duration
					//OVERRIDE GROUP ID SO THAT THIS JUMP IS INCLUEDED ON ORIGINAL SHOT GROUP
					let jump = this.addJump(
						lastView.startTimeLocal,
						lastView.duration,
						stmt.cond.result,
						toTimeLocal,
						this.CurrGroupId,
						JumpModes.TRANSITION)
					interval = jump
					if (DEBUG) {
						jump.line = lineText
					}
				} else {
					interval = ({ startTimeLocal: lastView.startTimeLocal, duration: lastView.duration })
				}
				break
		}
		++this.CurrTrackId

		return interval
	}
}

module.exports.parseLines = parseLines

async function parseLines(
	scriptName,
	lines,
	timeline,
	lastUnitInterval,
	lineCursor = 0,
	prevStmt = undefined,
	lastDefinedDuration = undefined,
	lastLine = undefined,
	envs = []
) {
	let originalTimeline = timeline
	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively	
	let nextIntervalStartTimeLocal = 0//lastTimeline.duration
	lastUnitInterval = lastUnitInterval ? lastUnitInterval : { startTimeLocal: 0, duration: 0 }
	while (lineCursor < lines.length) {
		let line = lines[lineCursor]
		lineCursor += 1

		let stmt
		try {
			stmt = parseLine(line)

			if (!stmt || stmt.rule === 'comment' || isEmptyOrSpaces(line)) {
				continue
			}

			line = line.trim()

			if (isTabIncreased(stmt, prevStmt)) {
				envs.push({
					timeline,
					nextIntervalStartTimeLocal,
					lastDefinedDuration,
					lastUnitInterval,
					prevStmt,
					timelineCurrTrackId: timeline.CurrTrackId,
					timelineCurrGroupId: timeline.CurrGroupId
				})
			} else if (isTabDecreased(stmt, prevStmt)) {
				//RETURN TO PARENT VIEW. THIS MUST BE DONE BEFORE POPPING ENV STACK
				//let ls = timeline.views[timeline.views.length - 1]				
				//let returnJump = timeline.addJump(currViewEnd, 1, null, lastUnitInterval.startTimeLocal, lastUnitInterval.groupId, JumpModes.IMMEDIATE)
				let startTimeLocal = -1
				let viewsNeedingReturnTime = [lastUnitInterval]
				let currViewEnd = lastUnitInterval.startTimeLocal + lastUnitInterval.duration
				let returnJumps = [currViewEnd]
				//KEEP IN ORDER WITH ABOVE
				let env// = envs.pop()
				let d = prevStmt.depth
				while (d > stmt.depth) {
					env = envs.pop()
					startTimeLocal = env.lastUnitInterval.startTimeLocal
					returnJumps.push(env.lastUnitInterval.startTimeLocal + env.lastUnitInterval.duration)
					--d
					if (d > stmt.depth) {
						viewsNeedingReturnTime.push(env.lastUnitInterval)
					}
				}
				if (startTimeLocal < 0) {
					throw `[${filePath}] Error: no scoped environments found on tab decrease`
				}
				returnJumps = returnJumps
					.filter((v, i, a) => a.indexOf(v) === i) //unique entries only
					.filter(v => !timeline.intervals.find(interval => interval.type === IntervalTypes.GOTO && interval.startTimeLocal === v)) //don't add return jumps on top of gotos
				for (let returnJumpStartTimeLocal of returnJumps) {
					timeline.addJump(returnJumpStartTimeLocal - 1, 1, null, startTimeLocal, env.lastUnitInterval.groupId, JumpModes.IMMEDIATE)
				}

				for (let view of viewsNeedingReturnTime) {
					view.returnTime = startTimeLocal
				}

				//when listing conditionals in a row, use the top of the stack but don't pop it
				if (stmt.rule == "cond" && env.prevStmt.rule == "cond") {
					env = envs[envs.length - 1]
				}

				timeline = env.timeline
				lastDefinedDuration = env.lastDefinedDuration
				lastUnitInterval = env.lastUnitInterval
				prevStmt = env.prevStmt
				timeline.CurrGroupId = env.timelineCurrGroupId
			}
			lintStmt(scriptName, stmt, prevStmt, line, lastLine, lineCursor)

			if (stmt.duration) {
				lastDefinedDuration = stmt.duration
			} else {
				stmt.duration = lastUnitInterval.duration
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
		let actionViewInterval = null
		if (stmt.rule == "action" && prevStmt.rule == "cond") {
			let lastView = timeline.views[lastUnitInterval.idx]
			let stmtDuration = stmt.duration ? stmt.duration : lastView.duration
			let view = timeline.addView(startTimeLocal, stmtDuration, lastView.viewType, lastView.movementType, lastView.viewSource, lastView.viewTarget, ViewModes.CONTINUE, lastView)
			actionViewInterval = view
		}
		//IF SCENE ALREADY EXISTS ADD TO TIMELINE FOR THE SCENE
		if (stmt.rule == 'sceneHeading') {
			let sceneId = `${stmt.sceneName}${stmt.location ? ', ' + stmt.location : ''}`
			let timelineForSceneIdx = timelinesManifest.findIndex(t => t.sceneId == sceneId)
			if (timelineForSceneIdx < 0) {
				//TODO: check if this is correct
				if (timeline.sceneId && timeline.sceneId != sceneId) {
					timeline = new Timeline(timeline._readScriptFileAndParse, sceneId, sceneId)
				}
			} else {
				let timelineForScene = timelinesManifest[timelineForSceneIdx]
				let goto = timeline.addGoto(startTimeLocal, timelineForSceneIdx)
				let condExp = {
					op: "TRUE",
					lhs: null,
					rhs: { root: `from_${timeline.scriptName}`, path: [] }
				}
				let firstView = timelineForScene.views[0]
				let jump = timelineForScene.addJump(0, firstView.duration, condExp, timelineForScene.startTimeGlobal + timelineForScene.duration, timeline.CurrGroupId, JumpModes.CONDITION)
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
		let interval = await timeline.ingestStmt(stmt, startTimeLocal, lastUnitInterval, line)

		if (stmt.rule == "goto") {
			nextIntervalStartTimeLocal = interval.startTimeLocal + interval.duration
		}

		//add view for actions
		if (actionViewInterval != null) {
			let actionView = timeline.views[actionViewInterval.idx]
			actionView.track = interval.track
			actionView.groupId = interval.parent
			lastUnitInterval = actionViewInterval
		}

		if (stmt.rule == "view") {
			nextIntervalStartTimeLocal = timeline.duration + 1
			lastUnitInterval = interval//timeline.views[timeline.views.length - 1]
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
	let returnToParentScope = mergedTimeline.addReturn(mergedTimeline.duration)

	//SORT BY TYPE
	//mergedTimeline.sortIntervals()
	return mergedTimeline
}

module.exports.impToTimeline = impToTimeline

async function impToTimeline(filePath, outputDir, readScriptFileAndParse, lines, lastTimeline, isFirstTimelineInManifest) {
	if (!outputDirectory && !inputDirectory) {
		inputDirectory = filePath.slice(0, filePath.lastIndexOf('/'))
		inputDirectory = inputDirectory.slice(0, inputDirectory.lastIndexOf('/') + 1)
		outputDirectory = resolveHome(outputDir)
	}

	//let start = lastTimeline ? lastTimeline.startTimeLocal + lastTimeline.duration + 1 : 0
	let scriptName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
	let nextTimeline = new Timeline(readScriptFileAndParse, null, scriptName)
	let lastTimelineStartTimeLocal = lastTimeline ? lastTimeline.startTimeGlobal : 0
	let lastTimelineDuration = lastTimeline ? lastTimeline.duration : 0
	let lastInterval = { startTimeLocal: nextTimeline.startTimeGlobal - lastTimelineStartTimeLocal, duration: lastTimelineDuration }
	let timeline = await parseLines(scriptName, lines, nextTimeline, lastInterval)

	let timelinePath = `${outputDirectory}/${timeline.sceneId}.json`//${timeline.path.slice(timeline.path.lastIndexOf('/') + 1, timeline.path.lastIndexOf('.'))}.json`
	timelineJson = JSON.stringify(timeline)
	await writeFile(timelinePath, timelineJson)

	if (isFirstTimelineInManifest) {
		let lastTimelineInManifest = null
		for (let timeline of timelinesManifest) {
			timeline.startTimeGlobal = lastTimelineInManifest ? lastTimelineInManifest.startTimeGlobal + lastTimelineInManifest.duration + 1 : 0
			lastTimelineInManifest = timeline
		}
		let manifest = JSON.stringify(timelinesManifest.map(t => ({ scriptName: t.scriptName, sceneId: t.sceneId, startTimeGlobal: t.startTimeGlobal, duration: t.duration })))
		await writeFile(`${outputDirectory}/manifest.json`, manifest)
	}

	return timeline
}

function isTabIncreased(stmt, prevStmt) {
	return stmt && prevStmt && stmt.depth > prevStmt.depth
}

function isTabDecreased(stmt, prevStmt) {
	return stmt && prevStmt && stmt.depth < prevStmt.depth
}

function parseLine(lineText) {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), {
		keepHistory: false
	})
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
					//TODO: explore eliminating rule that conditions be indented under actions
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
			//throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
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