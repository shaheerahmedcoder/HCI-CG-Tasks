import * as THREE from "three";
import { useEffect, useRef } from "react";

const base = import.meta.env.BASE_URL;

// Camera factory
function setCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
    );
    camera.position.z = 5;
    return camera;
}

function TexturedCube() {
    const mountRef = useRef(null);

    useEffect(() => {
        // Scene
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const scene = new THREE.Scene();

        // Camera
        //const camera = setCamera(width, height);
        const camera = setCamera(window.innerWidth, window.innerHeight);

        // Renderer
        //const renderer = new THREE.WebGLRenderer({ antialias: true });
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        //renderer.setSize(width, height);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0); // transparent canvas
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        mountRef.current.appendChild(renderer.domElement);

        // Load textures (one per cube face)
        const loader = new THREE.TextureLoader();
        // const texturePaths = [
        //     "/textures/right.jpg",   // +X
        //     "/textures/left.jpg",    // -X
        //     "/textures/back.jpg",     // +Y
        //     "/textures/bottom.jpg",  // -Y
        //     "/textures/front.jpg",   // +Z
        //     "/textures/top.jpg",    // -Z
        // ];

        const texturePaths = [
            `${base}textures/right.jpg`,   // +X
            `${base}textures/left.jpg`,    // -X
            `${base}textures/top.jpg`,     // +Y
            `${base}textures/bottom.jpg`,  // -Y
            `${base}textures/front.jpg`,   // +Z
            `${base}textures/back.jpg`,    // -Z
        ];

        // const materials = texturePaths.map((path) => {
        //     const texture = loader.load(path);
        //     texture.colorSpace = THREE.SRGBColorSpace;
        //     return new THREE.MeshBasicMaterial({ map: texture });
        // });

        const materials = texturePaths.map((path) => {
            const texture = loader.load(path, () => {
                texture.needsUpdate = true;
            });

            texture.colorSpace = THREE.SRGBColorSpace;

            return new THREE.MeshBasicMaterial({
                map: texture
            });
        });


        // Geometry
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            //cube.rotation.z += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            geometry.dispose();
            materials.forEach((m) => m.dispose());
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef}></div>;
    // return (
    //     <div
    //         ref={mountRef}
    //         style={{ width: "
    // 600px", height: "400px", margin: "40px auto" }}
    //     />
    // );
}

export default TexturedCube;