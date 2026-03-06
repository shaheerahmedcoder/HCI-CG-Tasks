import * as THREE from "three";

export function setCamera(width, height) {

    const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
    );

    camera.position.z = 5;

    return camera;
}