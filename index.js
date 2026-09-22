import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

let scene, camera, renderer, monkey;

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(
        45,
        GAME_WIDTH/GAME_HEIGHT,
        0.1,
        1000
    );
    
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    
    renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
    
    document.body.appendChild(renderer.domElement);

    const loader = new GLTFLoader();

    loader.load("monkey.glb", (gltf) => {
        gltf.scene.traverse((object) => {
            if (object.isMesh) {
                object.material = new THREE.MeshNormalMaterial();
                monkey = object;
            }
        })
        scene.add(gltf.scene);
    });
    
    camera.position.z = 6;
}

function animate() {
    requestAnimationFrame(animate);
    
    renderer.render(scene, camera);
}

function resizeCanvas() {
    const x = innerWidth / GAME_WIDTH;
    const y = innerHeight / GAME_HEIGHT;
    renderer.domElement.style.scale = `${Math.min(x, y)}`;
}

window.addEventListener("resize", resizeCanvas);

init();
resizeCanvas();

let dragging = false;
let previousX = 0;
let previousY = 0;

renderer.domElement.addEventListener("pointerdown", (e) => {
    dragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
});

renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging || !monkey) return;
    const dx = e.clientX - previousX;
    const dy = e.clientY - previousY;
    monkey.rotation.y += dx * 0.01;
    monkey.rotation.x += dy * 0.01;
    previousX = e.clientX;
    previousY = e.clientY;
});

renderer.domElement.addEventListener("pointerup", (e) => {
    dragging = false;
});

renderer.domElement.addEventListener("pointerleave", (e) => {
    dragging = false;
});

animate();
