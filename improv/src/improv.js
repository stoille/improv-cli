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
	statics: {
		Instances: {},
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
	init({
		id,
		scriptPath,
		conditionals,
		holdCondition,
		nextUnit,
		inTransition,
		outTransition
	}) {
		if (id && Unit.Instances[id]) {
			return Unit.Instances[id]
		}
		this.id = id
		this.script = require(scriptPath)
		Unit.Instances[this.id] = this
		this.conditionals = conditionals.map(({exps, unit}) => Conditional({exps, env: this, unit}))
		this.holdCondition = Exp({op: holdCondition.op, args: holdCondition.args, env: this})
		this.nextUnit = Unit(nextUnit)
		this.inTransition = Transition(inTransition)
		this.outTransition = Transition(outTransition)
		this.state = Unit.State.PRELOAD
	},
	methods: {
		preUpdate() {
			//To be overriden
		},
		updateControl() {
			if (this.state === Unit.State.DONE ||
				this.state === Unit.State.PAUSE ||
				this.state === Unit.State.PRELOAD) {
				return
			}
			let activeConditional = this.conditionals.find(conditional => conditional.eval())
			if (activeConditional) {
				this.giveControlTo(activeConditional.unit)
				return
			}
			if (this.state === Unit.State.RUN && this.holdCondition.eval()) {
				this.giveControlTo(this.nextUnit)
				return
			}
		},
		giveControlTo(unit) {
			this.state = Unit.State.OUT_TRANSITION
			await unit.start()
			await this.stop()
			Unit.ActiveUnit = unit
		},
		start() {
			this.state = Unit.State.IN_TRANSITION
			await unit.transition.run()
			this.state = STATE.RUN
		},
		stop(){
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
export const Conditional = compose({
	init({
		exp,
		env,
		unit,
		index
	}) {
		this.exp = Exp({exp, env})
		this.eval = this.exp.eval()
		let scriptPath = `${ShotsDir}/${index} - ${exp.text}`
		this.unit = Unit({unit, scriptPath})
	}
})
/**
 * conditional parsing logic:
 * this.exps = json.conditionals.reduce((exps, op, idx, conds) => {
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
		this.ops = exp.map( op => Op({op, env}))
		this.eval = this.ops.find(op => !op.eval()) ? false : true
	}
})

const Op = compose({
	init({
		op,
		env
	}) {
		this.name = op.name
		this.args = op.args
		this.env = env
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
		time: Time({ ms: 0 }),
		actionLineIndex: 0
	},

	//init takes in a json definition
	init({
		sceneHeading,
		shotHeading,
		actionLines
	}) {
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.conditionals = conditionals.map(((conditional, index) => Conditional(conditional, index)))
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
		modelLoader: async (asset) => {},
		animLoader: async (asset) => {}
	},
	methods: {
		async loadAssets() {
			this.models = await load(this.models, Shot.modelLoader)
			this.anims = await load(this.anims, Shot.animLoader)

			async function load(assets, loader) { 
				return Promise.all(Object.keys(this.models).map(
					handle => loader(assets[handle])))
			}
		},
		update() {
			this.preUpdates.forEach(update => update())
			
			let stateHandler = {
				'PAUSE': () => {},
				'DONE': () => {},
				'START': () => {
					this.isFirstUpdate = false
					this.setupCamera()
					this.startAnimations()

					//run user script first update
					this.script.onFirstUpdate()
				},
				'IN_TRANSITION': this.inTransition.update(),
				'OUT_TRANSITION': this.outTransition.update(),
				'BACKGROUND': this.updateControl(),
				'RUN': () => {
					this.updateControl()
					this.updateActionLines()
					if(this.state === Unit.State.DONE) {
						return
					}
					this.script.onUpdate()
				}
			}
			Shot.deltaTime = Time.deltaTime
			stateHandler[this.state]()
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

export const Time = compose({
	init({
		min,
		sec
	}) {
		this.min = min
		this.sec = sec
		this.ms = ((min*60) + sec) * 1000
	}
})

export const TimeSpan = compose({
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
		name: 'Select'
	},
	init({
		handle,
		unit
	}) {
		if (doesUnitHaveSelectors(unit) === false) {
			initializeSelectors(unit, name)
		}

		//TODO next

		function doesUnitHaveSelectors(unit){
			return unit.selectors ? true : false
		}

		function initializeSelectors(unit, opName){
			unit.selectors = unit.conditionals
				.filter(cond => cond.exp.op === opName)
				.map(cond => cond.exp.args.map(arg => Selector({
					handle
				})))
				.reduce((flatten, array) => [...flatten, ...array], [])
				.reduce((sels, sel) => {
					sels[sel.handle] = sel
					return sels
				}, {})
			unit.preUpdates.push(this.updateSelectors)
		}
	},
	methods: {
		eval() {
			//TODO: return true if user selection intersects with the handle's anchor
		}
	}
})

export const Selector = compose({
	init({
		handle,
		pos
	}){
		this.handle = handle
		this.pos = pos
		//TODO: setup a way to reference the handle in the scene
	},
	methods: {
		update(){

		}
		//TODO: fill in with functions useful to a selectable
	}
})

let shot = Shot({
	id: 0,
	scriptPath: './kentucky',
	sceneHeading: SceneHeading({
		timeOfDay: 'NOON',
		sceneName: 'OLD BAPTIST CHURCH',
		sceneLocation: 'KENTUCKY'
	}),
	shotHeading: ShotHeading({
		cameraType,
		cameraSource,
		cameraTarget,
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
	inTransition: FadeIn({
		transitionTime: TimeSpan({
			min: 0,
			sec: 3
		})
	}),
	conditionals: Conditional({}),
	actionLines: [ActionLine({
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
	holdCondition: Conditional({
		exp: Exp({
			op: Await,
			args: Pickup({
				selector: Selector({
					handle: 'KEY',
					pos: new Position(0,0,0)
				})
			}),
			env: this
		}),
		env,
		unit,
		index
	}),
	outTransition: Cut(),
	nextUnit: Shot({
		cameraType,
		cameraSource,
		cameraTarget,
		timeSpan
	})
})