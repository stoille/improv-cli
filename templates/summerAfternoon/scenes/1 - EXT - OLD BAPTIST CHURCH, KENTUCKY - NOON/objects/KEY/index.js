import { SceneObject } from 'improv'

export default SceneObject({
	onLoad: () => {
		this.loadAssets(sceneAssets)
		this.loadAnimations(sceneAnims)
	},
	onFirstUpdate: () => {
		this.setupCameras()
		this.startAnimations()
	},
	onUpdate: () => {
		//TODO: populate this scene with behaviors
	}
})