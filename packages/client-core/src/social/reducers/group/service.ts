import { Config } from '../../../helper';
import { Dispatch } from 'redux';
import { dispatchAlertError } from '../../../common/reducers/alert/service';
import { client } from '../../../feathers';
import store from '../../../store';
import {
  createdGroup,
  createdGroupUser,
  fetchingGroups,
  fetchingInvitableGroups,
  loadedGroups,
  loadedInvitableGroups,
  patchedGroup,
  patchedGroupUser,
  removedGroup,
  removedGroupUser
} from './actions';

export function getGroups(skip?: number, limit?: number) {
  return async (dispatch: Dispatch, getState: any): Promise<any> => {
    dispatch(fetchingGroups());
    try {
      const groupResults = await client.service('group').find({
        query: {
          $limit: limit != null ? limit : getState().get('groups').get('groups').get('limit'),
          $skip: skip != null ? skip : getState().get('groups').get('groups').get('skip'),
        }
      });
      dispatch(loadedGroups(groupResults));
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function createGroup(values: any) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      await client.service('group').create({
        name: values.name,
        description: values.description
      });
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function patchGroup(values: any) {
  return async (dispatch: Dispatch): Promise<any> => {
    const patch = {};
    if (values.name != null) {
      (patch as any).name = values.name;
    }
    if (values.description != null) {
      (patch as any).description = values.description;
    }
    try {
      await client.service('group').patch(values.id, patch);
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function removeGroup(groupId: string) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      const channelResult = await client.service('channel').find({
        query: {
          groupId: groupId
        }
      }) as any;
      if (channelResult.total > 0) {
        await client.service('channel').remove(channelResult.data[0].id);
      }
      await client.service('group').remove(groupId);
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function removeGroupUser(groupUserId: string) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      await client.service('group-user').remove(groupUserId);
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function getInvitableGroups(skip?: number, limit?: number) {
  return async (dispatch: Dispatch, getState: any): Promise<any> => {
    dispatch(fetchingInvitableGroups());
    try {
      const groupResults = await client.service('group').find({
        query: {
          invitable: true,
          $limit: limit != null ? limit : getState().get('groups').get('groups').get('limit'),
          $skip: skip != null ? skip : getState().get('groups').get('groups').get('skip'),
        }
      });
      dispatch(loadedInvitableGroups(groupResults));
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
      dispatch(loadedInvitableGroups({ data: [], limit: 0, skip: 0, total: 0 }));
    }
  };
}
if(!Config.publicRuntimeConfig.offlineMode) {
  client.service('group-user').on('created', (params) => {
    store.dispatch(createdGroupUser(params.groupUser));
  });

  client.service('group-user').on('patched', (params) => {
    store.dispatch(patchedGroupUser(params.groupUser));
  });

  client.service('group-user').on('removed', (params) => {
    store.dispatch(removedGroupUser(params.groupUser, params.self));
  });

  client.service('group').on('created', (params) => {
    store.dispatch(createdGroup(params.group));
  });

  client.service('group').on('patched', (params) => {
    store.dispatch(patchedGroup(params.group));
  });

  client.service('group').on('removed', (params) => {
    store.dispatch(removedGroup(params.group));
  });

  client.service('group').on('refresh', (params) => {
    store.dispatch(createdGroup(params.group));
  });
}