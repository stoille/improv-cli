/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`summerAfternoonTest.js TAP readScriptFile: ../scripts/summerAfternoon.imp... summerAfternoon parsed... > summerAfternoon 1`] = `
[ Unit {
    parent: null,
    decorators: [],
    scene: 
     { scenePlacement: 'EXT',
       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
       sceneTime: 'NOON',
       transition: { transitionType: 'FADE IN' },
       shots: 
        [ { camType: 'EWS',
            camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
            camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
            camMovement: null,
            time: { min: 1, sec: 51 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                      time: { min: 0, sec: 0 } } ] },
               { condition: 
                  { op: 'TOUCH',
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'OLD MAN', path: [] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'EXT',
                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                       sceneTime: 'NOON',
                       shots: 
                        [ { camType: 'EWS',
                            camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camMovement: null,
                            time: { min: 1, sec: 51 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: [ { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                               { speaker: 'Old Man',
                                 lines: [ { text: 'Hello?', time: { min: 0, sec: 0 } } ] } ] } ] } } },
               { condition: 
                  { op: 'TOUCH',
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'OLD MAN', path: [ 'CAP' ] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'EXT',
                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                       sceneTime: 'NOON',
                       shots: 
                        [ { camType: 'EWS',
                            camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camMovement: null,
                            time: { min: 1, sec: 51 },
                            activeObjects: [ 'OLD BAPTIST CHURCH' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'He pauses in contemplation and strokes his beard.',
                                      time: { min: 0, sec: 0 } } ] } ] },
                          { camType: 'CU',
                            camSource: { root: 'OLD', path: [ 'FACE' ] },
                            camTarget: { root: 'OLD', path: [ 'FACE' ] },
                            camMovement: null,
                            time: { min: 0, sec: 4 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'We see the old man\\'s wrinkled face.',
                                      time: { min: 0, sec: 0 } } ] },
                               { speaker: 'Old Man',
                                 lines: 
                                  [ { text: 'Is there anybody out there?',
                                      time: { min: 0, sec: 0 } } ] } ] } ] } } },
               { condition: 
                  { op: 'TOUCH',
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'EXT',
                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                       sceneTime: 'NOON',
                       shots: 
                        [ { camType: 'EWS',
                            camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                            camMovement: null,
                            time: { min: 1, sec: 51 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: [] },
                          { camType: 'LONG',
                            camSource: { root: 'SHOT', path: [] },
                            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                            camMovement: null,
                            time: { min: 0, sec: 4 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'The long church doors tower above a wraparound porch.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'A glimmer in the bush catches our eye.',
                                      time: { min: 0, sec: 0 } } ] },
                               { condition: 
                                  { op: 'TOUCH',
                                    time: { min: 0, sec: 0 },
                                    rhs: { root: 'BUSH', path: [] } },
                                 child: 
                                  Unit {
                                    parent: [Circular],
                                    decorators: [],
                                    scene: 
                                     { scenePlacement: 'EXT',
                                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                       sceneTime: 'NOON',
                                       shots: 
                                        [ { camType: 'LONG',
                                            camSource: { root: 'SHOT', path: [] },
                                            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                            camMovement: null,
                                            time: { min: 0, sec: 4 },
                                            activeObjects: [ 'OLD MAN/CAP' ],
                                            actions: [] },
                                          { camType: 'LONG SHOT',
                                            camSource: { root: 'MAN', path: [] },
                                            camTarget: { root: 'BUSH', path: [] },
                                            camMovement: null,
                                            time: { min: 0, sec: 4 },
                                            activeObjects: [ 'OLD MAN/CAP' ],
                                            actions: 
                                             [ { lines: 
                                                  [ { text: 'A light breeze picks up as we notice a key in the bush.',
                                                      time: { min: 0, sec: 0 } } ] },
                                               { condition: 
                                                  { op: 'PICKUP',
                                                    time: { min: 0, sec: 0 },
                                                    rhs: { root: 'KEY', path: [] } },
                                                 child: 
                                                  Unit {
                                                    parent: [Circular],
                                                    decorators: [],
                                                    scene: 
                                                     { scenePlacement: 'EXT',
                                                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                                       sceneTime: 'NOON',
                                                       shots: 
                                                        [ { camType: 'LONG SHOT',
                                                            camSource: { root: 'MAN', path: [] },
                                                            camTarget: { root: 'BUSH', path: [] },
                                                            camMovement: null,
                                                            time: { min: 0, sec: 4 },
                                                            activeObjects: [ 'OLD MAN/CAP' ],
                                                            actions: 
                                                             [ { lines: 
                                                                  [ { text: 'The man bends down to investigate.',
                                                                      time: { min: 0, sec: 0 } } ] } ] },
                                                          { camType: 'CU',
                                                            camSource: { root: 'OLD', path: [ 'FACE' ] },
                                                            camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                                            camMovement: null,
                                                            time: { min: 0, sec: 4 },
                                                            activeObjects: [ 'OLD MAN/CAP' ],
                                                            actions: 
                                                             [ { lines: 
                                                                  [ { text: 'We see an old key in the palm of his cracked hands.',
                                                                      time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] } } } ] } ] },
    await: 
     { op: 'PICKUP',
       time: { min: 0, sec: 0 },
       lhs: undefined,
       rhs: { root: 'KEY', path: [] } } },
  Unit {
    parent: 
     Unit {
       parent: null,
       decorators: [],
       scene: 
        { scenePlacement: 'EXT',
          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
          sceneTime: 'NOON',
          transition: { transitionType: 'FADE IN' },
          shots: 
           [ { camType: 'EWS',
               camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
               camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
               camMovement: null,
               time: { min: 1, sec: 51 },
               activeObjects: [ 'OLD MAN/CAP' ],
               actions: 
                [ { lines: 
                     [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                         time: { min: 0, sec: 0 } } ] },
                  { condition: 
                     { op: 'TOUCH',
                       time: { min: 0, sec: 0 },
                       rhs: { root: 'OLD MAN', path: [] } },
                    child: 
                     Unit {
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { scenePlacement: 'EXT',
                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                          sceneTime: 'NOON',
                          shots: 
                           [ { camType: 'EWS',
                               camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camMovement: null,
                               time: { min: 1, sec: 51 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: [ { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                                  { speaker: 'Old Man',
                                    lines: [ { text: 'Hello?', time: { min: 0, sec: 0 } } ] } ] } ] } } },
                  { condition: 
                     { op: 'TOUCH',
                       time: { min: 0, sec: 0 },
                       rhs: { root: 'OLD MAN', path: [ 'CAP' ] } },
                    child: 
                     Unit {
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { scenePlacement: 'EXT',
                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                          sceneTime: 'NOON',
                          shots: 
                           [ { camType: 'EWS',
                               camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camMovement: null,
                               time: { min: 1, sec: 51 },
                               activeObjects: [ 'OLD BAPTIST CHURCH' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'He pauses in contemplation and strokes his beard.',
                                         time: { min: 0, sec: 0 } } ] } ] },
                             { camType: 'CU',
                               camSource: { root: 'OLD', path: [ 'FACE' ] },
                               camTarget: { root: 'OLD', path: [ 'FACE' ] },
                               camMovement: null,
                               time: { min: 0, sec: 4 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'We see the old man\\'s wrinkled face.',
                                         time: { min: 0, sec: 0 } } ] },
                                  { speaker: 'Old Man',
                                    lines: 
                                     [ { text: 'Is there anybody out there?',
                                         time: { min: 0, sec: 0 } } ] } ] } ] } } },
                  { condition: 
                     { op: 'TOUCH',
                       time: { min: 0, sec: 0 },
                       rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                    child: 
                     Unit {
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { scenePlacement: 'EXT',
                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                          sceneTime: 'NOON',
                          shots: 
                           [ { camType: 'EWS',
                               camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                               camMovement: null,
                               time: { min: 1, sec: 51 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: [] },
                             { camType: 'LONG',
                               camSource: { root: 'SHOT', path: [] },
                               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                               camMovement: null,
                               time: { min: 0, sec: 4 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'The long church doors tower above a wraparound porch.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'A glimmer in the bush catches our eye.',
                                         time: { min: 0, sec: 0 } } ] },
                                  { condition: 
                                     { op: 'TOUCH',
                                       time: { min: 0, sec: 0 },
                                       rhs: { root: 'BUSH', path: [] } },
                                    child: 
                                     Unit {
                                       parent: [Circular],
                                       decorators: [],
                                       scene: 
                                        { scenePlacement: 'EXT',
                                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                          sceneTime: 'NOON',
                                          shots: 
                                           [ { camType: 'LONG',
                                               camSource: { root: 'SHOT', path: [] },
                                               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                               camMovement: null,
                                               time: { min: 0, sec: 4 },
                                               activeObjects: [ 'OLD MAN/CAP' ],
                                               actions: [] },
                                             { camType: 'LONG SHOT',
                                               camSource: { root: 'MAN', path: [] },
                                               camTarget: { root: 'BUSH', path: [] },
                                               camMovement: null,
                                               time: { min: 0, sec: 4 },
                                               activeObjects: [ 'OLD MAN/CAP' ],
                                               actions: 
                                                [ { lines: 
                                                     [ { text: 'A light breeze picks up as we notice a key in the bush.',
                                                         time: { min: 0, sec: 0 } } ] },
                                                  { condition: 
                                                     { op: 'PICKUP',
                                                       time: { min: 0, sec: 0 },
                                                       rhs: { root: 'KEY', path: [] } },
                                                    child: 
                                                     Unit {
                                                       parent: [Circular],
                                                       decorators: [],
                                                       scene: 
                                                        { scenePlacement: 'EXT',
                                                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                                          sceneTime: 'NOON',
                                                          shots: 
                                                           [ { camType: 'LONG SHOT',
                                                               camSource: { root: 'MAN', path: [] },
                                                               camTarget: { root: 'BUSH', path: [] },
                                                               camMovement: null,
                                                               time: { min: 0, sec: 4 },
                                                               activeObjects: [ 'OLD MAN/CAP' ],
                                                               actions: 
                                                                [ { lines: 
                                                                     [ { text: 'The man bends down to investigate.',
                                                                         time: { min: 0, sec: 0 } } ] } ] },
                                                             { camType: 'CU',
                                                               camSource: { root: 'OLD', path: [ 'FACE' ] },
                                                               camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                                               camMovement: null,
                                                               time: { min: 0, sec: 4 },
                                                               activeObjects: [ 'OLD MAN/CAP' ],
                                                               actions: 
                                                                [ { lines: 
                                                                     [ { text: 'We see an old key in the palm of his cracked hands.',
                                                                         time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] } } } ] } ] },
       await: 
        { op: 'PICKUP',
          time: { min: 0, sec: 0 },
          lhs: undefined,
          rhs: { root: 'KEY', path: [] } } },
    decorators: [],
    scene: 
     { scenePlacement: 'EXT',
       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
       sceneTime: 'NOON',
       shots: 
        [ { camType: 'EWS',
            camSource: { root: 'CHURCH', path: [] },
            camTarget: { root: 'CHURCH', path: [] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } },
                    { text: 'He looks at the key in his hand.',
                      time: { min: 0, sec: 0 } } ] } ] },
          { camType: 'MEDIUM',
            camSource: { root: 'SHOT', path: [] },
            camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'The man wipes his brow and looks up.',
                      time: { min: 0, sec: 0 } } ] } ] },
          { camType: 'MCU',
            camSource: { root: 'OLD MAN', path: [] },
            camTarget: { root: 'OLD MAN', path: [] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'He looks up at us.', time: { min: 0, sec: 0 } },
                    { text: 'The church\\'s cross drapes a long shadow over his face.',
                      time: { min: 0, sec: 0 } } ] },
               { speaker: 'Old Man',
                 lines: [ { text: 'hmph.', time: { min: 0, sec: 0 } } ] },
               { condition: 
                  { op: 'TOUCH',
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                 child: 
                  Unit {
                    parent: [Circular],
                    decorators: [],
                    scene: 
                     { scenePlacement: 'EXT',
                       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                       sceneTime: 'NOON',
                       shots: 
                        [ { camType: 'MCU',
                            camSource: { root: 'OLD MAN', path: [] },
                            camTarget: { root: 'OLD MAN', path: [] },
                            camMovement: null,
                            time: { min: 0, sec: 2 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'The Old Man shuffles over to the door.',
                                      time: { min: 0, sec: 0 } } ] } ] },
                          { camType: 'CU',
                            camSource: { root: 'MAN', path: [ 'HAND' ] },
                            camTarget: { root: 'MAN', path: [ 'HAND' ] },
                            camMovement: null,
                            time: { min: 0, sec: 2 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'As the Old Man approaches the door with his hand extended, the key flies out of it into the keyhole.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'The door swings open with a bang.',
                                      time: { min: 0, sec: 0 } } ] } ] },
                          { camType: 'LOW ANGLE',
                            camSource: { root: 'MAN', path: [] },
                            camTarget: { root: 'CHURCH', path: [] },
                            camMovement: null,
                            time: { min: 0, sec: 2 },
                            activeObjects: [ 'OLD MAN/CAP' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'Bats burst out of the door.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'They fly across the silhouette of the cross cast against the bright sky.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'We hear church bells.', time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
    await: 
     { op: 'TOUCH',
       time: { min: 0, sec: 0 },
       lhs: undefined,
       rhs: { root: 'Old Man', path: [] } } },
  Unit {
    parent: 
     Unit {
       parent: 
        Unit {
          parent: null,
          decorators: [],
          scene: 
           { scenePlacement: 'EXT',
             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
             sceneTime: 'NOON',
             transition: { transitionType: 'FADE IN' },
             shots: 
              [ { camType: 'EWS',
                  camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                  camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                  camMovement: null,
                  time: { min: 1, sec: 51 },
                  activeObjects: [ 'OLD MAN/CAP' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                            time: { min: 0, sec: 0 } } ] },
                     { condition: 
                        { op: 'TOUCH',
                          time: { min: 0, sec: 0 },
                          rhs: { root: 'OLD MAN', path: [] } },
                       child: 
                        Unit {
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { scenePlacement: 'EXT',
                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                             sceneTime: 'NOON',
                             shots: 
                              [ { camType: 'EWS',
                                  camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camMovement: null,
                                  time: { min: 1, sec: 51 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: [ { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                                     { speaker: 'Old Man',
                                       lines: [ { text: 'Hello?', time: { min: 0, sec: 0 } } ] } ] } ] } } },
                     { condition: 
                        { op: 'TOUCH',
                          time: { min: 0, sec: 0 },
                          rhs: { root: 'OLD MAN', path: [ 'CAP' ] } },
                       child: 
                        Unit {
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { scenePlacement: 'EXT',
                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                             sceneTime: 'NOON',
                             shots: 
                              [ { camType: 'EWS',
                                  camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camMovement: null,
                                  time: { min: 1, sec: 51 },
                                  activeObjects: [ 'OLD BAPTIST CHURCH' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'He pauses in contemplation and strokes his beard.',
                                            time: { min: 0, sec: 0 } } ] } ] },
                                { camType: 'CU',
                                  camSource: { root: 'OLD', path: [ 'FACE' ] },
                                  camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                  camMovement: null,
                                  time: { min: 0, sec: 4 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'We see the old man\\'s wrinkled face.',
                                            time: { min: 0, sec: 0 } } ] },
                                     { speaker: 'Old Man',
                                       lines: 
                                        [ { text: 'Is there anybody out there?',
                                            time: { min: 0, sec: 0 } } ] } ] } ] } } },
                     { condition: 
                        { op: 'TOUCH',
                          time: { min: 0, sec: 0 },
                          rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                       child: 
                        Unit {
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { scenePlacement: 'EXT',
                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                             sceneTime: 'NOON',
                             shots: 
                              [ { camType: 'EWS',
                                  camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                  camMovement: null,
                                  time: { min: 1, sec: 51 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: [] },
                                { camType: 'LONG',
                                  camSource: { root: 'SHOT', path: [] },
                                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                  camMovement: null,
                                  time: { min: 0, sec: 4 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'The long church doors tower above a wraparound porch.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'A glimmer in the bush catches our eye.',
                                            time: { min: 0, sec: 0 } } ] },
                                     { condition: 
                                        { op: 'TOUCH',
                                          time: { min: 0, sec: 0 },
                                          rhs: { root: 'BUSH', path: [] } },
                                       child: 
                                        Unit {
                                          parent: [Circular],
                                          decorators: [],
                                          scene: 
                                           { scenePlacement: 'EXT',
                                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                             sceneTime: 'NOON',
                                             shots: 
                                              [ { camType: 'LONG',
                                                  camSource: { root: 'SHOT', path: [] },
                                                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                                  camMovement: null,
                                                  time: { min: 0, sec: 4 },
                                                  activeObjects: [ 'OLD MAN/CAP' ],
                                                  actions: [] },
                                                { camType: 'LONG SHOT',
                                                  camSource: { root: 'MAN', path: [] },
                                                  camTarget: { root: 'BUSH', path: [] },
                                                  camMovement: null,
                                                  time: { min: 0, sec: 4 },
                                                  activeObjects: [ 'OLD MAN/CAP' ],
                                                  actions: 
                                                   [ { lines: 
                                                        [ { text: 'A light breeze picks up as we notice a key in the bush.',
                                                            time: { min: 0, sec: 0 } } ] },
                                                     { condition: 
                                                        { op: 'PICKUP',
                                                          time: { min: 0, sec: 0 },
                                                          rhs: { root: 'KEY', path: [] } },
                                                       child: 
                                                        Unit {
                                                          parent: [Circular],
                                                          decorators: [],
                                                          scene: 
                                                           { scenePlacement: 'EXT',
                                                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                                             sceneTime: 'NOON',
                                                             shots: 
                                                              [ { camType: 'LONG SHOT',
                                                                  camSource: { root: 'MAN', path: [] },
                                                                  camTarget: { root: 'BUSH', path: [] },
                                                                  camMovement: null,
                                                                  time: { min: 0, sec: 4 },
                                                                  activeObjects: [ 'OLD MAN/CAP' ],
                                                                  actions: 
                                                                   [ { lines: 
                                                                        [ { text: 'The man bends down to investigate.',
                                                                            time: { min: 0, sec: 0 } } ] } ] },
                                                                { camType: 'CU',
                                                                  camSource: { root: 'OLD', path: [ 'FACE' ] },
                                                                  camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                                                  camMovement: null,
                                                                  time: { min: 0, sec: 4 },
                                                                  activeObjects: [ 'OLD MAN/CAP' ],
                                                                  actions: 
                                                                   [ { lines: 
                                                                        [ { text: 'We see an old key in the palm of his cracked hands.',
                                                                            time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] } } } ] } ] },
          await: 
           { op: 'PICKUP',
             time: { min: 0, sec: 0 },
             lhs: undefined,
             rhs: { root: 'KEY', path: [] } } },
       decorators: [],
       scene: 
        { scenePlacement: 'EXT',
          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
          sceneTime: 'NOON',
          shots: 
           [ { camType: 'EWS',
               camSource: { root: 'CHURCH', path: [] },
               camTarget: { root: 'CHURCH', path: [] },
               camMovement: null,
               time: { min: 0, sec: 2 },
               activeObjects: [ 'OLD MAN/CAP' ],
               actions: 
                [ { lines: 
                     [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } },
                       { text: 'He looks at the key in his hand.',
                         time: { min: 0, sec: 0 } } ] } ] },
             { camType: 'MEDIUM',
               camSource: { root: 'SHOT', path: [] },
               camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
               camMovement: null,
               time: { min: 0, sec: 2 },
               activeObjects: [ 'OLD MAN/CAP' ],
               actions: 
                [ { lines: 
                     [ { text: 'The man wipes his brow and looks up.',
                         time: { min: 0, sec: 0 } } ] } ] },
             { camType: 'MCU',
               camSource: { root: 'OLD MAN', path: [] },
               camTarget: { root: 'OLD MAN', path: [] },
               camMovement: null,
               time: { min: 0, sec: 2 },
               activeObjects: [ 'OLD MAN/CAP' ],
               actions: 
                [ { lines: 
                     [ { text: 'He looks up at us.', time: { min: 0, sec: 0 } },
                       { text: 'The church\\'s cross drapes a long shadow over his face.',
                         time: { min: 0, sec: 0 } } ] },
                  { speaker: 'Old Man',
                    lines: [ { text: 'hmph.', time: { min: 0, sec: 0 } } ] },
                  { condition: 
                     { op: 'TOUCH',
                       time: { min: 0, sec: 0 },
                       rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                    child: 
                     Unit {
                       parent: [Circular],
                       decorators: [],
                       scene: 
                        { scenePlacement: 'EXT',
                          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                          sceneTime: 'NOON',
                          shots: 
                           [ { camType: 'MCU',
                               camSource: { root: 'OLD MAN', path: [] },
                               camTarget: { root: 'OLD MAN', path: [] },
                               camMovement: null,
                               time: { min: 0, sec: 2 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'The Old Man shuffles over to the door.',
                                         time: { min: 0, sec: 0 } } ] } ] },
                             { camType: 'CU',
                               camSource: { root: 'MAN', path: [ 'HAND' ] },
                               camTarget: { root: 'MAN', path: [ 'HAND' ] },
                               camMovement: null,
                               time: { min: 0, sec: 2 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'As the Old Man approaches the door with his hand extended, the key flies out of it into the keyhole.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'The door swings open with a bang.',
                                         time: { min: 0, sec: 0 } } ] } ] },
                             { camType: 'LOW ANGLE',
                               camSource: { root: 'MAN', path: [] },
                               camTarget: { root: 'CHURCH', path: [] },
                               camMovement: null,
                               time: { min: 0, sec: 2 },
                               activeObjects: [ 'OLD MAN/CAP' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'Bats burst out of the door.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'They fly across the silhouette of the cross cast against the bright sky.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'We hear church bells.', time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
       await: 
        { op: 'TOUCH',
          time: { min: 0, sec: 0 },
          lhs: undefined,
          rhs: { root: 'Old Man', path: [] } } },
    decorators: [],
    scene: 
     { scenePlacement: 'EXT',
       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
       sceneTime: 'NOON',
       shots: 
        [ { camType: 'HIGH',
            camSource: { root: 'ANGLE', path: [] },
            camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: [ { lines: [ { text: 'The man cowers.', time: { min: 0, sec: 0 } } ] } ] } ] },
    await: 
     { op: 'TOUCH',
       time: { min: 0, sec: 0 },
       lhs: undefined,
       rhs: { root: 'CHURCH', path: [ 'DOOR' ] } } },
  Unit {
    parent: 
     Unit {
       parent: 
        Unit {
          parent: 
           Unit {
             parent: null,
             decorators: [],
             scene: 
              { scenePlacement: 'EXT',
                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                sceneTime: 'NOON',
                transition: { transitionType: 'FADE IN' },
                shots: 
                 [ { camType: 'EWS',
                     camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                     camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                     camMovement: null,
                     time: { min: 1, sec: 51 },
                     activeObjects: [ 'OLD MAN/CAP' ],
                     actions: 
                      [ { lines: 
                           [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                               time: { min: 0, sec: 0 } } ] },
                        { condition: 
                           { op: 'TOUCH',
                             time: { min: 0, sec: 0 },
                             rhs: { root: 'OLD MAN', path: [] } },
                          child: 
                           Unit {
                             parent: [Circular],
                             decorators: [],
                             scene: 
                              { scenePlacement: 'EXT',
                                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                sceneTime: 'NOON',
                                shots: 
                                 [ { camType: 'EWS',
                                     camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camMovement: null,
                                     time: { min: 1, sec: 51 },
                                     activeObjects: [ 'OLD MAN/CAP' ],
                                     actions: 
                                      [ { lines: [ { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                                        { speaker: 'Old Man',
                                          lines: [ { text: 'Hello?', time: { min: 0, sec: 0 } } ] } ] } ] } } },
                        { condition: 
                           { op: 'TOUCH',
                             time: { min: 0, sec: 0 },
                             rhs: { root: 'OLD MAN', path: [ 'CAP' ] } },
                          child: 
                           Unit {
                             parent: [Circular],
                             decorators: [],
                             scene: 
                              { scenePlacement: 'EXT',
                                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                sceneTime: 'NOON',
                                shots: 
                                 [ { camType: 'EWS',
                                     camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camMovement: null,
                                     time: { min: 1, sec: 51 },
                                     activeObjects: [ 'OLD BAPTIST CHURCH' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                               time: { min: 0, sec: 0 } },
                                             { text: 'He pauses in contemplation and strokes his beard.',
                                               time: { min: 0, sec: 0 } } ] } ] },
                                   { camType: 'CU',
                                     camSource: { root: 'OLD', path: [ 'FACE' ] },
                                     camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                     camMovement: null,
                                     time: { min: 0, sec: 4 },
                                     activeObjects: [ 'OLD MAN/CAP' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'We see the old man\\'s wrinkled face.',
                                               time: { min: 0, sec: 0 } } ] },
                                        { speaker: 'Old Man',
                                          lines: 
                                           [ { text: 'Is there anybody out there?',
                                               time: { min: 0, sec: 0 } } ] } ] } ] } } },
                        { condition: 
                           { op: 'TOUCH',
                             time: { min: 0, sec: 0 },
                             rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                          child: 
                           Unit {
                             parent: [Circular],
                             decorators: [],
                             scene: 
                              { scenePlacement: 'EXT',
                                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                sceneTime: 'NOON',
                                shots: 
                                 [ { camType: 'EWS',
                                     camSource: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camTarget: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT' ] },
                                     camMovement: null,
                                     time: { min: 1, sec: 51 },
                                     activeObjects: [ 'OLD MAN/CAP' ],
                                     actions: [] },
                                   { camType: 'LONG',
                                     camSource: { root: 'SHOT', path: [] },
                                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                     camMovement: null,
                                     time: { min: 0, sec: 4 },
                                     activeObjects: [ 'OLD MAN/CAP' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'The long church doors tower above a wraparound porch.',
                                               time: { min: 0, sec: 0 } },
                                             { text: 'A glimmer in the bush catches our eye.',
                                               time: { min: 0, sec: 0 } } ] },
                                        { condition: 
                                           { op: 'TOUCH',
                                             time: { min: 0, sec: 0 },
                                             rhs: { root: 'BUSH', path: [] } },
                                          child: 
                                           Unit {
                                             parent: [Circular],
                                             decorators: [],
                                             scene: 
                                              { scenePlacement: 'EXT',
                                                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                                sceneTime: 'NOON',
                                                shots: 
                                                 [ { camType: 'LONG',
                                                     camSource: { root: 'SHOT', path: [] },
                                                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                                     camMovement: null,
                                                     time: { min: 0, sec: 4 },
                                                     activeObjects: [ 'OLD MAN/CAP' ],
                                                     actions: [] },
                                                   { camType: 'LONG SHOT',
                                                     camSource: { root: 'MAN', path: [] },
                                                     camTarget: { root: 'BUSH', path: [] },
                                                     camMovement: null,
                                                     time: { min: 0, sec: 4 },
                                                     activeObjects: [ 'OLD MAN/CAP' ],
                                                     actions: 
                                                      [ { lines: 
                                                           [ { text: 'A light breeze picks up as we notice a key in the bush.',
                                                               time: { min: 0, sec: 0 } } ] },
                                                        { condition: 
                                                           { op: 'PICKUP',
                                                             time: { min: 0, sec: 0 },
                                                             rhs: { root: 'KEY', path: [] } },
                                                          child: 
                                                           Unit {
                                                             parent: [Circular],
                                                             decorators: [],
                                                             scene: 
                                                              { scenePlacement: 'EXT',
                                                                sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                                                                sceneTime: 'NOON',
                                                                shots: 
                                                                 [ { camType: 'LONG SHOT',
                                                                     camSource: { root: 'MAN', path: [] },
                                                                     camTarget: { root: 'BUSH', path: [] },
                                                                     camMovement: null,
                                                                     time: { min: 0, sec: 4 },
                                                                     activeObjects: [ 'OLD MAN/CAP' ],
                                                                     actions: 
                                                                      [ { lines: 
                                                                           [ { text: 'The man bends down to investigate.',
                                                                               time: { min: 0, sec: 0 } } ] } ] },
                                                                   { camType: 'CU',
                                                                     camSource: { root: 'OLD', path: [ 'FACE' ] },
                                                                     camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                                                     camMovement: null,
                                                                     time: { min: 0, sec: 4 },
                                                                     activeObjects: [ 'OLD MAN/CAP' ],
                                                                     actions: 
                                                                      [ { lines: 
                                                                           [ { text: 'We see an old key in the palm of his cracked hands.',
                                                                               time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] } } } ] } ] },
             await: 
              { op: 'PICKUP',
                time: { min: 0, sec: 0 },
                lhs: undefined,
                rhs: { root: 'KEY', path: [] } } },
          decorators: [],
          scene: 
           { scenePlacement: 'EXT',
             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
             sceneTime: 'NOON',
             shots: 
              [ { camType: 'EWS',
                  camSource: { root: 'CHURCH', path: [] },
                  camTarget: { root: 'CHURCH', path: [] },
                  camMovement: null,
                  time: { min: 0, sec: 2 },
                  activeObjects: [ 'OLD MAN/CAP' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } },
                          { text: 'He looks at the key in his hand.',
                            time: { min: 0, sec: 0 } } ] } ] },
                { camType: 'MEDIUM',
                  camSource: { root: 'SHOT', path: [] },
                  camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
                  camMovement: null,
                  time: { min: 0, sec: 2 },
                  activeObjects: [ 'OLD MAN/CAP' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'The man wipes his brow and looks up.',
                            time: { min: 0, sec: 0 } } ] } ] },
                { camType: 'MCU',
                  camSource: { root: 'OLD MAN', path: [] },
                  camTarget: { root: 'OLD MAN', path: [] },
                  camMovement: null,
                  time: { min: 0, sec: 2 },
                  activeObjects: [ 'OLD MAN/CAP' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'He looks up at us.', time: { min: 0, sec: 0 } },
                          { text: 'The church\\'s cross drapes a long shadow over his face.',
                            time: { min: 0, sec: 0 } } ] },
                     { speaker: 'Old Man',
                       lines: [ { text: 'hmph.', time: { min: 0, sec: 0 } } ] },
                     { condition: 
                        { op: 'TOUCH',
                          time: { min: 0, sec: 0 },
                          rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'DOOR' ] } },
                       child: 
                        Unit {
                          parent: [Circular],
                          decorators: [],
                          scene: 
                           { scenePlacement: 'EXT',
                             sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
                             sceneTime: 'NOON',
                             shots: 
                              [ { camType: 'MCU',
                                  camSource: { root: 'OLD MAN', path: [] },
                                  camTarget: { root: 'OLD MAN', path: [] },
                                  camMovement: null,
                                  time: { min: 0, sec: 2 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'The Old Man shuffles over to the door.',
                                            time: { min: 0, sec: 0 } } ] } ] },
                                { camType: 'CU',
                                  camSource: { root: 'MAN', path: [ 'HAND' ] },
                                  camTarget: { root: 'MAN', path: [ 'HAND' ] },
                                  camMovement: null,
                                  time: { min: 0, sec: 2 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'As the Old Man approaches the door with his hand extended, the key flies out of it into the keyhole.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'The door swings open with a bang.',
                                            time: { min: 0, sec: 0 } } ] } ] },
                                { camType: 'LOW ANGLE',
                                  camSource: { root: 'MAN', path: [] },
                                  camTarget: { root: 'CHURCH', path: [] },
                                  camMovement: null,
                                  time: { min: 0, sec: 2 },
                                  activeObjects: [ 'OLD MAN/CAP' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'Bats burst out of the door.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'They fly across the silhouette of the cross cast against the bright sky.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'We hear church bells.', time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
          await: 
           { op: 'TOUCH',
             time: { min: 0, sec: 0 },
             lhs: undefined,
             rhs: { root: 'Old Man', path: [] } } },
       decorators: [],
       scene: 
        { scenePlacement: 'EXT',
          sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
          sceneTime: 'NOON',
          shots: 
           [ { camType: 'HIGH',
               camSource: { root: 'ANGLE', path: [] },
               camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
               camMovement: null,
               time: { min: 0, sec: 2 },
               activeObjects: [ 'OLD MAN/CAP' ],
               actions: [ { lines: [ { text: 'The man cowers.', time: { min: 0, sec: 0 } } ] } ] } ] },
       await: 
        { op: 'TOUCH',
          time: { min: 0, sec: 0 },
          lhs: undefined,
          rhs: { root: 'CHURCH', path: [ 'DOOR' ] } } },
    decorators: [],
    scene: 
     { scenePlacement: 'EXT',
       sceneName: 'OLD BAPTIST CHURCH, KENTUCKY',
       sceneTime: 'NOON',
       shots: 
        [ { camType: 'HIGH',
            camSource: { root: 'ANGLE', path: [] },
            camTarget: { root: 'MAN', path: [ 'RIGHT' ] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'He eases up and huffs.', time: { min: 0, sec: 0 } },
                    { text: 'Kicking a pebble, he shuffles into the sancturary.',
                      time: { min: 0, sec: 0 } } ] } ] },
          { camType: 'FULL',
            camSource: { root: 'CHURCH', path: [ 'DOOR' ] },
            camTarget: { root: 'CHURCH', path: [ 'DOOR' ] },
            camMovement: 'EASE IN',
            time: { min: 0, sec: 5 },
            activeObjects: [ 'OLD MAN/CAP' ],
            actions: 
             [ { lines: 
                  [ { text: 'We ease into the sanctuary.',
                      time: { min: 0, sec: 0 } } ] } ] } ] } } ]
`
