<template>
    <div id="app">
        <div id="world"></div>

        <div class="sensorsui">
            <SensorsUI/>
            {{ speed }} km/h<br>
            gear: {{ ratio }}<br>
        </div>

        <div class="devices">
            <button @click="findPowerDevices()">Power</button>
            <button @click="findHeartRateDevices()">Heart Rate</button>
            <button @click="findCadenceDevices()">Cadence</button>
        </div>

        <div class="playground">
            <Playground/>
        </div>
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
    let bike;
    let isAnimating = true;
    let oldt = performance.now();
    let speed = 0;
    let targetSpeed = 0;
    let acceleration = 0;
    let ratio = '-';
    const wheelRadius = 315; // in mm

    function animate() {
        if (!isAnimating) {
            return;
        }

        requestAnimationFrame(animate.bind(this));

        const t = performance.now();
        const dt = t - oldt;
        oldt = t;

        speed += acceleration * dt;
        if (speed > targetSpeed) {
            speed = targetSpeed;
        }

        this.speed = Math.round(speed * 3.6); // km/h

        const cadenceRotation = sensors.rpm * dt * 2 * Math.PI / (60 * 1000);
        const c = wheelRadius * 2 * Math.PI / 1000;
        const speedRotation = (speed / c) * 2 * Math.PI * dt / 1000; // TODO: optimise
        pedalsMesh.rotation.y -= cadenceRotation;
        wheel1Mesh.rotation.y -= speedRotation;
        wheel2Mesh.rotation.y -= speedRotation;
        bike.position.x += speed * dt;
        if (bike.position.x > 4500) {
            bike.position.x = -4500;
        }
        renderer.render(scene, camera);

        ratio = _.round(cadenceRotation / speedRotation, 2);
        this.ratio = `1:${ratio}`;
    }

    /* eslint-disable no-restricted-properties, no-param-reassign */
    function cuberoot(x) {
        const y = Math.pow(Math.abs(x), 1 / 3);
        return x < 0 ? -y : y;
    }

    // TODO: get rid of epsilon. Maybe optimise using lookup? Needs test cases
    function solveCubic(a, b, c, d) {
        const epsilon = 1e-6;
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

        const roots = solveCubic(
            airPenetration,
            2 * airPenetration * headwindAtRoad,
            airPenetration * headwindAtRoad ** 2 + W * G * (slope / 100.0 + f),
            -power,
        );
        const calculatedSpeed = roots[0];

        // we don't want to ride backwards
        return calculatedSpeed > 0 ? calculatedSpeed : 0;
    }

    function getAcceleration({ power, totalMass, wheelWeight }) {
        const c = wheelRadius * 2 * Math.PI / 1000;
        const angularVelocity = (speed / c) * 2 * Math.PI;

        if (angularVelocity === 0) {
            return 0.001;
        }

        const torque = power / angularVelocity;
        const wheelInertia = wheelWeight * wheelRadius ** 2;
        return torque / (wheelRadius * totalMass + 2 * wheelInertia / wheelRadius);
    }

    function updateSpeed() {
        const power = 300;

        targetSpeed = getSpeedInMetersPerSecond({
            power,
            Cx: 0.25,
            f: 0.01,
            W: 80,
            slope: 0,
            headwind: 0,
            elevation: 0,
        });

        acceleration = getAcceleration({
            power,
            totalMass: 80,
            wheelWeight: 1,
        });

        console.log(acceleration);
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
                ratio,
            };
        },

        methods: {
            findPowerDevices,
            findHeartRateDevices,
            findCadenceDevices,
        },

        created() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
            camera.position.z = 1500;

            scene = new THREE.Scene();
            const texture = new THREE.TextureLoader().load('src/textures/crate.gif');
            const material = new THREE.MeshBasicMaterial({ map: texture });

            bike = new THREE.Object3D();

            const pedalsGeometry = new THREE.CylinderBufferGeometry(65, 65, 1.5, 50, 1);
            pedalsMesh = new THREE.Mesh(pedalsGeometry, material);
            pedalsMesh.rotation.x = Math.PI / 2;
            pedalsMesh.position.y = -80;
            bike.add(pedalsMesh);

            const wheel1Geometry = new THREE.CylinderBufferGeometry(wheelRadius, wheelRadius, 2.8, 50, 1);
            wheel1Mesh = new THREE.Mesh(wheel1Geometry, material);
            wheel1Mesh.position.x = -500;
            wheel1Mesh.rotation.x = Math.PI / 2;
            bike.add(wheel1Mesh);

            const wheel2Geometry = new THREE.CylinderBufferGeometry(wheelRadius, wheelRadius, 2.8, 50, 1);
            wheel2Mesh = new THREE.Mesh(wheel2Geometry, material);
            wheel2Mesh.position.x = 500;
            wheel2Mesh.rotation.x = Math.PI / 2;
            bike.add(wheel2Mesh);

            scene.add(bike);

            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
        },

        mounted() {
            this.$el.appendChild(renderer.domElement);
            isAnimating = true;
            animate.bind(this)();

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
    body {
        margin: 0;
    }

    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #eee;
    }

    #world {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .sensorsui {
        position: absolute;
        top: 30px;
        left: 20px;
        width: 200px;
    }

    .playground {
        position: absolute;
        top: 30px;
        right: 20px;
        width: 200px;
        height: 200px;
    }

    .devices {
        position: absolute;
        bottom: 30px;
        width: 100%;
        text-align: center;
    }
</style>
