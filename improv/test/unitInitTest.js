const t = require('tap')
const {
	Shot
} = require('../src/improv')
const {
	stringify
} = require('flatted/cjs')

const shotDef = {
	type: 'Shot',
	scriptPath: './improv',
	sceneHeading: {
		type: 'SceneHeading',
		locationType: 'EXT',
		sceneName: 'OLD BAPTIST CHURCH',
		location: 'KENTUCKY',
		timeOfDay: 'NOON',
	},
	shotHeading: {
		type: 'ShotHeading',
		cameraType: 'EWS',
		cameraSource: null,
		cameraTarget: 'OLD BAPTIST CHURCH FRONT',
		cameraMovement: {
			movementType: 'EASE_IN',
			time: {
				sec: 2
			}
		},
		time: {
			sec: 15
		}
	},
	transitions: [{
		type: 'FadeIn',
		time: {
			sec: 3
		},
		exp: [{
			type: 'OneShot'
		}, {
			type: 'Select',
			handle: 'MAN'
		}, {
			type: 'TimeWindow',
			timeSpan: {
				start: {
					sec: 5
				},
				end: {
					sec: 15
				}
			}
		}],
		next: {
			type: 'Shot',
			scriptPath: './improv',
			sceneHeading: {
				type: 'SceneHeading',
				locationType: 'EXT',
				sceneName: 'OLD BAPTIST CHURCH',
				location: 'KENTUCKY',
				timeOfDay: 'NOON',
			},
			shotHeading: {
				type: 'ShotHeading',
				cameraType: 'EWS',
				cameraSource: null,
				cameraTarget: 'OLD BAPTIST CHURCH FRONT',
				cameraMovement: {
					movementType: 'EASE_IN',
					time: {
						sec: 2
					}
				},
				time: {
					sec: 15
				}
			},
			transitions: [{
				type: 'Cut',
				exp: [{
					type: 'ActionBlock',
					actionLines: [{
							time: {
								sec: 3
							},
							text: 'Foo.'
						},
						{
							time: {
								sec: 1
							},
							text: 'Bar.'
						},
					]
				}]
			}]
		}
	}, {
		type: 'Cut',
		exp: [{
			type: 'ActionBlock',
			actionLines: [{
					time: {
						sec: 3
					},
					text: 'Over the dense hiss and buzz of a humid summer afternoon we see an old man pace along the porch of an old baptist church.'
				},
				{
					time: {
						sec: 1
					},
					text: 'He clears his throat and coughs.'
				},
			],
			next: null
		}]
	}]
}

t.test(`shotInit ...`, (t) => {
	let shot = Shot(shotDef)
	let s = stringify(shot)
	//console.log(shot.type + ": "+s)
	t.matchSnapshot(s, 'shotTest')
	t.end()
})
