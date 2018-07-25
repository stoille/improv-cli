import {
	Shot,
	Transition,
	Conditional,
	OneShot,
	Await,
	After,
	Select,
	State
} from './improv'

export default Shot({
	methods: {
		loadConditionals: async () => {
			this.state = State.LOAD_CONDITIONALS
			this.conditionals.push(await
					import ('./1 - SELECT - MAN - ONCE')
					.then(shot => Conditional({
						condition: OneShot(shot.id).Select(sceneObjects.man).TimeSpan(5000, 10000),
						child: shot,
						parent: this
					})))
			this.conditionals.push(await
					import ('./2 - SELECT - MAN CAP - AFTER - SELECT - MAN')
					.then(shot => Conditional({
						condition: Select(sceneObjects.manCap).After(Select(sceneObjects.man)),
						child: shot,
						parent: this
					})))
			this.conditionals.push(await
					import ('./3 - AFTER - SELECT - MAN CAP')
					.then(shot => Conditional({
						condition: After(Select(sceneObjects.manCap)),
						child: shot,
						parent: this
					})))
			this.conditionals.push(await
					import ('./4 - AFTER - SELECT - OLD BAPTIST CHURCH DOOR')
					.then(shot => Conditional({
						condition: After(Select(sceneObjects.oldBaptistChurchDoor)),
						child: shot,
						parent: this
					})))
			this.holdConditional.push(await
					import ('./5 - AWAIT - Pickup - KEY - SELECT - MAN CAP')
					.then(shot => Conditional({
						condition: Await(Pickup(sceneObjects.key).Select(sceneObjects.manCap)),
						child: shot,
						parent: this
					})))
		},
		//TODO: finish loading code,
		// finish rest of indexes,
		// mock tests for running events,
		// fix parser to generate JSON,
		// JSON -> JS project files
		//TODO: file watch live compiling
		
		loadAssets: async () => {
			this.state = State.LOAD_ASSETS

			const kentucky = `${ROOT}/assets/kentucky`
			const oldBaptistChurch = `${ROOT}/assets/kentucky/oldBaptistChurch`

			this.scene = await Scene({
					location: kentucky,
					setting: oldBaptistChurch,
					lighting: Lighting(Lighting.EXT, Lighting.NOON)
				}).loadAssets()
			this.sceneObjects = {
				man: SceneObject(),
				manCap: SceneObject(),
				oldBaptistChurchDoor: SceneObject(),
				oldBaptistChurchFront: SceneObject(),
				key: SceneObject()
			}
			this.subject = Transition({
				target: this.sceneObjects.oldBaptistChurchFront,
				type: Transition.Type.EaseIn
			})
			this.actions = this.actions.map( actionText => Action({text: actionsText}))

			this.state = State.READY
		},
		onFirstUpdate: () => {
			try {
				return require('./onFirstUpdate').bind(this)
			} catch( err ) {
				console.log(err)
				return null
			}
		},
		onUpdate: () => {
			try {
				return require('./onUpdate').bind(this)
			} catch (err) {
				console.log(err)
				return null
			}
		}
	}
})
