/**
 * CORE
 * */
import { compose } from 'stampit'
import * as uuid from 'uuid'

//TODO: restructure units using this definition
export const Unit = compose({
	statics: {
		instances: {}
	},
	init({
		id,
		holdCondition,
		nextUnit
	}) {
		if (id && Unit.instances[id]) {
			return Unit.instances[id]
		}
		this.nextUnit = nextUnit
		this.id = uuid.v4()
		Unit.instances[this.id]
		this.holdCondition = Predicate(holdCondition)
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
			if (this.state === State.HOLD && this.holdCondition.eval()) {
				this.transitionTo(this.holdCondition.unit)
				return
			}
		},
		updateTransition() {
			if (this.transition.isDone === false) {
				this.transition.update()
				if (this.transition.isDone) {
					this.transition.unload()
				}
			}
		},
		transitionTo(unit) {
			unit.transition()
			this.state = state
		},
		transition() {
			this.state = State.TRANSITION
			this.transition.start()
		},
		load() {
			this.state = State.LOAD
			this.loadAssets()
		},
		loadConditionals() {
			//to be overwritten
		},
		loadAssets() {
			//to be overwritten
		},
		run() {
			this.state = State.TRANSITION
		},
		holdCondition() {
			this.state = State.HOLD
		}
	}
})

export const Transition = compose({
	methods: {
		update() {
			//TODO: drive transitions here
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
		LOAD_CONDITIONALS: 'LOAD_CONDITIONALS',
		LOAD_ASSETS: 'LOAD_ASSETS',
		READY: 'READY',
		TRANSITION: 'TRANSITION',
		RUN: 'RUN',
		HOLD: 'HOLD',
		IDLE: 'IDLE',
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
		json,
		parent,
		child
	}) {
		this.child = child
		this.preds = json.conditionals.reduce((preds, verb, idx, conds) => {
			let pred = Predicates.GetPredicate(verb)
			if (pred) {
				let args = conds.GetArgs(preds, idx)
				let predInst = pred.create({
					verb: verb,
					args,
					scope: parent
				})
				return [...preds, predInst]
			}
			return preds
		}, [])
	},
	methods: {
		eval() {
			return this.preds.find(p => !p.eval()) ? false : true
		}
	}
})

export const Predicate = compose({
	statics: {
		GetPredicate(verb) {
			return Predicate._preds[verb]
		},
		AddPredicate(pred) {
			Predicate._preds[pred.verb] = pred
		}
	},
	init({
		verb,
		args,
		scope
	}) {
		this.verb = verb
		this.args = args
		this.scope = scope
	},
	//TODO: add more predicates via AddPredicate
	//TODO: override eval(), GetArgs() methods with specific behavior
	methods: {
		Eval() {
			return true
		},
		GetArgs(rhsText, idx) {
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
		objects: {}
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
		this.actionLines = actionLines.map(actionLine => Action(actionLine))
	},
	statics: {
		assetLoader: (asset) => {},
		animLoader: (asset) => {},
		actionLineLoader: (asset) => {}
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
		loadAssets() {
			let load = (assets, loader) => Object.keys(this.assets).map(handle => {
				let assetPath = assets[handle]
				return loader(assetPath)
			})
			load(this.assets, Shot.assetLoader)
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

			if (this.isFirstUpdate) {
				this.isFirstUpdate = false
				this.setupCamera()
				this.startAnimations()
				this.onFirstUpdate()
			}

			if (this.state === ShotState.TRANSITION && this.transition.isDone === false) {
				this.transition.update(deltaTime)
				if (this.transition.isDone) {
					this.transition.unload()
				}
			}

			this.updateControl(deltaTime)
			if (this.state === State.IDLE) {
				return
			}
			this.updateActions(deltaTime)
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
export const Action = compose({
	init({
		text,
		length
	}) {
		this.text = Text(text)
		this.length = TimeSpan(length)
	}
})
////////
function* mainLoop(unit) {
		let lastUnit = unit
		while (unit = unit.next()) {
			if (lastUnit !== unit) {
				if (DEBUG) {
					console.log(`changed to Unit: ${unit}`)
					yield unit.loadAssets()
					yield lastUnit.unloadAssets()
				}
			}
			let unitState = yield unit.visit()
			lastUnit = unit
		}

		/**
		 *

		 export const Predicate = compose({
		 	methods: {
		 		isTrue: () => {
		 			this.eval(predicate.subjects)
		 		},
		 		eval: (subjects) => {
		 			//TODO
		 		},
		 		run: () => {}
		 		//override and define predicates for TOUCH, AFTER, AWAIT, PICKUP
		 		//if its a unit
		 		//this.giveControlTo(cond.body)
		 		//if its an actionLine or dialogue
		 		//this.addAction(cond.body)
		 	}
		 })

		 export const Unit = compose({
		 	props: {
		 		runCondition,
		 		awaitCondition,
		 		actionLines
		 	},
		 	methods: {
		 		loadAssets: async (depth) => {
		 			if (depth > 1) {
		 				return null
		 			}
		 			let sceneObjects = await this.loadSceneObjects(sceneUnit, sceneSubjects)
		 			this.children = this.children.map(child = new Unit(child))
		 			for (let i = 0; i < unit.length; ++i) {
		 				let loadStatus = await this.children[i].loadAssets(depth + 1)
		 				console.log(loadStatus)
		 			}
		 			return ({
		 				status: loaded
		 			})
		 		},
		 		evalPredicates: () => {
		 			for (let predicate in this.predicates) {
		 				if (predicate.isTrue()) {
		 					predicate.run(this)
		 					break
		 				}
		 			}
		 		},
		 		giveControlTo: (unit) => {
		 			Unit.activeUnit = unit
		 			Unit.history.push(unit.nextLine)
		 		},
		 		condition() {
		 			//TODO: evaluate condition
		 			return true
		 		},
		 		onUnload: () => {
		 			this.unloadAssets()
		 			this.unloaAnimations()
		 			this.unloadActions()
		 		},
		 		async loadSceneObjects() {
		 			if (isSceneObjectsLoaded) {
		 				return sceneObjects
		 			}
		 			//load scene objects
		 			return sceneObjects
		 		},
		 		async loadUnits() {
		 			if (isSceneObjectsLoaded) {
		 				return sceneObjects
		 			}
		 			//load scene objects
		 			return sceneObjects
		 		},
		 		async unloadSceneObjects() {
		 			if (isSceneObjectsLoaded) {
		 				return sceneObjects
		 			}
		 			//unload scene objects
		 			return sceneObjects
		 		},
		 		async unloadUnits() {
		 			if (isSceneObjectsLoaded) {
		 				return sceneObjects
		 			}
		 			//unload scene objects
		 			return sceneObjects
		 		}
		 	},
		 	initializers: [function ({}) {
		 		this.runCondition = runCondition,
		 			this.awaitCondition = awaitCondition,
		 			this.actionLines = actionLines
		 	}]
		 })
		 export default Unit

		 export const Shot = compose(Unit, {
		 	methods: {
		 		update: async function () {

		 		},
		 		initialize: () => {
		 			//if DEV_BUILD render the text
		 			this.setupCamera()
		 			this.startAnimations()
		 			//start animations
		 		},
		 		setupCamera: () => {

		 		},
		 		startAnimations: () => {},
		 		loadAssets: (shotAssets) => {},
		 		loadAnimations: (shotAnims) => {},
		 		loadActions: (shotActions) => {

		 		},
		 		shotUpdate: () => {
		 			this.evalconditionals()

		 			if (this.currentActionLine.isOver) {
		 				this.setCurrentAction(currentActionLine.next)
		 			}
		 		},
		 		runOp: (o.branchp) => {
		 			this.setCurrentShot(op.shot)
		 		},
		 		setCurrentAction: (nextAction) => {
		 			Shot.currentActionLine.stopAnimations()
		 			Shot.currentAction = nextAction
		 			Shot.currentActionLine.start()
		 		},
		 		setCurrentShot: (nextShot) => {
		 			this.unloadStaleAssets(nextShot, this)
		 			Shot.currentShot = nextShot //static
		 		},
		 	},
		 	initializers: [function ({
		 		shot
		 	}) {
		 		this.shot = shot
		 		shot.onInit()

		 		this.camera = camera
		 		this.animations = animations
		 		this.onInit()
		 	}]
		 })

		 export const Action = compose({
		 	methods: {
		 		update: async function () {

		 		},
		 		start: () => {
		 			//if DEV_BUILD render the text

		 			this.startAnimations()
		 			//start animations
		 		},
		 		setupCamera: () => {

		 		},
		 		startAnimations: () => {

		 		},
		 	},
		 	initializers: [function ({
		 		text,
		 		animations
		 	}) {
		 		this.text = text
		 		this.animations = animations
		 	}]
		 })
		 */