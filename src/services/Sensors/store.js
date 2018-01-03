import { UPDATE_SENSORS } from './types';

const state = {
    rpm: 0,
    targetSpeed: 0,
    acceleration: 0,
    ratio: '-',
    bpm: 0,
    watts: 0,
};

const getters = {
    targetSpeed: () => state.targetSpeed,
    rpm: () => state.rpm,
    acceleration: () => state.acceleration,
    ratio: () => state.ratio,
    bpm: () => state.bpm,
    watts: () => state.watts,
};

const mutations = {
    [UPDATE_SENSORS](state, sensors) {
        state.targetSpeed = sensors.targetSpeed;
        state.rpm = sensors.rpm;
        state.acceleration = sensors.acceleration;
        state.ratio = sensors.ratio;
        state.bpm = sensors.bpm;
        state.watts = sensors.watts;
    },
};

const actions = {
    [UPDATE_SENSORS]({ commit, state }, sensors) {
        commit(UPDATE_SENSORS, sensors);
    },
};

export default {
    state,
    getters,
    mutations,
    actions,
};
