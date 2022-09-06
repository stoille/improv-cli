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


var nodeTemplateText = ''
async function generateBabylonSource(rootImprovScriptPath, outputDir) {
	if(!ScriptParser.OutputPath){
		ScriptParser.OutputPath = `${outputDir}/improv-scenes`
	}
	return new Promise(res => {
		fs.mkdir(ScriptParser.OutputPath, { recursive: true }, (err) => {
			generateBabylonScriptParser(rootImprovScriptPath)
				.then(generated => {
					const rootIndexPath = `${ScriptParser.OutputPath}/index.ts`
					const rootImports = `${Array.from(ScriptParser.AllGotos.values()).map(path => `
						import ${path} from './${path}/${path}'
						export * from ${path}`)
						.join(os.EOL)}`
					writeFile(rootIndexPath, rootImports, () => {
						res(generated)
					})
				})
		})
	})
}
module.exports.generateBabylonSource = generateBabylonSource


async function generateBabylonScriptParser(rootImprovScriptPath, defaultSceneId = undefined, defaultViewId = undefined) {
	var appRoot = process.env.PWD;
	nodeTemplateText = await readFile(`${appRoot}/../improv-plugin/src/templates/babylon-node-template.ts`, { encoding: 'utf8' })
	let extension = rootImprovScriptPath.split('.').pop()
	if (extension !== "imp") {
		console.error("File extension not supported. Improv script required.")
	}
	console.log(`parsing improv script...`)
	let parser = new ScriptParser(rootImprovScriptPath, defaultSceneId, defaultViewId)
	await parser.readScriptFileAndParse()

	console.log('improv script parsed...')
	return null//scriptsManifest.map(parser => parser._graph)
}

class ScriptParser {
	scriptName = undefined
	scriptPath = undefined
	scriptPathDir = undefined
	defaultSceneId = undefined
	scenesToLoad = []
	lastViewId = undefined
	lastDefinedDuration = 0
	lines = ''
	lineCursor = 0
	viewStmts = []
	gotos = new Set()
	// code generation support
	_parserOutput = ''
	_babylonSceneObjectsSrc = '/** IMPROV AUTO GENERATED **/'
	_babylonSceneObjects = {}

	// all gotos
	static AllGotos = new Set()
	static OutputPath = undefined

	constructor(scriptPath, defaultSceneId = undefined, defaultViewId = undefined) {
		this.scriptPath = scriptPath
		this.scriptPathDir = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1)
		this.scriptName = scriptPath.slice(scriptPath.lastIndexOf('/') + 1, scriptPath.lastIndexOf('.'))
		this.defaultSceneId = defaultSceneId
		this.lastViewId = defaultViewId
	}
	addMarker(stmt) {
		return `this.addMarker(${stmt.marker})`
	}
	removeUnmarker(stmt) {
		return `this.removeMarker(${stmt.marker})`
	}
	addGoto(stmt) {
		this.gotos.add(stmt.path)
		return `${stmt.path}.runSceneLogic()${os.EOL}`
	}
	addCond(stmt) {
		let lineCursor = this.lineCursor
		return `if(${this.getConds(stmt)}){
			${this.parseUntil(currStmt => currStmt.depth <= stmt.depth)}
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
		let type = CondTypes[condExp.op.trim()]
		let fullPath = condExp.rhs.root ? condExp.rhs.root.trim() + condExp.rhs.path.map(p => p.trim()) : undefined

		//if logic node, call recurisively to get lhs/rhs links
		if (type == CondTypes.AND || type == CondTypes.OR) {
			return `(${this.getConds(condExp.lhs)} ${type === CondTypes.AND ? '&&' : '||'}${condExp.rhs.root ? null : this.getConds(condExp.rhs)})`
		}
		//BABYLON
		this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(fullPath)
		return `pickMeshName === '${fullPath}'`
	}

	addScene(stmt) {
		const sceneId = `${stmt.sceneName}_${stmt.scenePlacement}`
		if (this.defaultSceneId == null) {
			this.defaultSceneId = sceneId
		}
		this.scenesToLoad.push(stmt)
		return null
	}

	addView(stmt, currViewStmt) {

		this.viewStmts.push(stmt)

		let viewSourceFullPath = null
		let viewTargetFullPath = null
		if (stmt.viewSource) {
			viewSourceFullPath = (stmt.viewSource.root.trim() + stmt.viewSource.path.map(p => p.trim())).replace(' ', '_')
			this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(viewSourceFullPath)
		}

		if (stmt.viewTarget) {
			viewTargetFullPath = (stmt.viewTarget.root.trim() + stmt.viewTarget.path.map(p => p.trim())).replace(' ', '_')
			this._babylonSceneObjectsSrc += this.generateSceneObjectVariable(viewTargetFullPath)
		}
		/*
		viewType: number,
		viewDuration: number,
		cameraMovementType: string,
		cameraFOV: number,
		cameraFromMeshName: string,
		cameraLookAtName: string,
		cameraLoopMode: number,
		onDone: any,
		*/
		//TODO: calculate fov and cameraTo from viewType
		const cameraFOV = 50.0
		let lineCursor = this.lineCursor
		let actions = this.parseUntil((currStmt) => isTabDecreased(currStmt, stmt) || currStmt.rule == 'view' && stmt.depth == currStmt.depth)
		let next = this.parseUntil((currStmt) => isTabDecreased(currStmt, stmt))
		//stop parsing actions when EOF, tab decreases, or a new view starts
		//stop parsing next view when EOF or tab decreases
		return `this.playView("${stmt.viewType}",${stmt.duration},"${stmt.viewMovement}",${cameraFOV},"${viewSourceFullPath}","${viewTargetFullPath}",
			() => { ${actions}
			//closing playView actions scope: ${this.lines[lineCursor - 1]}
			}, 
			${next ? next : '() => ViewStatus.DONE'}
			//closing playView next scope: ${this.lines[lineCursor - 1]}
			)`
	}
	addTransition(stmt, currViewStmt, prevViewStmt) {
		// BABYLON CODE
		return `this.playTransition(${stmt.transitionType},${stmt.transitionTime},${prevViewStmt.results},${currViewStmt.result})`
	}
	addAction(stmt, prevStmt, currViewStmt) {
		return `this.playAction("group_${stmt.lines[0].text.slice(0, 10).replace(' ', '_')}",${false},() => {})`
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

				let babylonSrc = nodeTemplateText.replace(`'@REPLACE WITH SCENE LOGIC@'`, logicSrc)
				babylonSrc = babylonSrc.replace(new RegExp('SceneClassName', 'g'), this.defaultSceneId)
				babylonSrc = babylonSrc.replace(`'@REPLACE WITH VARIABLE LIST@'`, this._babylonSceneObjectsSrc)
				//write scene loading list
				babylonSrc = babylonSrc.replace(`'@REPLACE WITH SCENE LIST@'`, `'${Object.values(this.scenesToLoad).map(s => `${s.sceneName}_${s.scenePlacement}'`).join(',')}`)
				//write scene object list
				babylonSrc = babylonSrc.replace(`'@REPLACE WITH LOAD MESH LIST@'`, `this.${Object.keys(this._babylonSceneObjects).join(', this.')}`)
				babylonSrc = babylonSrc.replace(`'@REPLACE WITH GOTO REFERENCES'`, [...Array.from(this.gotos.values()).join(',')])
				//cache parsed script
				//write source output

				let scriptPath = `${ScriptParser.OutputPath}/${this.scriptName}.gen.ts`
				writeFile(scriptPath, babylonSrc)
					.then(_ => {
						//track parsed scripts to avoid doubling up on parsing scripts referenced by gotos
						ScriptParser.parsedScripts[this.scriptName] = true
						//parse and write gotos
						let gotoPromises = []
						for (let gotoScriptName of this.gotos) {
							if (!ScriptParser.AllGotos.has(gotoScriptName)) {
								ScriptParser.AllGotos.add(gotoScriptName)
								let gotoScriptPath = `${this.scriptPathDir}${gotoScriptName}/${gotoScriptName}.imp`
								gotoPromises.push(generateBabylonSource(gotoScriptPath, ScriptParser.OutputPath))
							}
						}
						Promise.all(gotoPromises)
							.then(_ => {
								res(babylonSrc)
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

	parseUntil(isScopeEnd = _ => false) {
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
				stmt.depth = lineDepth

				if (stmt == undefined) {
					throw `line parsed to undefined statement: ${lineText}`
				}

				if (!stmt || stmt.rule === 'comment') {
					continue
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
				console.error(`${scriptName} - ${error.message}`)
				process.exit(1)
			}

			let currViewStmt = this.viewStmts.length > 0 ? this.viewStmts[this.viewStmts.length - 1] : null
			let prevViewStmt = this.viewStmts.length > 1 ? this.viewStmts[this.viewStmts.length - 2] : null

			parsedScript += (stmt.rule == 'view') ? this.addView(stmt, currViewStmt)
				: (stmt.rule == 'action') ? this.addAction(stmt, prevStmt, currViewStmt)
					: (stmt.rule == 'cond') ? this.addCond(stmt)
						: (stmt.rule == 'transition') ? this.addTransition(stmt, currViewStmt, prevViewStmt)
							: (stmt.rule == 'goto') ? this.addGoto(stmt)
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
			//throw `[${filePath}] Error: statement depth greater than parent${lines}`
		}
		if (stmt.rule !== 'cond' && prevStmt.rule !== 'cond') {
			throw `[${filePath}] Error: statement depth increase may only come before or after a condition${lines}`
		}
	}
	if (isTabDecreased(stmt, prevStmt)) {
		if (prevStmt.rule === 'action' || prevStmt.rule === 'cond' || prevStmt.rule === 'goto') {
			let depth = prevStmt.depth - stmt.depth
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

function isOdd(n) { return n % 2 }

function findLast(items, predicate) {
	for (var i = items.length - 1; i >= 0; i--) {
		var item = items[i];

		if (predicate(item)) {
			return item;
		}
	}
}