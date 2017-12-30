<script>
    import * as THREE from 'three';
    import { sensorsEmitter } from 'sensors';

    let pedalsMesh;
    let wheel1Mesh;
    let wheel2Mesh;
    let bike;

    let speed = 0;
    let targetSpeed = 0;
    let acceleration = 0;
    let rpm = 0;

    const wheelRadius = 315; // in mm

    function updateSpeed(sensors) {
        targetSpeed = sensors.targetSpeed;
        rpm = sensors.rpm;
        acceleration = sensors.acceleration;
    }

    export default {
        name: 'World',

        props: [
            'scene',
        ],

        data() {
            return {
                targetSpeed,
                rpm,
                acceleration,
            };
        },

        methods: {
            animate(dt) {
                speed += acceleration * dt;
                if (speed > targetSpeed) {
                    speed = targetSpeed;
                }

                const cadenceRotation = rpm * dt * 2 * Math.PI / (60 * 1000);
                const c = wheelRadius * 2 * Math.PI / 1000;
                const speedRotation = (speed / c) * 2 * Math.PI * dt / 1000; // TODO: optimise
                pedalsMesh.rotation.y -= cadenceRotation;
                wheel1Mesh.rotation.y -= speedRotation;
                wheel2Mesh.rotation.y -= speedRotation;
                bike.position.x += speed * dt;
                if (bike.position.x > 4500) {
                    bike.position.x = -4500;
                }
            },
        },

        created() {
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

            this.scene.add(bike);
        },

        mounted() {
            sensorsEmitter.on('update', updateSpeed.bind(this));
        },

        destroyed() {
            sensorsEmitter.removeListener('update', updateSpeed);
        },

        render() {
        },
    };
</script>
