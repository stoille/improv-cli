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

const actions = {
	oldManPath: `./assets/oldMan`,
	oldManCapPath: `./assets/oldManCap`,
	oldBaptistChurchKentuckyPath: `./assets/oldBaptistChurchKentucky`,
	oldBaptistChurchDoorPath: `./assets/oldBaptistChurchDoor`,
	oldBaptistChurchFrontPath: `./assets/oldBaptistChurchFront`,
	runConditionPath: `./assets/runCondition`,
	awaitConditionPath: `./assets/awaitCondition`,
	actionsPath: `./assets/actions`
}

export default Shot({
	props: {
		assets,
		anims,
		actions
	},
	methods: {
		onFirstUpdate: () => {
			
		},
		onUpdate: () => {
			//TODO: populate this shot with actions
		}
	}
})
