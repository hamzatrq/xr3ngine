import { Behavior } from '../../common/interfaces/Behavior';
import { Entity } from '../../ecs/classes/Entity';
import { addComponent, removeComponent } from '../../ecs/functions/EntityFunctions';
import { RigidBody } from '../components/RigidBody';

/**
 * @author HydraFire <github.com/HydraFire>
 */

export const addMeshRigidBody: Behavior = (entity: Entity, args: any) => {
  addComponent(entity, RigidBody, args);
  return entity;
};
