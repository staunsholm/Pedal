<template>
    <div>
        <Landscape :scene="scene" ref="Landscape"/>
        <Players :scene="scene" ref="Players"/>
    </div>
</template>

<script>
    import _ from 'lodash';
    import * as THREE from 'three';
    import Landscape from '../Landscape/Landscape';
    import Players from '../Players/Players';

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

        const refs = _.filter(this.$refs, ref => ref.animate);
        _.forEach(refs, (ref) => {
            ref.animate(dt);
        });

        renderer.render(scene, camera);
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
    camera.position.z = 1500;

    scene = new THREE.Scene();

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

        created() {
            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
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
