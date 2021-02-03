const nearley = require('nearley')
const grammar = require('./grammar')
const uuidv4 = require('uuid/v4')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *t*$/) !== null
const { resolveHome } = require('./common')

var IntervalType = {
	SCENE: "SCENE",//0,
	MARKER: "MARKER",//1,
	UNMARKER: "UNMARKER",//2,
	GOTO: "GOTO",//4,
	SHOT: "SHOT",//8,
	ACTION: "ACTION",//16,
	LOAD: "LOAD"//32
}

var timelines = []
var outputDirectory = undefined

class Timeline {
	id = ""
	path = ""
	duration = 0
	intervals = []
	scenes = []
	markerNames = []
	gotos = []
	conds = []
	shots = []
	actions = []
	loads = []

	constructor(path, readScriptFileAndParse) {
		this.path = path
		this.id = path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
		//function to read a new script
		this._readScriptFileAndParse = readScriptFileAndParse
		timelines.push(this)
	}
	_addInterval(start, duration, type, idx) {
		let i = { id: uuidv4(), type, idx, start, duration }
		this.intervals.push(i)
		let end = start + duration
		if (end > this.duration) {
			this.duration = end
		}
		return i
	}
	getClip(type, idx) {
		switch (type) {
			case IntervalType.SCENE: return this.scenes[idx]
			case IntervalType.MARKER: return this.markerNames[idx]
			case IntervalType.UNMARKER: return this.markerNames[idx]
			case IntervalType.GOTO: return this.gotos[idx]
			case IntervalType.SHOT: return this.shots[idx]
			case IntervalType.ACTION: return this.actions[idx]
			case IntervalType.LOAD: return this.loads[idx]
			default: return undefined
		}
	}
	addScene(time, scenePlacement, sceneName, location, timeOfDay) {
		let scene = this._addInterval(time, 0, IntervalType.SCENE, this.scenes.length)
		this.scenes.push({ id: uuidv4(), scenePlacement, sceneName, location, timeOfDay })
		return scene
	}
	addMarker(name, time) {
		let marker = this._addInterval(time, 0, IntervalType.MARKER, this.markerNames.length)
		this.markerNames.push(name)
		return marker
	}
	addUnmarker(name, time) {
		let unmarker = this._addInterval(time, 0, IntervalType.UNMARKER, this.markerNames.length)
		this.markerNames.push(name)
		return unmarker
	}
	addGoto(start, duration, cond, toTime) {
		//TODO deduplication logic
		let goto = this._addInterval(start, duration, IntervalType.GOTO, this.gotos.length)
		let condIdx = this._getConds(cond)
		this.gotos.push({ id: uuidv4(), condIdx, toTime })
		return goto
	}
	_getConds(condExp) {
		if (!condExp) {
			return Number.NaN
		}
		if (condExp.result) {
			condExp = condExp.result
		}
		let cond = {
			type: condExp.op.trim(),
			lhsIdx: this._getConds(condExp.lhs),
			rhsIdx: condExp.rhs.root ? Number.NaN : this._getConds(condExp.rhs),
			value: condExp.rhs.root ? condExp.rhs.root.trim() + condExp.rhs.path.map(p => p.trim()) : undefined
		}
		this.conds.push(cond)
		return this.conds.length - 1
	}
	addShot(start, duration, shotType, movementType, viewSource, viewTarget, marker, unmarker) {
		let shot = this._addInterval(start, duration, IntervalType.SHOT, this.shots.length)
		this.shots.push({
			id: uuidv4(),
			shotType,
			duration,
			start,
			movementType,
			viewSource,
			viewTarget,
			marker,
			unmarker
		})
		return shot
	}
	addTransition(duration, transitionType, shot) {
		shot.outTransitionType = transitionType
		shot.outTransitionDuration = duration
	}
	addAction(start, duration, speaker, text) {
		{
			var action = this._addInterval(start, duration, IntervalType.ACTION, this.actions.length)
			this.actions.push({ id: uuidv4(), speaker, text })
			return action
		}
	}
	addTimelineLoad(start, timelineIdx) {
		{
			var timeline = this._addInterval(start, 0, IntervalType.LOAD, this.loads.length)
			this.loads.push(timelineIdx)
			return timeline.duration
		}
	}
	async ingestStmt(stmt, start, lastShot) {
		let stmtDuration = 0
		switch (stmt.rule) {
			case 'comment':
				throw `[${stmt}] Error: comments should be skipped and not processed`
			case 'loadScript':
				if (!this.comments) {
					this.comments = []
				}
				if (stmt.comment) {
					this.comments.push(stmt.comment)
				}
				let path = this.path.slice(0, this.path.lastIndexOf('/'))
				path = path.slice(0, path.lastIndexOf('/'))
				path = `${path}${stmt.path}${stmt.path.slice(stmt.path.lastIndexOf('/'))}`

				let id = path.slice(path.lastIndexOf('/') + 1)
				let loadedTimelineIdx = timelines.findIndex(t => t.id === id)
				if (loadedTimelineIdx < 0) {
					let impPath = `${path}.imp`
					let timeline = await this._readScriptFileAndParse(impPath, { timeline: true }, this, lastShot)
					loadedTimelineIdx = timelines.findIndex(t => t.id === timeline.id)
				}

				let loadedTimeline = timelines[loadedTimelineIdx]
				let timelineJson = JSON.stringify(loadedTimeline)
				await writeFile(`${outputDirectory}/${id}.json`, timelineJson)

				let timelineInterval = this.addTimelineLoad(start, loadedTimelineIdx)
				stmtDuration = 0
				break
			case 'sceneHeading':
				let sceneInterval = this.addScene(start, stmt.scenePlacement, stmt.scene, stmt.scene, stmt.sceneTime)
				stmtDuration = sceneInterval.duration
				break
			case 'shot':
				let shot = this.addShot(
					start,
					Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration,
					stmt.viewType,
					stmt.viewMovement,
					stmt.viewSource ? stmt.viewSource : stmt.viewTarget,
					stmt.viewTarget,
					stmt.marker,
					stmt.unmarker)

				if (shot.marker) {
					this.addMarker(line.marker, action.start)
				}
				if (shot.unmarker) {
					this.addUnmarker(line.marker, action.start)
				}
				stmtDuration = shot.duration
				break
			case 'action':
				let isDefaultTime = line => line.duration === 0
				let noNaN = n => !n ? 0 : n
				let totalDurationOfTimedLines = stmt.lines.reduce((a, b) => noNaN(a.duration) + noNaN(b.duration), { duration: 0 })
				let durationOfUntimedLines = lastShot.duration - totalDurationOfTimedLines
				let defaultTime = durationOfUntimedLines === 0 ? lastShot.duration : Math.round(durationOfUntimedLines / stmt.lines.filter(a => isDefaultTime(a)).length)

				let actionDuration = 0
				for (let line of stmt.lines) {
					//set default time to last shot length
					if (isDefaultTime(line)) {
						line.duration = defaultTime
					}
					let action = this.addAction(actionDuration, line.duration, line.speaker, line.text)
					actionDuration += action.duration
				}
				stmtDuration = actionDuration
				break
			case 'cond':
				let duration = Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration
				let toTime = start + duration
				let goto = this.addGoto(
					start,
					Number.isInteger(stmt.duration) ? stmt.duration : lastShot.duration,
					stmt,
					toTime)
				stmtDuration = goto.duration
				break
			case 'transition':
				let transition = this.addTransition(stmt.transitionTime, stmt.transitionType, lastShot)

				//when there's a condition present the unit will loop back on itself until the condition is met
				let transitionDuration = 0
				if (stmt.cond) {
					let goto = this.addGoto(
						start,
						Number.isInteger(stmt.cond.result.end) && stmt.cond.result.end > 0 ? stmt.cond.result.end : lastShot.duration,
						stmt.cond.result,
						start + lastShot.duration)
					transitionDuration += goto.duration
				}
				stmtDuration = transitionDuration
				break;
		}

		return stmtDuration
	}
}

module.exports.parseLines = parseLines

async function parseLines(
	filePath,
	lines,
	timeline,
	lastShot = { duration: 0 },
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
	let startOfNextInterval = 0
	while (lineCursor < lines.length) {
		let line = lines[lineCursor]
		lineCursor += 1

		let stmt
		try {
			stmt = parseLine(line)

			if (!stmt || stmt.rule === 'comment' || isEmptyOrSpaces(line)) {
				continue
			}

			if (stmt.duration) {
				lastDefinedDuration = stmt.duration
			} else {
				stmt.duration = lastDefinedDuration
			}
			line = line.trim()

			if (isTabIncreased(stmt, prevStmt)) {
				envs.push({
					timeline,
					startOfNextInterval,
					lastDefinedDuration,
					lastShot,
					prevStmt
				})
			} else if (isTabDecreased(stmt, prevStmt)) {
				//RETURN TO PARENT SHOT. THIS MUST BE DONE BEFORE POPPING ENV STACK
				let currShotEnd = timeline.shots.length === 0 ? 0 : timeline.shots[timeline.shots.length - 1].start + timeline.shots[timeline.shots.length - 1].duration
				timeline.addGoto(currShotEnd, 0, undefined, lastShot.start)
				//KEEP IN ORDER WITH ABOVE
				let d = prevStmt.depth - 1
				let env = envs.pop()
				while (d > stmt.depth) {
					env = envs.pop()
					d -= 1
				}

				timeline = env.timeline
				//startOfNextInterval = env.startOfNextInterval
				lastDefinedDuration = env.lastDefinedDuration
				lastShot = env.lastShot
				prevStmt = env.prevStmt
			}
			lintStmt(filePath, stmt, prevStmt, line, lastLine, lineCursor)

		} catch (error) {
			console.error(`${filePath} - ${error.message}`)
			process.exit(1)
		}
		let start = stmt.rule == "shot" ? startOfNextInterval : lastShot.start
		await timeline.ingestStmt(stmt, start, lastShot)

		if (stmt.rule == "shot") {
			startOfNextInterval = timeline.duration
			lastShot = timeline.shots[timeline.shots.length - 1]
		}
		if (stmt.rule !== "loadScript") {
			prevStmt = stmt
			lastLine = line
		}

		//TODO: extend all action durations in parent shots
		/*
		let end = start + duration
		if (end > parentShot.duration) {
			parentShot.duration = end
		}
		*/
	}
	return timeline
}

module.exports.impToTimeline = impToTimeline

async function impToTimeline(filePath, outputDir, readScriptFileAndParse, lines, lastShot, firstRun) {
	if (!outputDirectory) {
		outputDirectory = resolveHome(outputDir);
	}

	let timeline = new Timeline(filePath, readScriptFileAndParse);
	timeline = await parseLines(filePath, lines, timeline, lastShot)
	if (firstRun) {
		let timelineIds = JSON.stringify(timelines.map(t => ({ id: t.id, path: `${outputDirectory}/${t.id}.json` })))
		writeFile(`${outputDirectory}/manifest.json`, timelineIds)
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
		if (!results.hasOwnProperty(result.rule)) {
			results[result.rule] = result
		}
	}

	let addRule = (r, ruleOverride) => ({ rule: ruleOverride ? ruleOverride : r.rule, depth: r.depth, ...r.result })
	if (results.sceneHeading) return addRule(results.sceneHeading)
	if (results.sceneHeading) return addRule(results.sceneHeading)
	if (results.shotFullUnmarker) return addRule(results.shotFullUnmarker, 'shot')
	if (results.shotFullMarker) return addRule(results.shotFullMarker, 'shot')
	if (results.shotFullNoMarker) return addRule(results.shotFullNoMarker, 'shot')
	if (results.shotNoDurationUnmarker) return addRule(results.shotNoDurationUnmarker, 'shot')
	if (results.hotNoDurationMarker) return addRule(results.hotNoDurationMarker, 'shot')
	if (results.shotNoDurationNoMarker) return addRule(results.shotNoDurationNoMarker, 'shot')
	if (results.shotNoMovementUnmarker) return addRule(results.shotNoMovementUnmarker, 'shot')
	if (results.shotNoMovementMarker) return addRule(results.shotNoMovementMarker, 'shot')
	if (results.shotNoMovementNoMarker) return addRule(results.shotNoMovementNoMarker, 'shot')
	if (results.shotNoSourceUnmarker) return addRule(results.shotNoSourceUnmarker, 'shot')
	if (results.shotNoSourceMarker) return addRule(results.shotNoSourceMarker, 'shot')
	if (results.shotNoSourceNoMarker) return addRule(results.shotNoSourceNoMarker, 'shot')
	if (results.shotNoSourceNoMovementnmarker) return addRule(results.shotNoSourceNoMovementnmarker, 'shot')
	if (results.shotNoSourceNoMovementMarker) return addRule(results.shotNoSourceNoMovementMarker, 'shot')
	if (results.shotNoSourceNoMovementNoMarker) return addRule(results.shotNoSourceNoMovementNoMarker, 'shot')
	if (results.shotNoSourceNoDurationUnmarker) return addRule(results.shotNoSourceNoDurationUnmarker, 'shot')
	if (results.shotNoSourceNoDurationMarker) return addRule(results.shotNoSourceNoDurationMarker, 'shot')
	if (results.shotNoSourceNoDurationNoMarker) return addRule(results.shotNoSourceNoDurationNoMarker, 'shot')
	if (results.shotNoMovementNoDurationUnmarker) return addRule(results.shotNoMovementNoDurationUnmarker, 'shot')
	if (results.shotNoMovementNoDurationMarker) return addRule(results.shotNoMovementNoDurationMarker, 'shot')
	if (results.shotNoMovementNoDurationNoMarker) return addRule(results.shotNoMovementNoDurationNoMarker, 'shot')
	if (results.shotNoSourceNoMovementNoDurationUnmarker) return addRule(results.shotNoSourceNoMovementNoDurationUnmarker, 'shot')
	if (results.shotNoSourceNoMovementNoDurationMarker) return addRule(results.shotNoSourceNoMovementNoDurationMarker, 'shot')
	if (results.shotNoSourceNoMovementNoDurationNoMarker) return addRule(results.shotNoSourceNoMovementNoDurationNoMarker, 'shot')
	if (results.action) return addRule(results.action)
	if (results.transition) return addRule(results.transition)
	if (results.cond) return addRule(results.cond)
	if (results.comment) return addRule(results.comment)
	if (results.loadScript) return addRule(results.loadScript)
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
				case 'comment':
				case 'loadScript':
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
					case 'loadScript':
					case 'action':
					case 'transition':
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
						break;
				}
			}
			break
		case 'shot':
			if (prevStmt) {
				switch (prevStmt.rule) {
					case 'comment':
					case 'loadScript':
					case 'action':
					case 'transition':
					case 'sceneHeading':
						break
					case 'cond':
						//TODO: explore eliminating condition statement depth rules
						if (prevStmt.depth === stmt.depth) {
							throw `[${filePath}] Error: shots that follow a condition must be indented${lines}`
						}
						break
					default:
						throw `[${filePath}] Error: shot heading must follow an action, transition or sceneHeading${lines}`
				}
			}
			break
		case 'action':
			switch (prevStmt.rule) {
				case 'comment':
				case 'loadScript':
				case 'action':
				case 'shot':
					break
				case 'cond':
					//TODO: explore eliminating condition statement depth rules
					if (prevStmt.depth === stmt.depth) {
						throw `[${filePath}] Error: actions that follow a condition must be indented${lines}`
					}
					break
				default:
					throw `[${filePath}] Error: action must follow a shot heading, or another action${lines}`
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
					if (prevStmt.depth === stmt.depth) {
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

	if (isTabIncreased(stmt, prevStmt)) {
		if (stmt.depth - prevStmt.depth > 1) {
			throw `[${filePath}] Error: statement depth greater than parent${lines}`
		}
		if (stmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (isTabDecreased(stmt, prevStmt)) {
		if (prevStmt.rule === 'action') {
			let depth = prevStmt.depth - stmt.depth
			let isOdd = n => n % 2
			if (stmt.rule === 'cond') {
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