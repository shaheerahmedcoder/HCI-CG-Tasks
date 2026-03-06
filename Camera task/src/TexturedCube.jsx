import * as THREE from "three";
import { useEffect, useRef } from "react";
import { setCamera } from "./Camera";

const base = import.meta.env.BASE_URL;

function TexturedCube() {

    const mountRef = useRef(null);

    useEffect(() => {

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

            const camera = setCamera(window.innerWidth, window.innerHeight);

        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.setClearColor(0x000000, 0);

        renderer.outputColorSpace = THREE.SRGBColorSpace;

        mountRef.current.appendChild(renderer.domElement);

        const loader = new THREE.TextureLoader();

        const texturePaths = [
            `${base}textures/right.jpg`,
            `${base}textures/left.jpg`,
            `${base}textures/top.jpg`,
            `${base}textures/bottom.jpg`,
            `${base}textures/front.jpg`,
            `${base}textures/back.jpg`,
        ];

        const materials = texturePaths.map((path) => {

            const texture = loader.load(path, () => {
                texture.needsUpdate = true;
            });

            texture.colorSpace = THREE.SRGBColorSpace;

            return new THREE.MeshBasicMaterial({
                map: texture
            });

        });

        const geometry = new THREE.BoxGeometry(3, 3, 3);

        const cube = new THREE.Mesh(geometry, materials);

        scene.add(cube);

        const animate = () => {

            requestAnimationFrame(animate);

            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            renderer.render(scene, camera);

        };

        animate();

        return () => {

            geometry.dispose();
            materials.forEach((m) => m.dispose());
            renderer.dispose();

        };

    }, []);

    return <div ref={mountRef}></div>;
}

export default TexturedCube;