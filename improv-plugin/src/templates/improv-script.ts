import {
	AssetContainer,
	AssetsManager,
	Camera,
	Scene,
	SceneLoader,
	Vector3,
	Animation,
	AnimationGroup,
	Nullable,
	PowerEase,
	ArcRotateCamera,
	Behavior,
	FollowCamera,
  } from '@babylonjs/core'
  
  export enum ViewStatus {
	UNPLAYED,
	PLAYING,
	BACKGROUND,
	DONE,
  }
  
  interface AssetContainerRef {
	count: number
	container: AssetContainer
  }
  
  export class ImprovScript {
	static readonly AssetLocation: string = 'https://models.babylonjs.com/'
  
	// babylon main scene to add to and remove assetContainers
	_babylonMainScene: Scene
  
	_camera: Camera
  
	//babylon's assets loader
	public static AssetsManager: AssetsManager
	// the names of scenes referenced by this script that will be loaded
	private _referencedScenes: string[]
	// the names of objects referenced by this script that will be loaded
	private _objectNamesToLoad: string[]
  
	// this script's name
	private _name: string
	// all loaded scripts
	public static readonly LoadedScripts: {
	  [sceneName: string]: ImprovScript
	} = {}
	// all loaded scenes
	public static readonly LoadedAssetContainers: {
	  [sceneName: string]: AssetContainerRef
	} = {}
	// all states
	public static readonly AllMarkers: { [markerName: string]: boolean } = {}
  
	IsActive: boolean
  
	public constructor(
	  mainScene: Scene,
	  scriptName: string,
	  sceneNamesToLoad: string[],
	  objectNamesToLoad: string[],
	) {
	  this._name = scriptName
	  ImprovScript.LoadedScripts[this._name] = this
	  this._babylonMainScene = mainScene
	  this._camera = mainScene.getCameraByName('MainCamera')
	  this._referencedScenes = sceneNamesToLoad
	  this._objectNamesToLoad = objectNamesToLoad
	  if (!ImprovScript.AssetsManager) {
		ImprovScript.AssetsManager = new AssetsManager(mainScene)
	  }
	}
  
	protected gotoScript(scriptName: string): void {
	  // reset goto path since the scene is loading
	  let newScript = ImprovScript.LoadedScripts[scriptName]
	  newScript.loadSceneAssets()
	  newScript.IsActive = true
	  this.IsActive = false
	  this.decreaseRefsAndUnloadIfNeeded()
	}
  
	private decreaseRefsAndUnloadIfNeeded() {
	  for (let sceneNameToUnload of this._referencedScenes) {
		let assetRef = ImprovScript.LoadedAssetContainers[sceneNameToUnload]
		assetRef.count -= 1
		//TODO: more granular control over unloading individual unreferenced objects
		if (assetRef.count <= 0) {
		  assetRef.container.removeAllFromScene()
		}
	  }
	}
  
	private loadSceneAssets() {
	  for (let sceneName of this._referencedScenes) {
		if (ImprovScript.LoadedAssetContainers.hasOwnProperty(sceneName)) {
		  ImprovScript.LoadedAssetContainers[sceneName].count += 1
		} else {
		  let task = ImprovScript.AssetsManager.addContainerTask(
			`${sceneName} task`,
			'',
			ImprovScript.AssetLocation,
			`${sceneName}.glb`,
		  )
		  task.onSuccess = (task) => {
			const container = task.loadedContainer
			ImprovScript.LoadedAssetContainers[sceneName] = {
			  count: 1,
			  container,
			}
			container.addToScene(
			  (entity) => this._objectNamesToLoad.findIndex(entity.name) > -1,
			)
		  }
		}
	  }
	}
  
	protected isSelected(subjectName: string): boolean {
	  const pick = this._babylonMainScene.pick(
		this._babylonMainScene.pointerX,
		this._babylonMainScene.pointerY,
		undefined,
		false,
	  )
	  return pick.pickedMesh.name == subjectName
	}
  
	_viewStatuses: { [viewName: string]: ViewStatus } = {}
  
	protected playView(
	  viewType: string,
	  viewDuration: number,
	  cameraMovementType: string,
	  cameraFOV: number,
	  cameraFromName: string,
	  cameraLookAtName: string,
	  onUpdate: () => void,
	  nextPlayView: any,
	  cameraLooping: boolean = false,
	): ViewStatus {
	  let viewId = getViewId(viewType, cameraFromName, cameraLookAtName)
	  let status = this._viewStatuses[viewId]
	  if (status !== ViewStatus.PLAYING) {
		this._viewStatuses[viewId] = ViewStatus.PLAYING
		this._camera.fov = cameraFOV
		const fps = 60
		const totalFrame = viewDuration / fps
		let cameraFrom = this._babylonMainScene.getTransformNodeByName(
		  cameraFromName,
		).position
		let cameraLookAtMesh = this._babylonMainScene.getMeshByName(
		  cameraLookAtName,
		)
  
		var camera = new FollowCamera(
		  'FollowCam',
		  cameraFrom,
		  this._babylonMainScene,
		  cameraLookAtMesh,
		)
		// The goal distance of camera from target
		camera.radius = 30
		// The goal height of camera above local origin (centre) of target
		camera.heightOffset = 10
		// The goal rotation of camera around local origin (centre) of target in x y plane
		camera.rotationOffset = 0
		// Acceleration of camera in moving from current to goal position
		camera.cameraAcceleration = 0.005
		// The speed at which acceleration is halted
		camera.maxCameraSpeed = 10
		// This attaches the camera to the canvas
		camera.attachControl(true)
  
		//TODO: Movement based on cameraMovementType
		let cameraTo = cameraFrom //zoom: this._babylonMainScene.getTransformNodeByName(cameraLookAtName).position
		let cameraEasing = 1.0 //TODO: movement based on movemenet type
		let anim = Animation.CreateAndStartAnimation(
		  'animation', // name
		  this._camera, // node
		  'position', // target property
		  fps, // frames per second
		  totalFrame, // total frame
		  cameraFrom, // from
		  cameraTo, // to
		  cameraLooping ? 0 : 1, // loop mode
		  new PowerEase(cameraEasing), // easing function
		  () => {
			// on complete
			this._viewStatuses[viewId] = ViewStatus.DONE
			nextPlayView()
		  },
		)
	  } else if (status == ViewStatus.PLAYING) {
		onUpdate()
	  }
	  return status
	}
  
	protected playTransition(
	  transitionType: string,
	  transitionDuration: number,
	  fromViewId: string,
	  toViewId: string,
	) {
	  //CUT support switching active camera
	  if (transitionType == 'CUT') {
		this._viewStatuses[fromViewId] = ViewStatus.DONE
		this._viewStatuses[toViewId] = ViewStatus.PLAYING
		//change camera position
		//this._camera
	  }
	  //TODO: fade in/out
	}
  
	protected playAction(
	  actionName: string,
	  isLooping: boolean = false,
	  onDone: () => void,
	): Nullable<AnimationGroup> {
	  let animationGroup: Nullable<AnimationGroup> = this._babylonMainScene.getAnimationGroupByName(
		actionName,
	  )
	  if (animationGroup?.isPlaying == false) {
		//set the nextAction
		animationGroup.onAnimationEndObservable.add((eventData, eventState) => {
		  onDone()
		})
		animationGroup.play(isLooping)
	  }
	  return animationGroup
	}
  
	getScenePath(sceneName: string): string {
	  return `./${sceneName}`
	}
  
	setMarker(markerName: string) {
	  ImprovScript.AllMarkers[markerName] = true
	}
  
	unsetMarker(markerName: string) {
	  ImprovScript.AllMarkers[markerName] = false
	}
  
	// for scene logic
	runSceneLogic(): void {}
  }
  function getViewId(
	viewType: string,
	cameraFromName: string,
	cameraLookAtName: string,
  ) {
	return `${viewType}_${cameraFromName}_${cameraLookAtName}`
  }
  