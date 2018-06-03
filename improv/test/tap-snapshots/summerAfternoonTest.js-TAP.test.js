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
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
            actions: 
             [ { lines: 
                  [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                      time: { min: 0, sec: 0 } },
                    { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
               { speaker: 'Old Man',
                 lines: [ { text: 'Hello world?', time: { min: 0, sec: 0 } } ] },
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
                            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                      time: { min: 0, sec: 0 } },
                                    { text: 'He stops to stroke his beard.',
                                      time: { min: 0, sec: 0 } } ] } ] },
                          { camType: 'CU',
                            camSource: { root: 'OLD', path: [ 'FACE' ] },
                            camTarget: { root: 'OLD', path: [ 'FACE' ] },
                            camMovement: null,
                            time: { min: 0, sec: 4 },
                            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'We see the old man\\'s white beard.',
                                      time: { min: 0, sec: 0 } } ] } ] } ] } } },
               { condition: 
                  { op: 'TOUCH',
                    time: { min: 0, sec: 0 },
                    rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT', 'DOOR' ] } },
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
                            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                            actions: [] },
                          { camType: 'LONG',
                            camSource: { root: 'SHOT', path: [] },
                            camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                            camMovement: null,
                            time: { min: 0, sec: 4 },
                            activeObjects: [ 'BUSH' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'The long church doors tower above a wraparound porch.',
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
                                            activeObjects: [ 'BUSH' ],
                                            actions: [] },
                                          { camType: 'LONG SHOT',
                                            camSource: { root: 'BUSH', path: [] },
                                            camTarget: { root: 'MAN', path: [] },
                                            camMovement: null,
                                            time: { min: 0, sec: 4 },
                                            activeObjects: [ 'BUSH' ],
                                            actions: 
                                             [ { lines: 
                                                  [ { text: 'The bush sways in a light breeze.',
                                                      time: { min: 0, sec: 0 } },
                                                    { text: 'The man paces between them.',
                                                      time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] },
    await: 
     { op: 'AND',
       time: undefined,
       lhs: 
        { op: 'TOUCH',
          time: { min: 0, sec: 0 },
          lhs: undefined,
          rhs: { root: 'FOOZ', path: [] } },
       rhs: 
        { op: 'AND',
          time: undefined,
          lhs: 
           { op: 'TOUCH',
             time: { min: 0, sec: 0 },
             lhs: undefined,
             rhs: { root: 'FOOZ', path: [] } },
          rhs: 
           { op: 'TOUCH',
             time: { min: 0, sec: 4 },
             lhs: undefined,
             rhs: { root: 'GAG', path: [] } } } } },
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
               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
               actions: 
                [ { lines: 
                     [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                         time: { min: 0, sec: 0 } },
                       { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                  { speaker: 'Old Man',
                    lines: [ { text: 'Hello world?', time: { min: 0, sec: 0 } } ] },
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
                               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                         time: { min: 0, sec: 0 } },
                                       { text: 'He stops to stroke his beard.',
                                         time: { min: 0, sec: 0 } } ] } ] },
                             { camType: 'CU',
                               camSource: { root: 'OLD', path: [ 'FACE' ] },
                               camTarget: { root: 'OLD', path: [ 'FACE' ] },
                               camMovement: null,
                               time: { min: 0, sec: 4 },
                               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'We see the old man\\'s white beard.',
                                         time: { min: 0, sec: 0 } } ] } ] } ] } } },
                  { condition: 
                     { op: 'TOUCH',
                       time: { min: 0, sec: 0 },
                       rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT', 'DOOR' ] } },
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
                               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                               actions: [] },
                             { camType: 'LONG',
                               camSource: { root: 'SHOT', path: [] },
                               camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                               camMovement: null,
                               time: { min: 0, sec: 4 },
                               activeObjects: [ 'BUSH' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'The long church doors tower above a wraparound porch.',
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
                                               activeObjects: [ 'BUSH' ],
                                               actions: [] },
                                             { camType: 'LONG SHOT',
                                               camSource: { root: 'BUSH', path: [] },
                                               camTarget: { root: 'MAN', path: [] },
                                               camMovement: null,
                                               time: { min: 0, sec: 4 },
                                               activeObjects: [ 'BUSH' ],
                                               actions: 
                                                [ { lines: 
                                                     [ { text: 'The bush sways in a light breeze.',
                                                         time: { min: 0, sec: 0 } },
                                                       { text: 'The man paces between them.',
                                                         time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] },
       await: 
        { op: 'AND',
          time: undefined,
          lhs: 
           { op: 'TOUCH',
             time: { min: 0, sec: 0 },
             lhs: undefined,
             rhs: { root: 'FOOZ', path: [] } },
          rhs: 
           { op: 'AND',
             time: undefined,
             lhs: 
              { op: 'TOUCH',
                time: { min: 0, sec: 0 },
                lhs: undefined,
                rhs: { root: 'FOOZ', path: [] } },
             rhs: 
              { op: 'TOUCH',
                time: { min: 0, sec: 4 },
                lhs: undefined,
                rhs: { root: 'GAG', path: [] } } } } },
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
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
            actions: [ { lines: [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } } ] } ] },
          { camType: 'MEDIUM',
            camSource: { root: 'SHOT', path: [] },
            camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
            camMovement: null,
            time: { min: 0, sec: 2 },
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
            actions: 
             [ { lines: 
                  [ { text: 'The man wipes his brow and looks up.',
                      time: { min: 0, sec: 0 } } ] } ] } ] },
    await: 
     { op: null,
       time: { min: 0, sec: 0 },
       lhs: undefined,
       rhs: { root: 'FOON', path: [] } } },
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
                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                            time: { min: 0, sec: 0 } },
                          { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                     { speaker: 'Old Man',
                       lines: [ { text: 'Hello world?', time: { min: 0, sec: 0 } } ] },
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
                                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                            time: { min: 0, sec: 0 } },
                                          { text: 'He stops to stroke his beard.',
                                            time: { min: 0, sec: 0 } } ] } ] },
                                { camType: 'CU',
                                  camSource: { root: 'OLD', path: [ 'FACE' ] },
                                  camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                  camMovement: null,
                                  time: { min: 0, sec: 4 },
                                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'We see the old man\\'s white beard.',
                                            time: { min: 0, sec: 0 } } ] } ] } ] } } },
                     { condition: 
                        { op: 'TOUCH',
                          time: { min: 0, sec: 0 },
                          rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT', 'DOOR' ] } },
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
                                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                  actions: [] },
                                { camType: 'LONG',
                                  camSource: { root: 'SHOT', path: [] },
                                  camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                  camMovement: null,
                                  time: { min: 0, sec: 4 },
                                  activeObjects: [ 'BUSH' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'The long church doors tower above a wraparound porch.',
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
                                                  activeObjects: [ 'BUSH' ],
                                                  actions: [] },
                                                { camType: 'LONG SHOT',
                                                  camSource: { root: 'BUSH', path: [] },
                                                  camTarget: { root: 'MAN', path: [] },
                                                  camMovement: null,
                                                  time: { min: 0, sec: 4 },
                                                  activeObjects: [ 'BUSH' ],
                                                  actions: 
                                                   [ { lines: 
                                                        [ { text: 'The bush sways in a light breeze.',
                                                            time: { min: 0, sec: 0 } },
                                                          { text: 'The man paces between them.',
                                                            time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] },
          await: 
           { op: 'AND',
             time: undefined,
             lhs: 
              { op: 'TOUCH',
                time: { min: 0, sec: 0 },
                lhs: undefined,
                rhs: { root: 'FOOZ', path: [] } },
             rhs: 
              { op: 'AND',
                time: undefined,
                lhs: 
                 { op: 'TOUCH',
                   time: { min: 0, sec: 0 },
                   lhs: undefined,
                   rhs: { root: 'FOOZ', path: [] } },
                rhs: 
                 { op: 'TOUCH',
                   time: { min: 0, sec: 4 },
                   lhs: undefined,
                   rhs: { root: 'GAG', path: [] } } } } },
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
               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
               actions: [ { lines: [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } } ] } ] },
             { camType: 'MEDIUM',
               camSource: { root: 'SHOT', path: [] },
               camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
               camMovement: null,
               time: { min: 0, sec: 2 },
               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
               actions: 
                [ { lines: 
                     [ { text: 'The man wipes his brow and looks up.',
                         time: { min: 0, sec: 0 } } ] } ] } ] },
       await: 
        { op: null,
          time: { min: 0, sec: 0 },
          lhs: undefined,
          rhs: { root: 'FOON', path: [] } } },
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
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
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
                    rhs: { root: 'Old Man', path: [] } },
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
                            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                            actions: [] },
                          { camType: 'LOW ANGLE',
                            camSource: { root: 'MAN', path: [] },
                            camTarget: { root: 'CHURCH', path: [] },
                            camMovement: null,
                            time: { min: 0, sec: 2 },
                            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                            actions: 
                             [ { lines: 
                                  [ { text: 'We see the silhouette of the cross cast against the bright sky.',
                                      time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
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
                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                     actions: 
                      [ { lines: 
                           [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                               time: { min: 0, sec: 0 } },
                             { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                        { speaker: 'Old Man',
                          lines: [ { text: 'Hello world?', time: { min: 0, sec: 0 } } ] },
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
                                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                               time: { min: 0, sec: 0 } },
                                             { text: 'He stops to stroke his beard.',
                                               time: { min: 0, sec: 0 } } ] } ] },
                                   { camType: 'CU',
                                     camSource: { root: 'OLD', path: [ 'FACE' ] },
                                     camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                     camMovement: null,
                                     time: { min: 0, sec: 4 },
                                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'We see the old man\\'s white beard.',
                                               time: { min: 0, sec: 0 } } ] } ] } ] } } },
                        { condition: 
                           { op: 'TOUCH',
                             time: { min: 0, sec: 0 },
                             rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT', 'DOOR' ] } },
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
                                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                     actions: [] },
                                   { camType: 'LONG',
                                     camSource: { root: 'SHOT', path: [] },
                                     camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                     camMovement: null,
                                     time: { min: 0, sec: 4 },
                                     activeObjects: [ 'BUSH' ],
                                     actions: 
                                      [ { lines: 
                                           [ { text: 'The long church doors tower above a wraparound porch.',
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
                                                     activeObjects: [ 'BUSH' ],
                                                     actions: [] },
                                                   { camType: 'LONG SHOT',
                                                     camSource: { root: 'BUSH', path: [] },
                                                     camTarget: { root: 'MAN', path: [] },
                                                     camMovement: null,
                                                     time: { min: 0, sec: 4 },
                                                     activeObjects: [ 'BUSH' ],
                                                     actions: 
                                                      [ { lines: 
                                                           [ { text: 'The bush sways in a light breeze.',
                                                               time: { min: 0, sec: 0 } },
                                                             { text: 'The man paces between them.',
                                                               time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] },
             await: 
              { op: 'AND',
                time: undefined,
                lhs: 
                 { op: 'TOUCH',
                   time: { min: 0, sec: 0 },
                   lhs: undefined,
                   rhs: { root: 'FOOZ', path: [] } },
                rhs: 
                 { op: 'AND',
                   time: undefined,
                   lhs: 
                    { op: 'TOUCH',
                      time: { min: 0, sec: 0 },
                      lhs: undefined,
                      rhs: { root: 'FOOZ', path: [] } },
                   rhs: 
                    { op: 'TOUCH',
                      time: { min: 0, sec: 4 },
                      lhs: undefined,
                      rhs: { root: 'GAG', path: [] } } } } },
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
                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                  actions: [ { lines: [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } } ] } ] },
                { camType: 'MEDIUM',
                  camSource: { root: 'SHOT', path: [] },
                  camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
                  camMovement: null,
                  time: { min: 0, sec: 2 },
                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                  actions: 
                   [ { lines: 
                        [ { text: 'The man wipes his brow and looks up.',
                            time: { min: 0, sec: 0 } } ] } ] } ] },
          await: 
           { op: null,
             time: { min: 0, sec: 0 },
             lhs: undefined,
             rhs: { root: 'FOON', path: [] } } },
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
               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
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
                       rhs: { root: 'Old Man', path: [] } },
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
                               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                               actions: [] },
                             { camType: 'LOW ANGLE',
                               camSource: { root: 'MAN', path: [] },
                               camTarget: { root: 'CHURCH', path: [] },
                               camMovement: null,
                               time: { min: 0, sec: 2 },
                               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                               actions: 
                                [ { lines: 
                                     [ { text: 'We see the silhouette of the cross cast against the bright sky.',
                                         time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
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
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
            actions: 
             [ { lines: 
                  [ { text: 'He almost looks up but shrugs and huffs.',
                      time: { min: 0, sec: 0 } },
                    { text: 'He kicks a pebble.', time: { min: 0, sec: 0 } } ] } ] } ] },
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
                        activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                        actions: 
                         [ { lines: 
                              [ { text: 'Over the dense hiss and buzz of a humid summer afternoon we watch an old man pace in front of an old baptist church.',
                                  time: { min: 0, sec: 0 } },
                                { text: 'The man pauses to speak.', time: { min: 0, sec: 0 } } ] },
                           { speaker: 'Old Man',
                             lines: [ { text: 'Hello world?', time: { min: 0, sec: 0 } } ] },
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
                                        activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                        actions: 
                                         [ { lines: 
                                              [ { text: 'He anxiously brushes through his hair and crumples his cap while he paces.',
                                                  time: { min: 0, sec: 0 } },
                                                { text: 'He stops to stroke his beard.',
                                                  time: { min: 0, sec: 0 } } ] } ] },
                                      { camType: 'CU',
                                        camSource: { root: 'OLD', path: [ 'FACE' ] },
                                        camTarget: { root: 'OLD', path: [ 'FACE' ] },
                                        camMovement: null,
                                        time: { min: 0, sec: 4 },
                                        activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                        actions: 
                                         [ { lines: 
                                              [ { text: 'We see the old man\\'s white beard.',
                                                  time: { min: 0, sec: 0 } } ] } ] } ] } } },
                           { condition: 
                              { op: 'TOUCH',
                                time: { min: 0, sec: 0 },
                                rhs: { root: 'OLD BAPTIST CHURCH', path: [ 'FRONT', 'DOOR' ] } },
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
                                        activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                        actions: [] },
                                      { camType: 'LONG',
                                        camSource: { root: 'SHOT', path: [] },
                                        camTarget: { root: 'CHURCH', path: [ 'FRONT' ] },
                                        camMovement: null,
                                        time: { min: 0, sec: 4 },
                                        activeObjects: [ 'BUSH' ],
                                        actions: 
                                         [ { lines: 
                                              [ { text: 'The long church doors tower above a wraparound porch.',
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
                                                        activeObjects: [ 'BUSH' ],
                                                        actions: [] },
                                                      { camType: 'LONG SHOT',
                                                        camSource: { root: 'BUSH', path: [] },
                                                        camTarget: { root: 'MAN', path: [] },
                                                        camMovement: null,
                                                        time: { min: 0, sec: 4 },
                                                        activeObjects: [ 'BUSH' ],
                                                        actions: 
                                                         [ { lines: 
                                                              [ { text: 'The bush sways in a light breeze.',
                                                                  time: { min: 0, sec: 0 } },
                                                                { text: 'The man paces between them.',
                                                                  time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] } } } ] } ] },
                await: 
                 { op: 'AND',
                   time: undefined,
                   lhs: 
                    { op: 'TOUCH',
                      time: { min: 0, sec: 0 },
                      lhs: undefined,
                      rhs: { root: 'FOOZ', path: [] } },
                   rhs: 
                    { op: 'AND',
                      time: undefined,
                      lhs: 
                       { op: 'TOUCH',
                         time: { min: 0, sec: 0 },
                         lhs: undefined,
                         rhs: { root: 'FOOZ', path: [] } },
                      rhs: 
                       { op: 'TOUCH',
                         time: { min: 0, sec: 4 },
                         lhs: undefined,
                         rhs: { root: 'GAG', path: [] } } } } },
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
                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                     actions: [ { lines: [ { text: 'The man coughs violently.', time: { min: 0, sec: 0 } } ] } ] },
                   { camType: 'MEDIUM',
                     camSource: { root: 'SHOT', path: [] },
                     camTarget: { root: 'OLD MAN', path: [ 'RIGHT' ] },
                     camMovement: null,
                     time: { min: 0, sec: 2 },
                     activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                     actions: 
                      [ { lines: 
                           [ { text: 'The man wipes his brow and looks up.',
                               time: { min: 0, sec: 0 } } ] } ] } ] },
             await: 
              { op: null,
                time: { min: 0, sec: 0 },
                lhs: undefined,
                rhs: { root: 'FOON', path: [] } } },
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
                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
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
                          rhs: { root: 'Old Man', path: [] } },
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
                                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                  actions: [] },
                                { camType: 'LOW ANGLE',
                                  camSource: { root: 'MAN', path: [] },
                                  camTarget: { root: 'CHURCH', path: [] },
                                  camMovement: null,
                                  time: { min: 0, sec: 2 },
                                  activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
                                  actions: 
                                   [ { lines: 
                                        [ { text: 'We see the silhouette of the cross cast against the bright sky.',
                                            time: { min: 0, sec: 0 } } ] } ] } ] } } } ] } ] },
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
               activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
               actions: 
                [ { lines: 
                     [ { text: 'He almost looks up but shrugs and huffs.',
                         time: { min: 0, sec: 0 } },
                       { text: 'He kicks a pebble.', time: { min: 0, sec: 0 } } ] } ] } ] },
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
        [ { camType: 'FULL',
            camSource: { root: 'CHURCH', path: [ 'DOOR' ] },
            camTarget: { root: 'CHURCH', path: [ 'DOOR' ] },
            camMovement: 'EASE IN',
            time: { min: 0, sec: 5 },
            activeObjects: [ 'OLD MAN', 'OLD BAPTIST CHURCH', 'BUSH' ],
            actions: 
             [ { lines: 
                  [ { text: 'We ease into the sanctuary.',
                      time: { min: 0, sec: 0 } } ] } ] } ] } } ]
`
