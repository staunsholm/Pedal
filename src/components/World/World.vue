<template>
    <div>
        <Landscape :scene="scene" ref="animate"/>
        <Players :scene="scene" ref="animate"/>
    </div>
</template>

<script>
    import _ from 'lodash';
    import * as THREE from 'three';
    import Landscape from '../Landscape/Landscape';
    import Players from '../Players/Players';
    import getCamera from './Camera';

    let camera;
    let renderer;
    let scene;

    let isAnimating = true;
    let oldt = performance.now();

    function animate() {
        if (!isAnimating) {
            return;
        }

        requestAnimationFrame(animate.bind(this));

        const t = performance.now();
        const dt = t - oldt;
        oldt = t;

        // call animate() method on each of the components that have a ref
        const refs = _.filter(this.$refs, ref => ref.animate);
        _.forEach(refs, (ref) => {
            ref.animate(dt);
        });

        renderer.render(scene, camera);
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera = getCamera(width, height);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    export default {
        name: 'World',

        components: {
            Landscape,
            Players,
        },

        data() {
            return {
                scene,
            };
        },

        mounted() {
            this.$el.appendChild(renderer.domElement);
            isAnimating = true;
            animate.bind(this)();
        },

        destroyed() {
            this.$el.removeChild(renderer.domElement);
            isAnimating = false;
        },
    };
</script>

<style scoped>
</style>
