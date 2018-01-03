import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';
import sensors from '@/services/Sensors/store';
import * as actions from './actions';
import * as getters from './getters';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    actions,
    getters,
    modules: {
        sensors,
    },
    strict: debug,
    plugins: debug ? [createLogger()] : [],
});
