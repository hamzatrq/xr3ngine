import { Engine } from "../../ecs/classes/Engine";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, RingGeometry, Vector3 } from 'three';
import { getLoader } from "../../assets/functions/LoadGLTF";
// import { GLTF } from "../../assets/loaders/gltf/GLTFLoader";
import { FollowCameraComponent } from "../../camera/components/FollowCameraComponent";
import { CameraModes } from "../../camera/types/CameraModes";
import { addComponent, getComponent, getMutableComponent, removeComponent } from '../../ecs/functions/EntityFunctions';
import { Network } from "../../networking/classes/Network";
import { XRSystem } from "../systems/XRSystem";
import { CharacterComponent } from "../../templates/character/components/CharacterComponent";
import { XRInputReceiver } from '../../input/components/XRInputReceiver';
import { initiateIK, stopIK } from "./IKFunctions";
import { initializeMovingState } from "../../templates/character/animations/MovingAnimations";

let head, controllerGripLeft, controllerLeft, controllerRight, controllerGripRight;

export const startXR = async () => {

  try{

    const dolly = new Group();
    XRSystem.instance.cameraDolly = dolly;

    const cameraFollow = getMutableComponent<FollowCameraComponent>(Network.instance.localClientEntity, FollowCameraComponent) as FollowCameraComponent;
    cameraFollow.mode = CameraModes.XR;
    const actor = getComponent(Network.instance.localClientEntity, CharacterComponent);
    actor.tiltContainer.add(dolly);
    Engine.scene.remove(Engine.camera);
    dolly.add(Engine.camera);

    initiateIK(Network.instance.localClientEntity)

    head = Engine.renderer.xr.getCamera(Engine.camera);
    controllerLeft = Engine.renderer.xr.getController(0);
    controllerRight = Engine.renderer.xr.getController(1);
    dolly.add(controllerLeft);
    dolly.add(controllerRight);
    // dolly.add(head);

    // obviously unfinished
    [controllerLeft, controllerRight].forEach((controller) => {
/*
      controller.addEventListener('select', (ev) => {})
      controller.addEventListener('selectstart', (ev) => {})
      controller.addEventListener('selectend', (ev) => {})
      controller.addEventListener('squeeze', (ev) => {})
      controller.addEventListener('squeezestart', (ev) => {})
      controller.addEventListener('squeezeend', (ev) => {})
*/
      controller.addEventListener('connected', (ev) => {
        if(controller.targetRay) {
          controller.targetRay.visible = true;
        } else {
          const targetRay = createController(ev.data);
          controller.add(targetRay);
          controller.targetRay = targetRay;
        }
      })

      controller.addEventListener('disconnected', (ev) => {
        controller.targetRay.visible = false;
      })

    })

    controllerGripLeft = Engine.renderer.xr.getControllerGrip(0);
    controllerGripRight = Engine.renderer.xr.getControllerGrip(1);

    addComponent(Network.instance.localClientEntity, XRInputReceiver, {
      head: head,
      controllerLeft: controllerLeft,
      controllerRight: controllerRight,
      controllerGripLeft: controllerGripLeft,
      controllerGripRight: controllerGripRight
    })

    console.log(getComponent(Network.instance.localClientEntity, XRInputReceiver));

    const obj: any = await new Promise((resolve) => { getLoader().load('/models/webxr/controllers/valve_controller_knu_1_0_right.glb', obj => { resolve(obj) }, console.warn, console.error)});
    const controller3DModel = obj.scene.children[2] as any;

    const controllerMeshRight = controller3DModel.clone();
    const controllerMeshLeft = controller3DModel.clone();

    controllerMeshLeft.scale.multiply(new Vector3(-1, 1, 1));

    controllerMeshRight.material = new MeshPhongMaterial();
    controllerMeshLeft.material = new MeshPhongMaterial();

    controllerMeshRight.position.z = -0.12;
    controllerMeshLeft.position.z = -0.12;

    controllerGripRight.add(controllerMeshRight);
    controllerGripLeft.add(controllerMeshLeft);

    dolly.add(controllerGripRight);
    dolly.add(controllerGripLeft);

    console.log('Loaded Model Controllers Done');

    return true;
  } catch (e) {
    console.error('Could not create VR session', e)
    return false;
  }
}

export const endXR = () => {
  removeComponent(Network.instance.localClientEntity, XRInputReceiver);
  const cameraFollow = getMutableComponent<FollowCameraComponent>(Network.instance.localClientEntity, FollowCameraComponent) as FollowCameraComponent;
  cameraFollow.mode = CameraModes.ThirdPerson;
  Engine.xrSession.end();
  Engine.xrSession = null;
  // Engine.renderer.setAnimationLoop(null);
  const actor = getComponent(Network.instance.localClientEntity, CharacterComponent);
  actor.tiltContainer.remove(XRSystem.instance.cameraDolly);
  Engine.scene.add(Engine.camera);
  stopIK(Network.instance.localClientEntity)
  initializeMovingState(Network.instance.localClientEntity)
}

// pointer taken from https://github.com/mrdoob/three.js/blob/master/examples/webxr_vr_ballshooter.html
const createController = (data) => {
  let geometry, material;
  switch ( data.targetRayMode ) {
    case 'tracked-pointer':
      geometry = new BufferGeometry();
      geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
      geometry.setAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
      geometry.setAttribute( 'alpha', new Float32BufferAttribute( [1, 0 ], 1 ) );
      material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
      return new Line( geometry, material );

    case 'gaze':
      geometry = new RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
      material = new MeshBasicMaterial( { opacity: 0.5, transparent: true } );
      return new Mesh( geometry, material );
  }
};
