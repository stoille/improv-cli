import { improv } from './improv'
import { Node } from '@babylonjs/core/node'
import { AssetsManager, Mesh, Scene, SceneLoader } from '@babylonjs/core'
import { visibleInInspector, VisiblityPropertyType, fromScene } from '../decorators'
import {
	'@REPLACE WITH SCRIPT REFERENCES@'
} from './improv'

export default class SceneClassName extends Node implements improv.IEntity {
  	// the names of scenes referenced by this script that will be loaded
	_referencedScenes: string[] = ['@REPLACE WITH SCENE LIST@']
	// the script instances referenced by this script
	'@REPLACE WITH SCRIPT INSTANCES@'
	// the objects referenced by this script that will be loaded
	objectMeshes: Mesh[]
	// the views referenced by this script
    views: improv.IView[] = 
		'@REPLACE WITH VIEW LIST@'
	
	// the actions referenced by this script
    actions: improv.IAction[] = [
		'@REPLACE WITH ACTION LIST@'
	]
	// the transitions referenced by this script
	transitions: improv.ITransition[] = [
		'@REPLACE WITH TRANSITION LIST@'
	]

	// this script's name
	_name: string
	// all loaded scripts
  //game objects that the scene logic acts on
  '@REPLACE WITH VARIABLE LIST@'

  /**
   * Override constructor.
   * @warn do not fill.
   */
  // @ts-ignore ignoring the super call as we don't want to re-init
  protected constructor() {}

  /**
   * Called on the node is being initialized.
   * This function is called immediatly after the constructor has been called.
   */
  public onInitialize(): void {
	if (!improv.AssetsManager) {
		improv._babylonMainScene = this._scene
		improv.AssetsManager = new AssetsManager(this._scene)
		improv._camera = this._scene.getCameraByName('MainCamera')
	  }
	  '@REPLACE WITH MAIN SCENE ASSIGNMENT@'
	  
	  //load objects
	  let objectNamesToLoad = ['@REPLACE WITH LOAD MESH LIST@']
	  //TODO: object loading
  }

  /**
   * Called on the scene starts.
   */
  public onStart(): void {
    // ...
  }

  /**
   * Called each frame.
   */
  public onUpdate(): void {
  }

  /**
   * Called on the object has been disposed.
   * Object can be disposed manually or when the editor stops running the scene.
   */
  public onStop(): void {
    // ...
  }

  /**
   * Called on a message has been received and sent from a graph.
   * @param message defines the name of the message sent from the graph.
   * @param data defines the data sent in the message.
   * @param sender defines the reference to the graph class that sent the message.
   */
  public onMessage(name: string, data: any, sender: any): void {
    switch (name) {
      case 'myMessage':
        // Do something...
        break
    }
  }

  public playScript(): void {
    const pick = this._scene.pick(
      this._scene.pointerX,
      this._scene.pointerY,
      undefined,
      false,
    )
	let pickMeshName
    if (pick?.hit) {
      pickMeshName = pick.pickedMesh?.name
    }
    '@REPLACE WITH SCENE LOGIC@'
  }
}
