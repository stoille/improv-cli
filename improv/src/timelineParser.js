const nearley = require('nearley')
const grammar = require('./grammar')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *t*$/) !== null
const { resolveHome } = require('./common')

var DEBUG = true

var IntervalTypes = {
	INTERVAL: 0,
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

var timelinesManifest = []
var outputDirectory = undefined
var timelineStart = 0

class Timeline {
	id = ""
	path = ""
	start = 0
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

	constructor(path, readScriptFileAndParse) {
		this.path = path
		this.id = path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
		//function to read a new script
		this._readScriptFileAndParse = readScriptFileAndParse
		timelinesManifest.push(this)
	}
	_getIdx(type) {
		if (!this._indices.hasOwnProperty(type)) {
			this._indices[type] = 0
		}
		return this._indices[type]++
	}
	_addInterval(start, duration, type, idx, parentGroupId) {
		let i = { id: this._getIdx(IntervalTypes.INTERVAL), type, idx, start, duration, track: this.CurrTrackId, group: this.CurrGroupId, parent: parentGroupId ? parentGroupId : this.CurrGroupId }
		this.intervals.push(i)
		let end = start + duration
		if (end > this.duration) {
			this.duration = end
			this.start = timelineStart
			timelineStart += this.duration
		}
		return i
	}
	sortIntervals() {
		this.intervals.sort((a, b) => a.group - b.group || a.track - b.track || a.type - b.type)
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
	addScene(time, scenePlacement, sceneName, location, timeOfDay) {
		let sceneInterval = this._addInterval(time, 1, IntervalTypes.SCENE, this.scenes.length)
		this.scenes.push({ id: this._getIdx(IntervalTypes.SCENE), scenePlacement, sceneName: sceneName, location: location ? location : null, timeOfDay })
		return sceneInterval
	}
	addMarker(name, time) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let markerInterval = this._addInterval(time, 1, IntervalTypes.MARKER, markerIdx)
		//--this.CurrTrackId
		return markerInterval
	}
	addUnmarker(name, time) {
		let markerIdx = this.markers.findIndex(m => m == name)
		if (markerIdx < 0) {
			markerIdx = this.markers.length
			this.markers.push(name)
		}
		let unmarkerInterval = this._addInterval(time, 1, IntervalTypes.UNMARKER, markerIdx)
		return unmarkerInterval
	}
	addJump(start, duration, cond, toTime, groupId) {
				
		let parentGroupId = this.CurrGroupId
		if (duration > 1) {
			if (Number.isInteger(groupId)) {
				this.CurrGroupId = groupId
			} else {
				this.CurrGroupId = this.NextGroupId
				this.NextGroupId += 1
			}
		}

		let condIdx = this._getConds(cond)
		//AVOID ADDING DUPLICATES
		if (duration == 1) {
			let jumps = this.jumps
			let duplicate = this.intervals.find(i => {
				if (i.type == IntervalTypes.JUMP) {
					let j = jumps[i.idx]
					return i.start == start && i.duration == duration && j.toTime == toTime
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
		let jumpInterval = this._addInterval(start, duration, IntervalTypes.JUMP, this.jumps.length, parentGroupId)
		let condIdxs = []
		if (condIdx >= 0) {
			condIdxs.push(condIdx)
		}
		this.jumps.push({ id: this._getIdx(IntervalTypes.JUMP), condIdxs, toTime })
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
	addView(start, duration, viewType, movementType, viewSource, viewTarget) {
		let viewInteval = this._addInterval(start, duration, IntervalTypes.VIEW, this.views.length)
		this.views.push({
			id: this._getIdx(IntervalTypes.VIEW),
			viewType,
			duration,
			start,
			movementType,
			viewSource,
			viewTarget,
		})

		return viewInteval
	}
	addTransition(duration, transitionType, view) {
		view.outTransitionType = transitionType
		view.outTransitionDuration = duration
	}
	addAction(start, duration, speaker, text) {
		let actionInterval = this._addInterval(start, duration, IntervalTypes.ACTION, this.actions.length)
		this.actions.push({ id: this._getIdx(IntervalTypes.ACTION), speaker, text })
		return actionInterval
	}
	addGoto(start, timelineIdx) {
		var gotoInterval = this._addInterval(start, 1, IntervalTypes.GOTO, this.gotos.length)
		this.gotos.push(timelineIdx)
		return gotoInterval
	}
	async ingestStmt(stmt, start, lastShot, lineText) {
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
				let root = this.path.slice(0, this.path.indexOf(this.id) - 1)
				let id = stmt.path.slice(stmt.path.lastIndexOf('/') + 1)
				let impPath = `${root}${stmt.path}/${id}.imp`

				let timelineManifestId = timelinesManifest.findIndex(t => t.id === id)
				if (timelineManifestId < 0) {
					timelineManifestId = timelinesManifest.length
					let loadedTimeline = await this._readScriptFileAndParse(impPath, { timeline: true }, this, this)
				}

				let timelineInterval = this.addGoto(lastShot.duration + start, timelineManifestId)
				interval = timelineInterval
				if (DEBUG) {
					timelineInterval.line = lineText
				}
				break
			case 'sceneHeading':
				let sceneInterval = this.addScene(start, stmt.scenePlacement, stmt.sceneName, stmt.location, stmt.sceneTime)
				interval = sceneInterval
				if (DEBUG) {
					sceneInterval.line = lineText
				}
				break
			case 'view':
				let viewInterval = this.addView(
					start,
					Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration,
					stmt.viewType,
					stmt.viewMovement,
					stmt.viewSource ? stmt.viewSource : stmt.viewTarget,
					stmt.viewTarget)

				if (stmt.markers) {
					for (let marker of stmt.markers) {
						let addedMarker = this.addMarker(marker, viewInterval.start)
						if (DEBUG) {
							addedMarker.line = lineText
						}
					}
				}
				if (stmt.unmarkers) {
					for (let unmarker of stmt.unmarkers) {
						let addedUnmarker = this.addUnmarker(unmarker, viewInterval.start)
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
				let durationOfUntimedLines = lastShot.duration - totalDurationOfTimedLines
				let defaultTime = durationOfUntimedLines === 0 ? lastShot.duration : Math.round(durationOfUntimedLines / stmt.lines.filter(a => isDefaultTime(a)).length)

				let actionDuration = 0
				for (let line of stmt.lines) {
					//set default time to last view length
					if (isDefaultTime(line)) {
						line.duration = defaultTime
					}
					let action = this.addAction(start + actionDuration, line.duration, line.speaker, line.text)
					actionDuration += action.duration
					if (DEBUG) {
						action.line = lineText
					}
				}
				interval = ({ start, duration: actionDuration })
				break
			case 'cond':
				let duration = Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration
				let toTime = start + duration
				let goto = this.addJump(
					start,
					Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration,
					stmt,
					toTime)
				interval = goto
				if (DEBUG) {
					goto.line = lineText
				}
				break
			case 'transition':
				this.addTransition(stmt.transitionTime, stmt.transitionType, lastShot)

				//when there's a condition present the unit will loop back on itself until the condition is met
				let transitionDuration = 0
				if (stmt.cond) {
					//OVERRIDE GROUP ID SO THAT THIS JUMP IS INCLUEDED ON ORIGINAL SHOT GROUP
					let goto = this.addJump(
						lastShot.start,
						lastShot.duration,
						stmt.cond.result,
						start + lastShot.duration,
						this.CurrGroupId)
					transitionDuration += goto.duration
					interval = goto
					if (DEBUG) {
						goto.line = lineText
					}
				} else {
					interval = ({ start: lastShot.start, duration: lastShot.duration })
				}
				break
		}
		++this.CurrTrackId

		return interval
	}
}

module.exports.parseLines = parseLines

async function parseLines(
	filePath,
	lines,
	timeline,
	lastShotOrTimeline,
	lineCursor = 0,
	prevStmt = undefined,
	lastDefinedDuration = undefined,
	lastLine = undefined,
	envs = []
) {
	//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
	//for each line
	// advance lines until next unit at tab level
	// make unit recursively	
	let startOfNextInterval = 0//lastTimeline.duration
	lastShotOrTimeline = lastShotOrTimeline ? lastShotOrTimeline : { duration: 0 }
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
					startOfNextInterval,
					lastDefinedDuration,
					lastShotOrTimeline,
					prevStmt,
					timelineCurrTrackId: timeline.CurrTrackId,
					timelineCurrGroupId: timeline.CurrGroupId
				})
			} else if (isTabDecreased(stmt, prevStmt)) {
				//RETURN TO PARENT VIEW. THIS MUST BE DONE BEFORE POPPING ENV STACK
				let ls = timeline.views[timeline.views.length - 1]
				let currShotEnd = timeline.views.length === 0 ? 0 : ls.start + ls.duration
				timeline.addJump(currShotEnd - 1, 1, undefined, lastShotOrTimeline.start)
				startOfNextInterval += 1
				//KEEP IN ORDER WITH ABOVE
				//let d = prevStmt.depth
				let env// = envs.pop()
				let d = prevStmt.depth
				while (d > stmt.depth) {
					env = envs.pop()
					--d
				}
				//when listing conditionals in a row, use the top of the stack but don't pop it
				if (stmt.rule == "cond" && env.prevStmt.rule == "cond") {
					env = envs[envs.length - 1]
				}

				timeline = env.timeline
				//startOfNextInterval = env.startOfNextInterval
				lastDefinedDuration = env.lastDefinedDuration
				lastShotOrTimeline = env.lastShotOrTimeline
				prevStmt = env.prevStmt
				//timeline.CurrTrackId = env.timelineCurrTrackId
				timeline.CurrGroupId = env.timelineCurrGroupId
			}
			lintStmt(filePath, stmt, prevStmt, line, lastLine, lineCursor)

			if (stmt.duration) {
				lastDefinedDuration = stmt.duration
			} else {
				stmt.duration = lastShotOrTimeline.duration//lastDefinedDuration
			}

		} catch (error) {
			console.error(`${filePath} - ${error.message}`)
			process.exit(1)
		}

		let start = 0
		if (lastShotOrTimeline.hasOwnProperty('start')) {
			start = lastShotOrTimeline.start
		}
		if (stmt.rule == "view" && prevStmt.rule == "action") {
			startOfNextInterval = timeline.duration
		}
		if (stmt.rule == "view" || stmt.rule == "sceneHeading") {
			start = startOfNextInterval
		}
		if (prevStmt && prevStmt.rule == "cond") {
			start = timeline.duration
		}
		//add view for actions
		let viewAction = null
		if (stmt.rule == "action" && prevStmt.rule == "cond") {
			let duration = stmt.duration ? stmt.duration : lastShotOrTimeline.duration
			let view = timeline.addView(start, duration, lastShotOrTimeline.viewType, lastShotOrTimeline.movementType, lastShotOrTimeline.viewSource, lastShotOrTimeline.viewTarget)
			viewAction = timeline.views[view.idx]
		}

		//INGEST
		let interval = await timeline.ingestStmt(stmt, start, lastShotOrTimeline, line)

		//add view for actions
		if (viewAction != null) {
			viewAction.track = interval.track
			viewAction.group = interval.parent
		}

		//ADD JUMP AT CONDITIONS
		if (stmt.rule == "cond" && prevStmt.rule == "action") {
			let goto = timeline.addJump(
				interval.start + interval.duration,
				1,
				null,
				lastShotOrTimeline.start)
			//goto.track = interval.track
			//goto.group = interval.parent
		}
		if (stmt.rule == "view") {
			startOfNextInterval = timeline.duration + 1
			lastShotOrTimeline = timeline.views[timeline.views.length - 1]
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
	//SORT BY TYPE
	timeline.sortIntervals()
	return timeline
}

module.exports.impToTimeline = impToTimeline

async function impToTimeline(filePath, outputDir, readScriptFileAndParse, lines, lastTimeline, isFirstTimelineInManifest) {
	if (!outputDirectory) {
		outputDirectory = resolveHome(outputDir)
	}

	//let start = lastTimeline ? lastTimeline.start + lastTimeline.duration + 1 : 0
	let timeline = await parseLines(filePath, lines, new Timeline(filePath, readScriptFileAndParse), lastTimeline)
	let timelinePath = `${outputDirectory}/${timeline.path.slice(timeline.path.lastIndexOf('/') + 1, timeline.path.lastIndexOf('.'))}.json`
	delete timeline.path// = timeline.path.slice(timeline.path.lastIndexOf('/') + 1, timeline.path.lastIndexOf('.'))
	let timelineJson = JSON.stringify(timeline)
	await writeFile(timelinePath, timelineJson)

	if (isFirstTimelineInManifest) {
		let lastTimelineInManifest = null
		for (let timeline of timelinesManifest) {
			timeline.start = lastTimelineInManifest ? lastTimelineInManifest.start + lastTimelineInManifest.duration + 1 : 0
			lastTimelineInManifest = timeline
		}
		let manifest = JSON.stringify(timelinesManifest.map(t => ({ id: t.id, start: t.start, duration: t.duration })))
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