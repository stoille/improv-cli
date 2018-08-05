/**
 * CORE
 * */
import { compose } from 'stampit'
import * as glob from 'glob'

//TODO: define these
var SceneDir = './scenes'
var ShotsDir = './shots'

//TODO: restructure units using this definition
export const Unit = compose({
	init({
		type,
		inTransition,
		controllers,
		scriptPath,
		next,
		outTransition,
		next
	}) {
		let unit = (type && Unit.TypesRegister[type]) ?
				Object.create(Unit.TypesRegister[type]) :
				this
		Unit.TypesRegister[type] = unit
		unit.type = type
		unit.inTransition = Transition(inTransition)
		unit.controllers = controllers.map(({exp, unit, index}) => ConditionalUnit({exp, env: this, unit, index}))
		unit.script = require(scriptPath)
		unit.outTransition = Transition(outTransition)
		unit.next = next ? unit.next = next : this
		
		return unit
	},
	statics: {
		Types: {},
		ActiveUnit: null,
		History: [],
		State: {
			PRELOAD: 'PRELOAD',
			LOAD_ASSETS: 'LOAD_ASSETS',
			READY: 'READY',
			IN_TRANSITION: 'IN_TRANSITION',
			RUN: 'RUN',
			BACKGROUND: 'BACKGROUND',
			PAUSE: 'PAUSE',
			OUT_TRANSITION: 'OUT_TRANSITION',
			DONE: 'DONE'
		}
	},
	props:{
		state: Unit.State.PRELOAD,
		stateUpdaters: {
			'PAUSE': [() => {}],
			'DONE': [() => {}],
			'START': [() => {
				this.isFirstUpdate = false
			}],
			'IN_TRANSITION': [this.inTransition.update()],
			'OUT_TRANSITION': [this.outTransition.update()],
			'BACKGROUND': [this.updateControllers()],
			'RUN': [() => {
				this.updateControllers()
				this.updateSequences()
				if (this.state === Unit.State.DONE) {
					return
				}
				if(this.isFirstUpdate){
					this.script.onFirstUpdate()
				} else {
					this.script.onUpdate()
				}
			}]
		}
	},
	methods: {
		update() {
			this.stateUpdaters[this.state].forEach(update => update())
		},
		registerStateUpdater(state, updaterFunc){
			this.stateUpdaters[state].push(updaterFunc)
		},
		updateControllers() {
			if (this.state === Unit.State.DONE ||
				this.state === Unit.State.PAUSE ||
				this.state === Unit.State.PRELOAD) {
				return
			}
			let activeConditionalUnit = this.controllers.find(controller => controller.eval())
			if (activeConditionalUnit) {
				this.giveControlTo(activeConditionalUnit.unit)
				return
			}
			if (this.state === Unit.State.RUN && this.next.eval()) {
				this.giveControlTo(this.next)
				return
			}
		},
		async giveControlTo(unit) {
			this.stop()
			Unit.ActiveUnit = unit
			await unit.start()
		},
		async start() {
			this.state = Unit.State.IN_TRANSITION
			await unit.inTransition.run()
			this.state = Unit.State.RUN
		},
		async stop(){
			this.state = Unit.State.OUT_TRANSITION
			await unit.outTransition.run()
		
			this.state = Unit.State.DONE
			if(this.isReadyToUnload()){
				await this.unload()
			}
		},
		async load() {
			this.state = Unit.State.LOAD_ASSETS
			await this.loadAssets()
			this.state = Unit.State.READY
		},
		async loadAssts(){
			//to be overridden
		},
		isReadyToUnload(){
			//to be overriden
		},
		unload(){
			//to be overriden
		}
	}
})

export const Transition = compose({
	methods: {
		run() {
			this.time = this.transitionTime
			this.runPromise = new Promise()
			return this.runPromise
		},
		update() {
			if(this.isDone()){
				return
			}
			this.time -= Time.deltaTime
			
			//TODO: tick screen transitions here
			this.onUpdate()

			if (this.isDone()) {
				this.runPromise.resolve(this.unload)
			}
		},
		isDone(){
			return this.time <= 0
		},
		unload(){
			//TODO
		}
	},
	init({
		transitionTime
	}) {
		this.transitionTime = TimeSpan(transitionTime)
	}
})

//TODO: define ShotNum
export const ConditionalUnit = compose({
	init({
		exp,
		env,
		unit
	}) {
		this.exp = Exp({exp, env})
		this.eval = this.exp.eval()
		this.unit = Unit({...unit, scriptPath})
	}
})
/**
 * controller parsing logic:
 * this.exps = json.controllers.reduce((exps, op, idx, conds) => {
 	let exp = Exps.GetOp(op)
 	if (exp) {
 		let args = conds.GetArgs(exps, idx)
 		let expInst = exp.create({
 			op: op,
 			args: args,
 			env: Object.create(parent)
 		})
 		return [...exps, expInst]
 	}
 	return exps
 }, [])
 */

export const Exp = compose({
	init({
		exp,
		env
	}) {
		this.ops = exp.map( op => Op({...op, env}))
		this.eval = this.ops.find(op => !op.eval()) ? false : true
	}
})

const Op = compose({
	statics:{
		Types: []
	},
	init({
		type,
		args,
		env
	}) {
		//if 
		let op = Op.TypesRegister[type]
			? Object.create(Op.TypesRegister[type])
			: this
		Op.TypesRegister[type] = op
		op.type = type
		op.args = args
		op.env = env
		return op
	},
	methods: {
		eval() {
			//to be overriden
		}
	}
})

/**
 * MODELS
 * */

//shot as a unit
export const Shot = compose(Unit, {
	props: {
		isFirstUpdate: true,
		time: TimeSpan({start: Time(), end: Time()}),
		actionLineIndex: 0
	},

	//init takes in a json definition
	init({
		sceneHeading,
		shotHeading,
		actionLines
	}) {
		this.registerStateUpdater(Unit.State.START, () => {
			this.setupCamera()
			this.startAnimations()
		})
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.controllers = controllers.map(((controller, index) => ConditionalUnit(controller)))
		this.actionLines = actionLines.map(actionLine => ActionLine(actionLine))
		let modelsPath = `${SceneDir}/models`
		this.models = listFilesWithExt(modelsPath, '.fbx')
		let animsPath = `${SceneDir}/anims`
		this.anims = listFilesWithExt(animsPath, '.fbx')

		function listFilesWithExt(path, ext) {
			return glob.sync(`${path}/*.${ext}`)
		}
	},
	statics: {
		//TODO: implement these loaders
		ModelLoader: async (asset) => {},
		AnimLoader: async (asset) => {}
	},
	methods: {
		async loadAssets() {
			this.models = await load(this.models, Shot.ModelLoader)
			this.anims = await load(this.anims, Shot.AnimLoader)

			async function load(assets, loader) { 
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
			}
		},
		updateSequences(){
			this.updateActionLines()
		},
		setupCamera() {
				//TODO
		},
		startAnimations() {
			//TODO
		},
		updateActionLines() {
			if (this.activeActionLine.isDone()) {
				this.actionLineIndex += 1
				if (this.actionLineIndex > this.actionLines.length) {
					this.state = Unit.State.DONE
					return
				}
				this.activeActionLine.stop()
				this.activeAction = this.actionLines[this.actionLineIndex]
				this.activeActionLine.start()
			}
			this.activeActionLine.update()
		}
	}
})

export const SceneHeading = compose({
	init({
		timeOfDay,
		sceneName,
		sceneLocation
	}) {
		this.timeOfDay = timeOfDay
		this.sceneName = sceneName
		this.sceneLocation = sceneLocation
	}
})

export const ShotHeading = compose({
	init({
		cameraType,
		cameraSource,
		cameraTarget,
		timeSpan
	}) {
		this.cameraType = cameraType
		this.cameraSource = cameraSource
		this.cameraTarget = cameraTarget
		this.timeSpan = TimeSpan(timeSpan)
	}
})

//TODO: replace with more robust time library
export const Time = compose({
	props:{
		min: 0,
		sec: 0,
		ms: 0
	},
	init({
		min,
		sec,
		ms
	}) {
		this.min = min
		this.sec = sec
		if(!ms){
			this.ms = ((min*60) + sec) * 1000
		}
	}
})
//TODO: replace with more robust time library
export const TimeSpan = compose({
	props:{
		start: Time(),
		end: Time()
	},
	init({
		start,
		end
	}) {
		this.start = Time(start)
		this.end = Time(end)
		this.ms = this.end.ms - this.start.ms
	}
})

export const ActionLine = compose({
	init({
		text,
		time
	}) {
		this.text = text.map( txt => Text(txt))
		this.time = TimeSpan(time)
	},
	methods: {
		stop(){
			//TODO
		},
		start(){
			//TODO
		},
		update(){
			//TODO
		},
		isDone(){
			//TODO
		}
	}
})

export const Text = compose({
	init({
		text
	}) {
		this.text = text
	}
})

/**
 * User Defined Operations
 */

export const Select = compose(Op, {
	props: {
		type: 'Select'
	},
	init({
		handle,
		unit
	}) {
		this.handle = handle
		this.unit = unit
		setupUnit(unit)

		function setupUnit(unit) {
			if (doesUnitHaveSelectables(unit) === false) {
				initializeSelectables(unit, this.type)
			}

			//TODO next

			function doesUnitHaveSelectables(unit) {
				return unit.selectables ? true : false
			}

			function initializeSelectables(unit, opType) {
				unit.selectables = unit.controllers
					.filter(cond => cond.exp.op === opType)
					.map(cond => cond.exp.args.map(arg => Selectable({
						handle
					})))
					.reduce((flatten, array) => [...flatten, ...array], [])
					.reduce((sels, sel) => {
						sels[sel.handle] = sel
						return sels
					}, {})
				unit.registerStateUpdater(Unit.State.RUN, this.selectable.update())
			}
		}
	},
	methods: {
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
			return true
		},
		update() {
			//TODO: NEXT: FIX UPDATER LOGIC AND REVALUATE WHETHER IT IS OVERDESIGNED (THINK SO)
		}
	}
})

let shot = Unit({
	type: 'Shot',
	scriptPath: './kentucky',
	sceneHeading: {
		type: 'SceneHeading',
		timeOfDay: 'NOON',
		sceneName: 'OLD BAPTIST CHURCH',
		sceneLocation: 'KENTUCKY'
	},
	shotHeading: {
		type: 'ShotHeading',
		cameraType: 'Camera.Type.EWS',
		cameraSource: null,
		cameraTarget: 'OLD BAPTIST CHURCH FRONT',
		movement: {type: 'Camera.Movement.Type', start: 0, end: 2},
		timeSpan: TimeSpan({
			start: Time({
				min: 0,
				sec: 00
			}),
			end: Time({
				min: 0,
				sec: 15
			})
		})
	}),
	inTransition: Transition({
		type: 'FadeIn',
		transitionTime: TimeSpan({
			min: 0,
			sec: 3
		})
	}),
	actionLines: [
		ActionLine({
			time: TimeSpan({ 
				min: 0,
				sec: 3
			}),
			text: 'Over the dense hiss and buzz of a humid summer afternoon we see an old man pace along the porch of an old baptist church.'
		}), 
		ActionLine({
			time: TimeSpan({
				min: 0,
				sec: 1
			}),
			text: 'He clears his throat and coughs.'
		}),
	],
	next: ConditionalUnit({
		exp: {
			ops: [{
				type: 'Pickup',
				args: [
					Selectable({
						handle: 'KEY',
						pos: new Position(0, 0, 0)
					})
				],
				env: this
			}]
		},
		env: this,
		next: Unit({
			type: 0,
			scriptPath: './kentucky',
			sceneHeading: SceneHeading({
				timeOfDay: 'NOON',
				sceneName: 'OLD BAPTIST CHURCH',
				sceneLocation: 'KENTUCKY'
			}),
			shotHeading: ShotHeading({
				cameraType: Camera.Type.EWS,
				cameraSource: null,
				cameraTarget: 'OLD BAPTIST CHURCH FRONT',
				timeSpan: TimeSpan({
					start: Time({
						min: 0,
						sec: 00
					}),
					end: Time({
						min: 0,
						sec: 15
					})
				})
			}),
			inTransition: Transition({
				type: "Cut"
			}),
			controllers: [],
			actionLines: [ActionLine({
					time: TimeSpan({
						min: 0,
						sec: 3
					}),
					text: 'Foo.'
				}),
				ActionLine({
					time: TimeSpan({
						min: 0,
						sec: 1
					}),
					text: 'Bar.'
				}),
			],
			next: ConditionalUnit({
				exp: Exp({
					op: Op({
						type: 'Pickup',
						args: [
							Selectable({
								handle: 'KEY',
								pos: new Position(0, 0, 0)
							})
						],
						env: this
					})
				}),
				env: this,
				unit: Unit({
					type: 'Shot',
					cameraType,
					cameraSource,
					cameraTarget,
					timeSpan
				}),
				index: 4
			}),
			outTransition: Transition({
				type: "Cut"
			})
		}),
		index: 4
	}),
	outTransition: Transition({
			type: "Cut"
		}),
	controllers: ConditionalUnit({
		
	})
})