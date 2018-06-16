import { merge } from 'lodash';

export const INITIAL_MOVEMENT = [0.1,-0.1];

const basicConfig = {
  weight: true,
  weightFrom: 'data-weight',
  weightMode: 'both',
  weightSize: 10,
  weightGradient: {
    0: '#b11743',
    0.5: '#febd2e',
    1: '#90fefb'
  },
  outlineColour: 'transparent',
  textFont: 'Raleway',
  fadeIn: 800,
  dragControl: true
};

export const DEFAULT_CONFIG = merge({}, basicConfig, {
  shape: 'sphere',
  minSpeed: 0.005,
  initial: INITIAL_MOVEMENT
});

const V_RING_CONFIG = merge({}, basicConfig, {
  shape: 'vring(0.5)',
  lock: 'y',
  minSpeed: 0.05,
  initial: [-0.2, 0]
});

const H_RING_CONFIG = merge({}, basicConfig, {
  shape: 'hring',
  lock: 'x',
  minSpeed: 0.05,
  initial: [0, -0.2]
});

const specialConfigs = [V_RING_CONFIG, H_RING_CONFIG];
let index = -1;

export const getNextSpecialConfig = () => {
  index = (index + 1) % specialConfigs.length;
  return specialConfigs[index];
};
