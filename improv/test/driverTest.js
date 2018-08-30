const t = require('blue-tape')
const imp = require('../src/improv')

const unitDef = {
	type: 'Shot',
	scriptPath: './improv',
	sceneHeading: {
		type: 'SceneHading',
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
			min: 0,
			sec: 15
		}
	},
	actionLines: [{
			time: {
				min: 0,
				sec: 3
			},
			text: 'Over the dense hiss and buzz of a humid summer afternoon we see an old man pace along the porch of an old baptist church.'
		},
		{
			time: {
				min: 0,
				sec: 1
			},
			text: 'He clears his throat and coughs.'
		},
	],
	transitions: [{
		type: 'FadeIn',
		time: {
			min: 0,
			sec: 3
		},
		exp: [
			{
				type: 'OneShot'
			},
			{
				type: 'Select',
				handle: 'MAN'
			},
			{
				type: 'TimeWindow',
				timeSpan: {
					start: {
						sec: 5
					},
					end: {
						sec: 10
					}
				}
			}
		],
		next: {
			type: 'Shot',
			scriptPath: './improv',
			ceneHeading: {
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
				type: "Cut"
			}],
			actionLines: [{
					time: {
						min: 0,
						sec: 3
					},
					text: 'Foo.'
				},
				{
					time: {
						min: 0,
						sec: 1
					},
					text: 'Bar.'
				},
			]
		}
	}]
}
t.test(`updateDriver ...`, (t) => {
	let unit = imp.Unit(unitDef)
	let driver = imp.UpdateDriver({
		unit
	})
	return driver.testUpdate().then( (results) => {
			t.matchSnapshot(results, 'driverTest')
			t.end()
		})
})
