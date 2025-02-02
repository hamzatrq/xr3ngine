import { Sky } from '../../scene/classes/Sky';
import { CubeTextureLoader, EquirectangularReflectionMapping, PMREMGenerator, sRGBEncoding, TextureLoader, Vector3 } from 'three';
import { isClient } from '../../common/functions/isClient';
import { Engine } from '../../ecs/classes/Engine';
import { addComponent, getComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions';
import { ScaleComponent } from '../../transform/components/ScaleComponent';
import { Object3DComponent } from '../components/Object3DComponent';
import { addObject3DComponent } from './addObject3DComponent';

export default function createSkybox(entity, args: {
  obj3d;
  objArgs: any
}): void {
  
  if (!isClient) {
    return;
  }
  
  console.log(args);
  console.log(entity);
  
  
  const renderer = Engine.renderer

  const pmremGenerator = new PMREMGenerator(renderer);

  args.objArgs.skytype = "cubemap";
  args.objArgs.texture = "cubemap/"
  const negx = "/cubemap/negx.jpg";
  const negy = "/cubemap/negy.jpg";
  const negz = "/cubemap/negz.jpg";
  const posx = "/cubemap/posx.jpg";
  const posy = "/cubemap/posy.jpg";
  const posz = "/cubemap/posz.jpg";
  
  if (args.objArgs.skytype === "cubemap") {
  
    
    Engine.scene.background = new CubeTextureLoader()
      // .setPath(args.objArgs.texture)
      .load([posx, negx, posy, negy, posz, negz],
      (texture) => {

        console.log(texture);
        
       const EnvMap = pmremGenerator.fromCubemap(texture).texture;

       console.log(EnvMap);
        
       Engine.scene.background = EnvMap;
       Engine.scene.environment = EnvMap;

       texture.dispose();
       pmremGenerator.dispose();
      },
      (res)=> {
        console.log(res);
      },
      (erro) => {
        console.log(erro);
      }
      );
  }
  else if (args.objArgs.skytype === "equirectangular") {
    new TextureLoader().load(args.objArgs.texture, (texture) => {

      const EnvMap = pmremGenerator.fromEquirectangular(texture).texture;

      Engine.scene.background = EnvMap;
      Engine.scene.environment = EnvMap;

      Engine.scene.background.encoding = sRGBEncoding;
      Engine.scene.background.mapping = EquirectangularReflectionMapping;

      texture.dispose();
      pmremGenerator.dispose();
    });
  }
  else {
    addObject3DComponent(entity, { obj3d: Sky, objArgs: args.objArgs });
    addComponent(entity, ScaleComponent);

    const component = getComponent(entity, Object3DComponent);
    const skyboxObject3D = component.value;
    const scaleComponent = getMutableComponent<ScaleComponent>(entity, ScaleComponent);
    scaleComponent.scale = [args.objArgs.distance, args.objArgs.distance, args.objArgs.distance];
    const uniforms = Sky.material.uniforms;
    const sun = new Vector3();
    const theta = Math.PI * (args.objArgs.inclination - 0.5);
    const phi = 2 * Math.PI * (args.objArgs.azimuth - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);
    uniforms.mieCoefficient.value = args.objArgs.mieCoefficient;
    uniforms.mieDirectionalG.value = args.objArgs.mieDirectionalG;
    uniforms.rayleigh.value = args.objArgs.rayleigh;
    uniforms.turbidity.value = args.objArgs.turbidity;
    uniforms.sunPosition.value = sun;
    Engine.csm && Engine.csm.lightDirection.set(-sun.x, -sun.y, -sun.z);

    const skyboxTexture = (skyboxObject3D as any).generateEnvironmentMap(renderer);

    Engine.scene.background = skyboxTexture;
    Engine.scene.environment = skyboxTexture;
  }
}
