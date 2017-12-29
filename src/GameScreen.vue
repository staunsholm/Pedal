<template>
    <div id="app">
        <SensorsUI/>

        <button @click="findPowerDevices()">Power</button>
        <button @click="findHeartRateDevices()">Heart Rate</button>
        <button @click="findCadenceDevices()">Cadence</button>

        <div>{{ speed }}</div>
        km/h<br>

        <Playground/>
    </div>
</template>

<script>
    import _ from 'lodash';
    import * as THREE from 'three';

    import {
        sensors,
        sensorsEmitter,
        findPowerDevices,
        findHeartRateDevices,
        findCadenceDevices,
    } from 'sensors';

    import SensorsUI from './components/SensorsUI/SensorsUI';
    import Playground from './components/Playground/Playground';

    let camera;
    let scene;
    let renderer;
    let pedalsMesh;
    let wheel1Mesh;
    let wheel2Mesh;
    let isAnimating = true;
    let oldt = performance.now();
    let speed = 0;

    function animate() {
        if (!isAnimating) {
            return;
        }

        requestAnimationFrame(animate);

        const t = performance.now();
        const dt = t - oldt;
        oldt = t;

        const cadenceRotation = sensors.rpm * dt * 2 * Math.PI / (60 * 1000);
        const speedRotation = speed * dt * 2 * Math.PI / 1000;
        pedalsMesh.rotation.y -= cadenceRotation;
        wheel1Mesh.rotation.y -= speedRotation;
        wheel2Mesh.rotation.y -= speedRotation;
        renderer.render(scene, camera);
    }

    /* eslint-disable no-restricted-properties, no-param-reassign */
    function cuberoot(x) {
        const y = Math.pow(Math.abs(x), 1 / 3);
        return x < 0 ? -y : y;
    }

    function solveCubic(a, b, c, d) {
        const epsilon = 1e-8;
        if (Math.abs(a) < epsilon) {
            // Quadratic case, ax^2+bx+c=0
            a = b;
            b = c;
            c = d;
            if (Math.abs(a) < epsilon) {
                // Linear case, ax+b=0
                a = b;
                b = c;
                // Degenerate case
                if (Math.abs(a) < epsilon) {
                    return [];
                }
                return [-b / a];
            }

            const D = b * b - 4 * a * c;
            if (Math.abs(D) < epsilon) {
                return [-b / (2 * a)];
            }
            if (D > 0) {
                return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
            }
            return [];
        }

        // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
        const p = (3 * a * c - b * b) / (3 * a * a);
        const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
        let roots;

        if (Math.abs(p) < epsilon) {
            // p = 0 -> t^3 = -q -> t = -q^1/3
            roots = [cuberoot(-q)];
        } else if (Math.abs(q) < epsilon) {
            // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
            roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
        } else {
            const D = q * q / 4 + p * p * p / 27;
            if (Math.abs(D) < 1e-8) {
                // D = 0 -> two roots
                roots = [-1.5 * q / p, 3 * q / p];
            } else if (D > 0) {
                // Only one real root
                const u = cuberoot(-q / 2 - Math.sqrt(D));
                roots = [u - p / (3 * u)];
            } else {
                // D < 0, three roots, but needs to use complex numbers/trigonometric solution
                // D < 0 implies p < 0 and acos argument in [-1..1]
                const u = 2 * Math.sqrt(-p / 3);
                const t = Math.acos(3 * q / p / u) / 3;
                const k = 2 * Math.PI / 3;
                roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
            }
        }

        // Convert back from depressed cubic
        for (let i = 0; i < roots.length; i += 1) {
            roots[i] -= b / (3 * a);
        }

        return roots;
    }
    /* eslint-enable */

    /**
     *
     * @param power watts
     * @param Cx air penetration
     * @param f road friction
     * @param W cyclist weight
     * @param slope in percent
     * @param headwind in m/s at 10m high
     * @param elevation in meters
     * @returns speed in m/s
     */
    function getSpeedInMetersPerSecond({ power, Cx, f, W, slope, headwind, elevation }) {
        const airPressure = 1 - 0.000104 * elevation;
        const airPenetration = Cx * airPressure;
        const G = 9.81;
        const headwindAtRoad = (0.1 ** 0.143) * headwind;

        let roots = solveCubic(
            airPenetration * headwindAtRoad ** 2 + W * G * (slope / 100.0 + f),
            2 * airPenetration * headwindAtRoad,
            airPenetration,
            -power,
        );
        let calculatedSpeed = _.min(roots);
        if (calculatedSpeed + headwind < 0) {
            roots = solveCubic(
                -airPenetration * headwindAtRoad ** 2 + W * G * (slope / 100.0 + f),
                -2 * airPenetration * headwindAtRoad,
                -airPenetration,
                -power,
            );
            if (roots.length > 0) {
                calculatedSpeed = _.min(roots);
            }
        }

        return calculatedSpeed || 0;
    }

    function updateSpeed() {
        speed = getSpeedInMetersPerSecond({
            power: 400,
            Cx: 0.25,
            f: 0.01,
            W: 80,
            slope: 0,
            headwind: 0,
            elevation: 0,
        });

        this.speed = speed * 10.256; // km/h
    }

    export default {
        name: 'GameScreen',

        components: {
            SensorsUI,
            Playground,
        },

        data() {
            return {
                speed,
            };
        },

        methods: {
            findPowerDevices,
            findHeartRateDevices,
            findCadenceDevices,
        },

        created() {
            const width = 200;
            const height = 200;

            camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
            camera.position.z = 1500;

            scene = new THREE.Scene();
            const texture = new THREE.TextureLoader().load('src/textures/crate.gif');
            const material = new THREE.MeshBasicMaterial({ map: texture });

            const pedalsGeometry = new THREE.CylinderBufferGeometry(65, 65, 1.5, 50, 1);
            pedalsMesh = new THREE.Mesh(pedalsGeometry, material);
            pedalsMesh.rotation.x = Math.PI / 2;
            pedalsMesh.position.y = -80;
            scene.add(pedalsMesh);

            const wheel1Geometry = new THREE.CylinderBufferGeometry(315, 315, 2.8, 50, 1);
            wheel1Mesh = new THREE.Mesh(wheel1Geometry, material);
            wheel1Mesh.position.x = -500;
            wheel1Mesh.rotation.x = Math.PI / 2;
            scene.add(wheel1Mesh);

            const wheel2Geometry = new THREE.CylinderBufferGeometry(315, 315, 2.8, 50, 1);
            wheel2Mesh = new THREE.Mesh(wheel2Geometry, material);
            wheel2Mesh.position.x = 500;
            wheel2Mesh.rotation.x = Math.PI / 2;
            scene.add(wheel2Mesh);

            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
        },

        mounted() {
            this.$el.appendChild(renderer.domElement);
            isAnimating = true;
            animate();

            sensorsEmitter.on('update', updateSpeed.bind(this));
        },

        destroyed() {
            this.$el.removeChild(renderer.domElement);
            isAnimating = false;

            sensorsEmitter.removeListener('update', updateSpeed);
        },
    };
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
