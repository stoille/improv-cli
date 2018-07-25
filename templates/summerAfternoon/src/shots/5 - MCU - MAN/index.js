import { Shot } from 'improv'

export default Shot({
	props:{
		sceneObjects: {
			oldMan: SceneObject(),
			oldManCap: SceneObject(),
			oldBaptistChurchKentucky: SceneObject(),
			oldBaptistChurchDoor: SceneObject(),
			oldBaptistChurchFront: SceneObject()
		},
		awaitCondition: Conditional(),
		actions: []
	},
	methods: {
		onFirstUpdate: () => {
		},
		onUpdate: () => {
			//TODO: populate this shot with actions
		}
	}
})
