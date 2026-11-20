import { store } from './storage.js';
import { KEYS } from './config.js';

// One shared object so every module reads the same data.
export const S = {
  token: store.get(KEYS.token) || '',
  area: store.get(KEYS.area),
  areaData: null,
  stage: null,
  weather: null,
  selStage: null
};
