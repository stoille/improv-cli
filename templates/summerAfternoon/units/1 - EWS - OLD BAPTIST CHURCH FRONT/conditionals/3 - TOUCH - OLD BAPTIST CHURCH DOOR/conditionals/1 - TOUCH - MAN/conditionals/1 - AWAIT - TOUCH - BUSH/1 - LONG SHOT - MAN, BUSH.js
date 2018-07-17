import { Shot } from 'improv'

const assets = {
	oldManPath: `./assets/oldMan`,
	oldManCapPath: `./assets/oldManCap`,
	oldBaptistChurchKentuckyPath: `./assets/oldBaptistChurchKentucky`,
	oldBaptistChurchDoorPath: `./assets/oldBaptistChurchDoor`,
	oldBaptistChurchFrontPath: `./assets/oldBaptistChurchFront`,
	runConditionPath: `./assets/runCondition`,
	awaitConditionPath: `./assets/awaitCondition`,
	actionsPath: `./assets/actions`
}

const anims = {
	oldManPath: `./assets/oldMan`,
	oldManCapPath: `./assets/oldManCap`,
	oldBaptistChurchKentuckyPath: `./assets/oldBaptistChurchKentucky`,
	oldBaptistChurchDoorPath: `./assets/oldBaptistChurchDoor`,
	oldBaptistChurchFrontPath: `./assets/oldBaptistChurchFront`,
	runConditionPath: `./assets/runCondition`,
	awaitConditionPath: `./assets/awaitCondition`,
	actionsPath: `./assets/actions`
}

const EWS_OldBaptistChurchFront = Shot({
	onLoad: () => {
		this.loadAssets(shotAssets)
		this.loadAnimations(shotAnims)
		this.loadActions(shotActions)
	},
	onFirstUpdate: () => {
		this.setupCamera()
		this.startAnimations()
	},
	onUpdate: () => {
		//visits all children units and hands over control if their condition is true
		if(this.evalConditionals()){
			return
		}
		
		//TODO: populate this shot with actions
	}
})
