import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const response = await fetch("course.json");
const course = await response.json();

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

function resizeCanvas() {
    const x = innerWidth / GAME_WIDTH;
    const y = innerHeight / GAME_HEIGHT;
    canvas.style.scale = `${Math.min(x, y)}`;
}

let scene, camera, renderer, canvas, monkey;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    
    camera = new THREE.PerspectiveCamera(
        35,
        GAME_WIDTH/GAME_HEIGHT,
        0.1,
        1000
    );
    camera.position.set(3.5, 6, 25);
    
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
                object.material = new THREE.MeshNormalMaterial()
                monkey = object;
                monkey.position.z = 2;
                monkey.position.x = 2;
                monkey.position.y = 2;
                monkey.scale.setScalar(0.3);
            }
        })
        scene.add(gltf.scene);
    });
}

const walls = [];

function createWalls(grid) {
    const walls = [];

    const h = grid.length;
    const w = grid[0].length;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y][x] !== 1) continue;

            // 上
            if (y === 0 || grid[y - 1][x] === 0) {
                walls.push([
                    [x, y],
                    [x + 1, y]
                ]);
            }

            // 下
            if (y === h - 1 || grid[y + 1][x] === 0) {
                walls.push([
                    [x, y + 1],
                    [x + 1, y + 1]
                ]);
            }

            // 左
            if (x === 0 || grid[y][x - 1] === 0) {
                walls.push([
                    [x, y],
                    [x, y + 1]
                ]);
            }

            // 右
            if (x === w - 1 || grid[y][x + 1] === 0) {
                walls.push([
                    [x + 1, y],
                    [x + 1, y + 1]
                ]);
            }
        }
    }

    return walls;
}

const walls = createWalls(grid);

function movePlayer(dx, dy) {
    const start = {
        x: monkey.position.x,
        y: monkey.position.y
    };
    const end = {
        x: start.x + dx,
        y: start.y + dy
    };
    const hit = findCollision(start, end, PLAYER_RADIUS);
    if (hit) {
        monkey.position.x = hit.x;
        monkey.position.y = hit.y;
    }
    else {
        monkey.position.x = end.x;
        monkey.position.y = end.y;
    }
}

function findCollision(start, end, radius) {
    let nearest = null;
    let nearestT = Infinity;
    for (const wall of walls) {
        const hit = sweepCircle(
            start,
            end,
            radius,
            wall.a,
            wall.b
        );
        if (hit && hit.t < nearestT) {
            nearestT = hit.t;
            nearest = hit;
        }
    }
    return nearest;
}

function sweepCircle(start, end, radius, a, b) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len = Math.hypot(vx, vy);
    if (len === 0) return null;
    const nx = -vy / len;
    const ny = vx / len;
    const sx = start.x - a.x;
    const sy = start.y - a.y;
    const ex = end.x - a.x;
    const ey = end.y - a.y;
    const startDist = sx * nx + sy * ny;
    const endDist = ex * nx + ey * ny;
    if (Math.abs(startDist) <= radius) {
        return {
            x: start.x,
            y: start.y,
            t: 0
        };
    }
    if (
        (startDist > radius && endDist > radius) ||
        (startDist < -radius && endDist < -radius)
    ) {
        return null;
    }
    const target =
        startDist > 0 ? radius : -radius;
    const denom = endDist - startDist;
    if (denom === 0) return null;
    const t = (target - startDist) / denom;
    if (t < 0 || t > 1) return null;
    const x = start.x + dx * t;
    const y = start.y + dy * t;
    const px = x - a.x;
    const py = y - a.y;
    const u = (px * vx + py * vy) / (len * len);
    if (u < 0 || u > 1) {
        return null;
    }
    return {
        x,
        y,
        t
    };
}

function animate() {
    requestAnimationFrame(animate);
    
    if (moving) {
        if (monkey) {
            movePlayer(dx, dy)
            monkey.rotation.y += dx;
        }
    
        dx *= 0.99;
        dy *= 0.99;
        
        dy -= 0.01;

        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            // moving = false;
        }
    }

    renderer.render(scene, camera);
}

function marchingSquares(grid) {
    const segments = [];
    const h = grid.length;
    const w = grid[0].length;

    for (let y = 0; y < h - 1; y++) {
        for (let x = 0; x < w - 1; x++) {
            const a = grid[y][x];
            const b = grid[y][x + 1];
            const c = grid[y + 1][x];
            const d = grid[y + 1][x + 1];
            const state =
                a * 1 +
                b * 2 +
                c * 4 +
                d * 8;

            const top    = [x + 0.5, y];
            const right  = [x + 1, y + 0.5];
            const bottom = [x + 0.5, y + 1];
            const left   = [x, y + 0.5];

            switch (state) {
                case 1:
                    segments.push([left, top]);
                    break;
                case 2:
                    segments.push([top, right]);
                    break;
                case 3:
                    segments.push([left, right]);
                    break;
                case 4:
                    segments.push([left, bottom]);
                    break;
                case 5:
                    segments.push([top, bottom]);
                    break;
                case 6:
                    segments.push([top, left]);
                    segments.push([right, bottom]);
                    break;
                case 7:
                    segments.push([right, bottom]);
                    break;
                case 8:
                    segments.push([right, bottom]);
                    break;
                case 9:
                    segments.push([top, right]);
                    segments.push([left, bottom]);
                    break;
                case 10:
                    segments.push([top, bottom]);
                    break;
                case 11:
                    segments.push([left, bottom]);
                    break;
                case 12:
                    segments.push([left, right]);
                    break;
                case 13:
                    segments.push([top, right]);
                    break;
                case 14:
                    segments.push([left, top]);
                    break;
            }
        }
    }
    return segments;
}

function connectSegments(segments) {
    if (segments.length === 0) return [];
    const key = ([x, y]) => `${x},${y}`;
    const map = new Map();
    for (const segment of segments) {
        const [a, b] = segment;
        const ka = key(a);
        const kb = key(b);
        if (!map.has(ka)) map.set(ka, []);
        if (!map.has(kb)) map.set(kb, []);
        map.get(ka).push({ segment, point: b })
        map.get(kb).push({ segment, point: a })
    }
    const used = new Set();
    const contours = [];
    for (const startSegment of segments) {
        if (used.has(startSegment)) continue;
        const contour = [];
        let currentSegment = startSegment;
        let currentPoint = currentSegment[0];
        contour.push(currentPoint);
        used.add(currentSegment);
        while (true) {
            const k = key(currentPoint);
            const candiates = map.get(k);
            if (!candiates) break;
            let next = null;
            for (const candiate of candiates) {
                if (!used.has(candiate.segment)) {
                    next = candiate;
                    break;
                }
            }
            if (!next) break;
            currentPoint = next.point;
            currentSegment = next.segment;
            used.add(currentSegment);
            contour.push(currentPoint);
            if (key(currentPoint) === key(contour[0])) {
                break;
            }
        }
        contours.push(contour);
    }
    return contours;
}

function createTunnel(contour, depth) {
    const positions = [];
    const indices = [];
    const n = contour.length;
    for (const [x, y] of contour) {
        positions.push(x, y, 0);
    }
    
    for (const [x, y] of contour) {
        positions.push(x, y, depth);
    }
    for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        const a = i;
        const b = next;
        const c = n + next;
        const d = n + i;
        indices.push(a, b, c);
        indices.push(a, c, d);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

init();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const segments = marchingSquares(course.grid);
const contours = connectSegments(segments);
const contour = contours[0];
const geometry = createTunnel(
    contour,
    4
)
const material = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide
});
const tunnel = new THREE.Mesh(
    geometry,
    material
);
scene.add(tunnel);

const PLAYER_RADIUS = 0.1;

let dx = 0;
let dy = 0;

let dragging = false;
let moving = false;
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
    if (!dragging) return;
    dragging = false;
    dx = -(e.clientX - previousX) / 100;
    dy = (e.clientY - previousY) / 100;
    moving = true;
});

canvas.addEventListener("pointerleave", (e) => {
    dragging = false;
});

animate();
