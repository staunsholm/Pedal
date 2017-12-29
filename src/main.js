// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import * as log from 'loglevel';
import store from './store';
import GameScreen from './GameScreen';

log.enableAll();
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
    el: '#app',
    store,
    template: '<GameScreen/>',
    components: { GameScreen },
});
