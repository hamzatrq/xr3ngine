import { disallow } from 'feathers-hooks-common';

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [disallow('external')],
    update: [disallow()],
    patch: [],
    remove: [disallow('external')]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
