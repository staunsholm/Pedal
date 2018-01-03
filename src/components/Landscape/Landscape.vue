<script>
    import * as THREE from 'three';

    export default {
        props: [
            'scene',
            'stage',
        ],

        methods: {
            animate() {
            },

            created() {
                this.stage = {
                    road: [
                        // x, y, z, road width
                        0, 0, 0, 10,
                        1000, 0, 0, 10,
                        1000, 1000, 0, 10,
                        0, 1000, 0, 10,
                    ],
                };

                // ground plane
                const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

                // geometry for road
                const road = THREE.Object3D();

                // textures

                // lights

                this.scene.add(ground);
                this.scene.add(road);
            },
        },

        render() {
        },
    };
</script>
