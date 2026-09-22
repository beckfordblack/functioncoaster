import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

let scene, camera, renderer, canvas, monkey, dx, dy;

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(
        45,
        GAME_WIDTH/GAME_HEIGHT,
        0.1,
        1000
    );
    camera.position.z = 50;
    
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
    canvas = renderer.domElement;   
    document.body.appendChild(canvas);

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
    
    dx = 0;
    dy = 0;
}

function animate() {
    requestAnimationFrame(animate);

    if (monkey) {
        monkey.position.x += dx;
        monkey.position.y += dy;
    }

    dx *= 0.9;
    dy *= 0.9;
    
    renderer.render(scene, camera);
}

function resizeCanvas() {
    const x = innerWidth / GAME_WIDTH;
    const y = innerHeight / GAME_HEIGHT;
    canvas.style.scale = `${Math.min(x, y)}`;
}

window.addEventListener("resize", resizeCanvas);

init();
resizeCanvas();

let dragging = false;
let previousX = 0;
let previousY = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children);
    if (hits.length === 0) return;
    if (hits[0].object) {
        dragging = true;
        previousX = e.clientX;
        previousY = e.clientY;
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (!dragging || !monkey) return;
    const dx = e.clientX - previousX;
    const dy = e.clientY - previousY;
});

canvas.addEventListener("pointerup", (e) => {
    dragging = false;
    dx = -(e.clientX - previousX) / 100;
    dy = (e.clientY - previousY) / 100;
});

canvas.addEventListener("pointerleave", (e) => {
    dragging = false;
});

animate();
