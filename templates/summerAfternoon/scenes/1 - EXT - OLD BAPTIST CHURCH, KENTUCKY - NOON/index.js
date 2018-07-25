import { Shot, Transition } from 'improv'

import touchManOnceTime from '.'
const kentucky = `${ROOT}/assets/kentucky`
const oldBaptistChurch = `${ROOT}/assets/kentucky/oldBaptistChurch`

export default Shot({
	props:{
		id: unitId,
		scene: Scene({location: kentucky, setting: oldBaptistChurch, lighting: Lighting(Lighting.EXT, Lighting.NOON)}),
		subject: Transition({target: oldBaptistChurchFront, type: Transition.Type.EaseIn}),
		actions: actions,
		sceneObjects: {
			man: SceneObject(),
			manCap: SceneObject(),
			oldBaptistChurchDoor: SceneObject(),
			oldBaptistChurchFront: SceneObject(),
			key: SceneObject()
		},
		conditionals: [
			Conditional({
				condition: ONCE(TOUCH(sceneObjects.man, TimeSpan(obj.conditional[0].args[0], obj.conditional[0].args[1]))),
				child: Shot({id: obj.conditional[0].child.id}),
				parent: this
			}),
			Conditional({
				condition: AFTER(TOUCH(sceneObjects.man), TOUCH(sceneObjects.manCap)),
				child: Shot({id: obj.conditional[1].child.id}),
				parent: this
			}),
			Conditional({
				condition: AFTER(TOUCH(sceneObjects.manCap), TOUCH(sceneObjects.manCap)),
				child: Shot({id: obj.conditional[2].child.id}),
				parent: this
			})
		],
		holdConditional: Conditional({
				condition: AWAIT(Pickup(sceneObjects.key), TOUCH(sceneObjects.manCap)), 
				child: Shot({id: obj.conditional[3].child.id}),
				parent: this
		})
	},
	methods: {
		onFirstUpdate: () => {
		},
		onUpdate: () => {
			//TODO: populate this shot with actions
		}
	}
})
