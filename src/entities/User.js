import { base44 } from '@/api/base44Client';
import { createEntity } from './_entity.js';

const _userEntity = createEntity('User');

export const User = new Proxy(_userEntity, {
  get(target, prop) {
    if (prop === 'me')                                    return base44.auth.me.bind(base44.auth);
    if (prop === 'loginWithRedirect' || prop === 'login') return base44.auth.loginWithRedirect.bind(base44.auth);
    if (prop === 'logout')                               return base44.auth.logout.bind(base44.auth);
    if (prop === 'updateMyUserData')                     return base44.auth.updateMe.bind(base44.auth);
    return target[prop];
  }
});
