import * as THREE from 'three';

export default function getCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
    camera.position.z = 1500;

    return camera;
}
