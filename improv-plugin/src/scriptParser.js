/*
	TODO:
	1. migrate this script to TypeScript
	2. node types should be defined as new types that extends GraphNode from renderer/editor/graph/node.ts. json templates will break eventually
	3. consolidate global functions into Graph class
*/
const nearley = require('nearley')
const grammar = require('./grammar')
var os = require("os");
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
//const mkdir = util.promisify(fs.mkdir)
const isEmptyOrSpaces = l => !l || l === null || l.match(/^ *\t*$/) !== null || l == ''

const DEBUG = true
const DELAY = 200

var ScriptTypes = {
	RETURN: "RETURN",
	VIEW: "VIEW",
	MARKER: "MARKER",
	UNMARKER: "UNMARKER",
	ACTION: "ACTION",
	JUMP: "JUMP",
	PLAY: "PLAY"
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


var nodeTemplateText = ''
const SCENE_DIR = 'improv-scenes'
async function generateBabylonSource(rootImprovScriptPath, outputDir) {
	if (!ScriptParser.OutputPath) {
		ScriptParser.OutputPath = `${outputDir}/${SCENE_DIR}`
	}
	return new Promise(res => {
		fs.mkdir(ScriptParser.OutputPath, { recursive: true }, (err) => {
			generateBabylonScriptParser(rootImprovScriptPath)
				.then(generated => {
					const rootIndexPath = `${ScriptParser.OutputPath}/improv.ts`
					const rootImports = `${Array.from(ScriptParser.AllScripts.values()).map(path => `
						import ${path} from './${path}.gen'
						export {${path}}`)
						.join(os.EOL)}`
					readFile(`${process.env.PWD}/../improv-plugin/src/templates/improv.ts`, { encoding: 'utf8' }).then(improvSrc => {
						writeFile(rootIndexPath, `${rootImports}${os.EOL}${improvSrc}`, () => {
							res(generated)
						})
					})
				})
		})
	})
}
module.exports.generateBabylonSource = generateBabylonSource

async function generateBabylonScriptParser(rootImprovScriptPath, defaultSceneId = undefined, defaultViewId = undefined) {
	//returned cached parser
	if (ScriptParser.cachedParsers.hasOwnProperty(rootImprovScriptPath)) {
		return ScriptParser.cachedParsers[rootImprovScriptPath]
	}
	var appRoot = process.env.PWD;
	nodeTemplateText = await readFile(`${appRoot}/../improv-plugin/src/templates/babylon-node-template.ts`, { encoding: 'utf8' })
	let extension = rootImprovScriptPath.split('.').pop()
	if (extension !== "imp") {
		console.error("File extension not supported. Improv script required.")
	}
	console.log(`parsing improv script...`)
	let parser = new ScriptParser(rootImprovScriptPath, defaultSceneId, defaultViewId)
	await parser.readScriptFileAndParse()
	//cache parser
	ScriptParser.cachedParsers[rootImprovScriptPath] = parser
	return parser
}

class ScriptParser {
	scriptName = undefined
	scriptPath = undefined
	scriptPathDir = undefined
	defaultSceneId = undefined
	scenesToLoad = []
	currView = undefined
	lastDefinedDuration = 0
	lines = ''
	lineCursor = 0
	viewStmts = []
	scripts = new Set()
	views = []
	actions = []
	transitions = []
	viewStack = []
	static transitionStack = []
	static cachedParsers = {}
	// code generation support
	_parserOutput = ''
	_babylonSceneObjectsSrc = '/** IMPROV AUTO GENERATED **/'
	_babylonSceneObjects = {}

	// all scripts
	static AllScripts = new Set()
	static OutputPath = undefined
	static NextViewId = 0
	static NextActionId = 0

	constructor(scriptPath, defaultSceneId = undefined, defaultViewId = undefined) {
		this.scriptPath = scriptPath
		this.scriptPathDir = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1)
		this.scriptName = scriptPath.slice(scriptPath.lastIndexOf('/') + 1, scriptPath.lastIndexOf('.'))
		this.defaultSceneId = defaultSceneId
		this.lastViewId = defaultViewId
	}
	addMarker(marker) {
		return `improv.addMarker('${marker}')`
	}
	removeMarker(marker) {
		return `improv.removeMarker('${marker}')`
	}
	addPlay(stmt) {
		this.scripts.add(stmt.path)
		return `this._${stmt.path}.playScript()${os.EOL}`
	}
	async addCond(stmt) {
		let lineCursor = this.lineCursor
		return `if(${this.getConds(stmt)}){
			${await this.parseUntil(currStmt => currStmt.depth <= stmt.depth)}
			//closing if scope: ${this.lines[lineCursor - 1]}
		}`
	}
	getConds(condExp) {
		//recursively parse expressions
		if (!condExp) {
			return null
		}
		if (condExp.result) {
			condExp = condExp.result
		}
		let type = CondTypes[condExp.op]

		//if logic node, call recurisively to get lhs/rhs links
		if (type == CondTypes.AND || type == CondTypes.OR) {
			return `(${this.getConds(condExp.lhs)} ${type === CondTypes.AND ? '&&' : '||'}${condExp.rhs.root ? null : this.getConds(condExp.rhs)})`
		}
		//BABYLON
		let fullPath = condExp.rhs.path.root + (condExp.rhs.path.path.length > 0 ? condExp.rhs.path.path.join('/') : '')
		this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(fullPath)
		if (condExp.op == 'SELECT') {
			let objectIndex = Object.keys(this._babylonSceneObjects).indexOf(fullPath)
			return `improv.isSelected(this.objectMeshes[${objectIndex}])`
		}
		else if (condExp.op == 'FALSE') {
			return `!improv.AllMarkers['${fullPath}']`
		} else {
			return `improv.AllMarkers['${fullPath}']`
		}
	}


	addScene(stmt) {
		const sceneId = `${stmt.sceneName}_${stmt.scenePlacement}`
		if (this.defaultSceneId == null) {
			this.defaultSceneId = sceneId
		}
		this.scenesToLoad.push(stmt)
		return null
	}

	async addView(stmt) {

		this.viewStmts.push(stmt)

		let viewSourceFullPath = null
		let viewTargetFullPath = null
		if (stmt.viewSource) {
			viewSourceFullPath = stmt.viewSource.path.root + stmt.viewSource.path.path.join('')
			this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(viewSourceFullPath)
		}

		if (stmt.viewTarget) {
			viewTargetFullPath = stmt.viewTarget.path.root + stmt.viewTarget.path.path.join('')
			this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(viewTargetFullPath)
		}

		//TODO: calculate fov and cameraTo from viewType
		const cameraFOV = 50.0

		let isLastLine = this.lines.length == this.lineCursor - 1
		let isTransitionOnStack = ScriptParser.transitionStack.length > 0

		let transition = isTransitionOnStack ?
			ScriptParser.transitionStack.pop()
			: {
				transitionType: "CUT",
				duration: 0,
				fromViewId: this.currView ? this.currView.id : -1,
			}
		transition.toViewId = isLastLine ? -1 : ScriptParser.NextViewId
		if (this.currView !== undefined) {
			this.viewStack.push(this.currView)
		}
		//create new current view
		this.currView = { id: ScriptParser.NextViewId++, type: stmt.viewType, duration: stmt.duration, cameraMovementType: stmt.viewMovement ? stmt.viewMovement : null, cameraFOV, cameraFromId: viewSourceFullPath, cameraLookAtId: viewTargetFullPath, cameraLooping: false }
		this.views.push(this.currView)

		let outputStr = ''
		for(let marker of stmt.setMarkers){
			outputStr += `${this.addMarker(marker)}${os.EOL}`
		}

		for(let marker of stmt.removeMarkers){
			outputStr += `${this.removeMarker(marker)}${os.EOL}`
		}

		let lineCursor = this.lineCursor
		//stop parsing actions when EOF, tab decreases, or a new view starts
		let actions = await this.parseUntil((currStmt) => isTabDecreased(currStmt, stmt) || currStmt.rule == 'view' && stmt.depth == currStmt.depth)
		//stop parsing next view when EOF or tab decreases
		let next = await this.parseUntil((currStmt) => isTabDecreased(currStmt, stmt))

		// handle transitions here so they write to the actions of the view initating the transition
		let parsedTransition = await this.addTransition(transition)

		outputStr += `improv.playView(this.views[${this.views.length - 1}],
					() => { ${actions}
					//closing playView actions scope: ${this.lines[lineCursor - 1]}
					}, 
					${!isTransitionOnStack ? '// CUT' : ''}
					${parsedTransition},
					${next ? next : '() => improv.ViewStatus.DONE'}
					//closing playView next scope: ${this.lines[lineCursor - 1]}
					)`

		return outputStr
	}

	async addTransition(stmt, shouldQueue = false) {
		// if stmt is a transition, queue it up to be added upon the next view
		//save the script parser so that we can add the transitio to it since it will be the one initiating the transition
		let transition = {
			type: stmt.transitionType,
			duration: stmt.duration,
			fromViewId: this.currView.id,
			toViewId: stmt.toViewId ? stmt.toViewId : ScriptParser.NextViewId,
			path: stmt.path
		}

		this.transitions.push(transition)

		if (stmt.path) {
			let filename = stmt.path.path.length > 0 ? stmt.path.path[stmt.path.path.length - 1] : stmt.path.root
			let path = `${stmt.path.path.length == 0 ? stmt.path.root : stmt.path.root + '/' + stmt.path.path.join('/')}.imp`
			let fullPath = `${this.scriptPathDir}${path}`
			let parser = await generateBabylonScriptParser(fullPath, this.defaultSceneId, transition.fromViewId)
			transition.toViewId = parser.views[0].id
			return `improv.playTransition(this.transitions[${this.transitions.length - 1}])`
		}

		let isLastLine = this.lines.length == this.lineCursor
		if (shouldQueue) {
			ScriptParser.transitionStack.push(stmt)
			return ''
		} else {//if (isLastLine || path) {
			return `() => improv.playTransition(this.transitions[${this.transitions.length - 1}])`
		}
	}

	addAction(stmt) {
		this.actions.push({ id: ScriptParser.NextActionId, lines: stmt.lines, looping: false })
		ScriptParser.NextActionId += 1
		return `improv.playAction(this.actions[${this.actions.length - 1}],() => {})`
	}

	generateSceneObjectVariable(name) {
		let str = ''
		name = name.replace(" ", "_")
		name = name.replace("'", "")
		if (this._babylonSceneObjects.hasOwnProperty(name) === false) {
			this._babylonSceneObjects[name] = true
			str += `
			@visibleInInspector("string", "${name}", "assets/root/${name}.glb")
			${name}  :  string`
		}
		return str
	}
	static parsedScripts = {}

	async readScriptFileAndParse() {
		return await new Promise(res => {
			readFile(this.scriptPath, { encoding: 'utf8' }, (err, rawText) => {
				if (err) {
					console.error(`error reading script (${this.scriptPath}): ${err}`)
				}
				this.lines = rawText.split(os.EOL)
				console.log('generating scripts...')

				console.log('parsing lines...')
				let logicSrc = this.parseUntil(_ => this.lineCursor >= this.lines.length)
					.then(logicSrc => {
						let babylonSrc = nodeTemplateText.replace(`'@REPLACE WITH SCENE LOGIC@'`, logicSrc)
						babylonSrc = babylonSrc.replace(new RegExp('SceneClassName', 'g'), this.scriptName)
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH VARIABLE LIST@'`, this._babylonSceneObjectsSrc)
						//write scene loading list
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH SCENE LIST@'`, `${Object.values(this.scenesToLoad).map(s => `'${s.sceneName}_${s.scenePlacement}'`).join(',')}`)
						//write scene object list
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH LOAD MESH LIST@'`, `this.${Object.keys(this._babylonSceneObjects).join(', this.')}`)
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH SCRIPT REFERENCES@'`, Array.from(this.scripts.values()).map(e => `${e}`).join(','))
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH SCRIPT INSTANCES@'`, Array.from(this.scripts.values()).map(e => `@fromScene("${e}")
					private _${e}: ${e}`))
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH VIEW LIST@'`, JSON.stringify(this.views))
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH ACTION LIST@'`, this.actions.map(a => JSON.stringify(a)))
						babylonSrc = babylonSrc.replace(`'@REPLACE WITH TRANSITION LIST@'`, this.transitions.map(t => JSON.stringify({ type: t.type, duration: t.duration, fromViewId: t.fromViewId, toViewId: t.toViewId })))

						//write source output
						let scriptPath = `${ScriptParser.OutputPath}/${this.scriptName}.gen.ts`
						writeFile(scriptPath, babylonSrc)
							.then(_ => {
								//track parsed scripts to avoid doubling up on parsing scripts referenced by plays
								ScriptParser.parsedScripts[this.scriptName] = true
								//parse and write plays
								let playPromises = []
								for (let playScriptName of this.scripts) {
									if (!ScriptParser.AllScripts.has(playScriptName)) {
										ScriptParser.AllScripts.add(playScriptName)
										let playScriptPath = `${this.scriptPathDir}${playScriptName}/${playScriptName}.imp`
										playPromises.push(generateBabylonSource(playScriptPath, ScriptParser.OutputPath))
									}
								}
								Promise.all(playPromises)
									.then(_ => {
										res(babylonSrc)
									})
							})
					})


			})
		})
	}

	findPrevStmt() {
		let stmt = null
		for (var cursor = this.lineCursor - 1; cursor >= 0; cursor--) {
			var lineText = this.lines[cursor];

			if (isEmptyOrSpaces(lineText)) {
				continue
			}
			//HACK: nearly grammar not reporting depth accurately
			const lineDepth = (lineText.match(/\t/g) || []).length
			lineText = lineText.trim()
			stmt = parseLine(lineText)
			stmt.depth = lineDepth

			if (stmt == undefined) {
				throw `line parsed to undefined statement: ${lineText}`
			}

			if (!stmt || stmt.rule === 'comment') {
				stmt = null
				continue
			}

			return stmt
		}
		return null
	}

	async parseUntil(isScopeEnd = _ => false) {
		//the parsed code to return as a string
		let parsedScript = ''
		//post-processing loop for grammar rules that are context-sensitive/non-contracting (e.g. unit and activeObject Declarations)
		//for each line
		// advance lines until next unit at tab level
		// make unit recursively
		while (true) {
			const prevStmt = this.lineCursor == 0 ? null : this.findPrevStmt()
			let lineText = this.lines[this.lineCursor]
			this.lineCursor += 1

			//break on EOF
			if (this.lineCursor > this.lines.length) {
				break
			}

			if (lineText == '') {
				continue
			}

			let stmt
			try {
				if (isEmptyOrSpaces(lineText)) {
					continue
				}

				const lineDepth = (lineText.match(/\t/g) || []).length
				lineText = lineText.trim()
				stmt = parseLine(lineText)

				if (stmt == undefined) {
					throw `line parsed to undefined statement: ${lineText}`
				}

				if (!stmt || stmt.rule === 'comment') {
					continue
				}
				stmt.depth = lineDepth

				if (isTabDecreased(stmt, prevStmt)) {
					while (this.viewStack.length > 0 && this.viewStack[this.viewStack.length - 1].depth > stmt.depth) {
						this.currView = this.viewStack.pop()
					}
				}

				//if the scope ended break and return
				if (isScopeEnd(stmt)) {
					this.lineCursor -= 1
					break
				}

				parsedScript += `${os.EOL}//${lineText}${os.EOL}`

				lintStmt(this.scriptName, stmt, prevStmt, lineText, this.lines[this.lineCursor - 2], this.lineCursor)

				if (stmt.duration) {
					this.lastDefinedDuration = stmt.duration
				} else {
					stmt.duration = this.lastDefinedDuration
				}

			} catch (error) {
				console.error(`${this.scriptName} - ${error}`)
				process.exit(1)
			}

			parsedScript += (stmt.rule == 'transition') ? await this.addTransition(stmt, true)
				: (stmt.rule == 'view') ? await this.addView(stmt)
					: (stmt.rule == 'action') ? this.addAction(stmt)
						: (stmt.rule == 'cond') ? await this.addCond(stmt)
							: (stmt.rule == 'play') ? this.addPlay(stmt)
								: ''

			//scene headers do not generate code
			if (stmt.rule == 'sceneHeading') {
				this.addScene(stmt)
			}
		}
		return parsedScript
	}
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

	let addRule = r => ({ rule: r.rule, depth: r.depth, ...r.result })
	if (results.comment) return addRule(results.comment)
	if (results.play) return addRule(results.play)
	if (results.transition) return addRule(results.transition)
	if (results.sceneHeading) return addRule(results.sceneHeading)
	if (results.cond) return addRule(results.cond)
	if (results.view) return addRule(results.view)
	if (results.action) return addRule(results.action)
	return undefined
}

function lintStmt(filePath, stmt, prevStmt, line, lastLine, lineCursor) {
	let lines = `${os.EOL}${lineCursor - 1}:${lastLine}${os.EOL}>>${lineCursor}:${line}`

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
				case 'play':
				case 'action':
					if (stmt.depth > prevStmt.depth) {
						throw `[${filePath}] Error: transitions must either have the same depth as the statement before them or its parent scope.${lines}`
					}
					break
				case 'transition':
					let path = prevStmt.path ? prevStmt.path[2].root : undefined
					if (path) {
						break
					}
				default:
					throw `[${filePath}] Error: transition must follow an action, condition, play statement, or transition with a path.${lines}`
			}
			break
		case 'sceneHeading':
			if (prevStmt) {
				switch (prevStmt.rule) {
					case 'comment':
					case 'play':
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
					case 'play':
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
				case 'play':
				case 'action':
				case 'view':
				case 'transition':
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
				case 'play':
					break
				case 'action':
				case 'view':
				case 'transition':
					if (prevStmt.depth === stmt.depth) {
						throw `[${filePath}] Error: conditions must always be indented under the action or view that preceeds them${lines}`
					}
					break
				case 'cond':
					break
				default:
					throw `[${filePath}] Error: conditions must follow an action, view heading, transition, play statement, or a previous condition${lines}`
					break
			}
			break
	}

	if (isTabIncreased(stmt, prevStmt)) {
		if (stmt.depth - prevStmt.depth > 1) {
			//throw `[${filePath}] Error: statement depth greater than parent${lines}`
		}
		if (stmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (isTabDecreased(stmt, prevStmt)) {
		if (prevStmt.rule === 'action' || prevStmt.rule === 'cond' || prevStmt.rule === 'play' || prevStmt.rule == 'transition') {
			let depth = prevStmt.depth - stmt.depth
			if (stmt.rule === 'cond') {
				if (!isOdd(depth)) {
					throw `[${filePath}] Error: statement depth decreased and does not align with a parent action's conditions${lines}`
				}
			} else if (isOdd(depth) && prevStmt.rule !== 'cond') {
				throw `[${filePath}] Error: statement depth decreased and does not align with a parent unit's action${lines}`
			}
		} else {
			throw `[${filePath}] Error: statement depth decreased but previous statement was not an action, transition, or play statement${lines}`
		}
	}
}

function isOdd(n) { return n % 2 }

function findLast(items, predicate) {
	for (var i = items.length - 1; i >= 0; i--) {
		var item = items[i];

		if (predicate(item)) {
			return item;
		}
	}
}