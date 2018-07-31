/**
 * CORE
 * */
import { compose } from 'stampit'
//TODO: restructure units using this definition
export const Unit = compose({
	statics: {
		instances: {},
		ActiveUnit: null,
		history: []
	},
	init({
		id,
		conditionals,
		holdCondition,
		nextUnit
	}) {
		if (id && Unit.instances[id]) {
			return Unit.instances[id]
		}
		this.id = id
		Unit.instances[this.id] = this
		this.conditionals = conditionals.map(cond => Conditional(cond))
		this.holdCondition = Exp({op: holdCondition.op, args: holdCondition.args, env: this})
		this.nextUnit = Unit(nextUnit)
	},
	props: {
		state: State.PRELOAD,
		conditionals: [],
		holdCondition: null,
		transition: Transition()
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
				this.transitionTo(activeConditional.unit)
				return
			}
			if (this.state === State.RUN && this.holdCondition.eval()) {
				this.transitionTo(this.nextUnit)
				return
			}
		},
		updateTransition() {
			if(this.transition.isDone){
				return
			}
			this.transition.update()
			if (this.transition.isDone) {
				this.transition.unload()
			}
		},
		async transitionTo(unit) {
			this.state = State.TRANSITION
			await unit.startTransition()
			this.state = State.DONE
			Unit.ActiveUnit = unit
		},
		async load() {
			this.state = State.LOAD_ASSETS
			await this.loadAssets()
		},
		async startTransition(){
			this.state = State.TRANSITION
			await unit.transition.start()
			this.state = STATE.RUN
		}
	}
})

export const Transition = compose({
	props:{
		time: Number.MAX_SAFE_INTEGER
	},
	methods: {
		update() {
			this.time -= Time.deltaTime
			//TODO: tick screen transitions here
		},
		*start(){
			this.time = this.transitionTime
			while(!this.isDone()){
				yield false
			}
			return true
		},
		isDone(){
			return this.time <= 0
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
		TRANSITION: 'TRANSITION',
		RUN: 'RUN',
		BACKGROUND: 'BACKGROUND',
		PAUSE: 'PAUSE',
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

export const Conditional = compose({
	init({
		exps,
		unit
	}) {
		this.exps = exps.map(exp => Exp(this))
		this.unit = Unit(unit)
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
 	let exp = Exps.GetExp(op)
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
		GetExp(op) {
			return Exp.exps[op]
		},
		AddExp(exp) {
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
	},
	//TODO: add more exps via AddExp
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
		time: Time({
			ms: 0
		}),
		actionLineIndex: 0,
		objects: {},
		assets: [],
		anims: []
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
	},
	statics: {
		deltaTime: 0,
		//TODO: implement these loaders
		modelLoader: (asset) => {},
		animLoader: (asset) => {}
	},
	methods: {
		updateActionLines(deltaTime) {
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
			this.activeActionLine.update(deltaTime)
		},
		loadAssetsAndAnims() {
			let load = (assets, loader) => Object.keys(this.assets).map(handle => {
				let assetPath = assets[handle]
				return loader(assetPath)
			})
			load(this.assets, Shot.modelLoader)
			load(this.anims, Shot.animLoader)
		},
		setupCamera() {
			//TODO
		},
		startAnimations() {
			//TODO
		},
		update(deltaTime) {
			if (this.state === State.PAUSE ||
					this.state === State.DONE) {
				return
			}
			Shot.deltaTime = deltaTime

			if (this.isFirstUpdate) {
				this.isFirstUpdate = false
				this.setupCamera()
				this.startAnimations()
				this.onFirstUpdate()
			}

			if (this.state === ShotState.TRANSITION) {
				this.updateTransition()
				return
			}

			this.updateControl(deltaTime)
			if (this.state === State.BACKGROUND) {
				return
			}

			this.updateActionLines(deltaTime)
			if (this.state === State.DONE) {
				return
			}
			this.onUpdate()
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
		update(deltaTime){
			//TODO
		},
		isDone(){
			//TODO
		}
	}
})