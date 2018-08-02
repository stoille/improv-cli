/**
 * CORE
 * */
import { compose } from 'stampit'
import * as glob from 'glob'

//TODO: restructure units using this definition
export const Unit = compose({
	statics: {
		instances: {},
		ActiveUnit: null,
		history: []
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
		if (id && Unit.instances[id]) {
			return Unit.instances[id]
		}
		this.id = id
		this.script = require(scriptPath)
		Unit.instances[this.id] = this
		this.conditionals = conditionals.map(({exps, unit}) => Conditional({exps, env: this, unit}))
		this.holdCondition = Exp({op: holdCondition.op, args: holdCondition.args, env: this})
		this.nextUnit = Unit(nextUnit)
		this.inTransition = Transition(inTransition)
		this.outTransition = Transition(outTransition)
		this.state = State.PRELOAD
	},
	methods: {
		updateControl() {
			if (this.state === State.DONE ||
				this.state === State.PAUSE ||
				this.state === State.PRELOAD) {
				return
			}
			let activeConditional = this.conditionals.find(conditional => conditional.eval())
			if (activeConditional) {
				this.giveControlTo(activeConditional.unit)
				return
			}
			if (this.state === State.RUN && this.holdCondition.eval()) {
				this.giveControlTo(this.nextUnit)
				return
			}
		},
		giveControlTo(unit) {
			this.state = State.OUT_TRANSITION
			await unit.start()
			this.state = State.DONE
			Unit.ActiveUnit = unit
		},
		start() {
			this.state = State.IN_TRANSITION
			await unit.transition.run()
			this.state = STATE.RUN
		},
		async load() {
			this.state = State.LOAD_ASSETS
			await this.loadAssets()
			this.state = State.READY
		},
		async loadAssts(){
			//to be overridden
		}
	}
})

export const Transition = compose({
	props:{
		time: Number.MAX_SAFE_INTEGER
	},
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
		transitionType,
		transitionTime
	}) {
		this.transitionType = transitionType
		this.transitionTime = TimeSpan(transitionTime)
	}
})

export const State = compose({
	statics: {
		PRELOAD: 'PRELOAD',
		LOAD_ASSETS: 'LOAD_ASSETS',
		READY: 'READY',
		IN_TRANSITION: 'IN_TRANSITION',
		RUN: 'RUN',
		BACKGROUND: 'BACKGROUND',
		PAUSE: 'PAUSE',
		OUT_TRANSITION: 'OUT_TRANSITION',
		DONE: 'DONE'
	},
	init({
		state,
		value
	}) {
		this.state = state
		this.value = value
	}
})

//TODO: define ShotsDir and ShotNum
export const Conditional = compose({
	init({
		exp,
		env,
		unit
	}) {
		this.eval = exp.map(exp => Exp({op:exp.op, args: exp.args, env}))
		let scriptPath = `${ShotsDir}/${ShotNum} - ${exp.text}`
		this.unit = Unit({unit, scriptPath})
	},
	methods: {
		eval() {
			return this.exps.find(p => !p.eval()) ? false : true
		}
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
	statics: {
		GetOp(op) {
			return Exp.exps[op]
		},
		AddOp(exp) {
			Exp.exps[exp.op] = exp
		}
	},
	init({
		op,
		args,
		env
	}) {
		this.op = op
		this.args = args
		this.env = env
		this.eval = Exp.GetOp(op)(args, env)
	},
	//TODO: add more exps via AddOp
	//TODO: override eval(), GetArgs() methods with specific behavior
	methods: {
		eval() {
			return true
		},
		getArgs(rhsText, idx) {
			return rhsText.slice(idx)
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
		transition,
		sceneHeading,
		shotHeading,
		actionLines
	}) {
		this.transition = Transition(transition)
		this.sceneHeading = SceneHeading(sceneHeading)
		this.shotHeading = ShotHeading(shotHeading)
		this.conditionals = conditionals.map(conditional => Conditional(conditional))
		this.actionLines = actionLines.map(actionLine => ActionLine(actionLine))
		//TODO: define SceneDir
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
		modelLoader: (asset) => {},
		animLoader: (asset) => {}
	},
	methods: {
		async loadAssets() {
			this.models = await load(this.models, Shot.modelLoader)
			this.anims = await load(this.anims, Shot.animLoader)

			function load(assets, loader) { 
				return Object.keys(this.models).map(handle => {
					let assetPath = assets[handle]
					return loader(assetPath)
				})
			}
		},
		update() {
			if (this.state === State.PAUSE ||
					this.state === State.DONE) {
				return
			}
			Shot.deltaTime = Time.deltaTime

			if (this.isFirstUpdate) {
				this.isFirstUpdate = false
				this.setupCamera()
				this.startAnimations()

				//run user script first update
				this.script.onFirstUpdate()
				return
			}

			if (this.state === ShotState.IN_TRANSITION) {
				this.inTransition.update()
				return
			} else if (this.state === ShotState.OUT_TRANSITION) {
				this.outTransition.update()
				return
			}

			this.updateControl()
			if (this.state === State.BACKGROUND) {
				return
			}

			this.updateActionLines()
			if (this.state === State.DONE) {
				return
			}

			this.updateSelectors()

			//run user script updates
			this.script.onUpdate()
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
					this.state = State.DONE
					return
				}
				this.activeActionLine.stop()
				this.activeAction = this.actionLines[this.actionLineIndex]
				this.activeActionLine.start()
			}
			this.activeActionLine.update()
		},
		updateSelectors(){
			//TODO
		}
	}
})

export const SceneHeading = compose({
	init({
		setting,
		sceneName,
		sceneLocation,
		sceneLength
	}) {
		this.setting = setting
		this.sceneName = sceneName
		this.sceneLocation = sceneLocation
		this.sceneTime = TimeSpan(sceneLength)
	}
})

//shotheading
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
		this.timeSpan = timeSpan
	}
})

//time
export const Time = compose({
	init({
		ms
	}) {
		this.time = ms
	}
})

export const Text = compose({
	init({
		text
	}) {
		this.text = text
	}
})

//length
export const TimeSpan = compose({
	init({
		start,
		end
	}) {
		this.from = Time(from)
		this.to = Time(to)
	}
})
//actionLines
export const ActionLine = compose({
	init({
		text,
		length
	}) {
		this.text = text.map( txt => Text(txt))
		this.length = TimeSpan(length)
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