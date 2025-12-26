import { Renderer } from '../scripts/renderer.js';
import { PointLight } from '../scripts/light.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import {
    create_sphere_geometry,
} from '../scripts/geometry.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';

function main() {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    const renderer = new Renderer(canvas);
    renderer.enableCulling = false;

    const gl = renderer.gl;

    const scene = new Scene();


    const sphere_geometry = new create_sphere_geometry(gl);
    const sphere_material = new MeshSpecularMaterial(gl);

    const sphere_mesh1 = new Mesh(gl, sphere_geometry, sphere_material);
    sphere_mesh1.position = [2, 0, 0];
    sphere_mesh1.material.color = [1, 1, 1, 1];
    scene.add(sphere_mesh1);

    const sphere_mesh2 = new Mesh(gl, sphere_geometry, sphere_material);
    sphere_mesh2.position = [-2, 0, 0];
    sphere_mesh2.material.color = [1, 1, 1, 1];
    scene.add(sphere_mesh2);

    const light = new PointLight(gl);
    scene.add(light);

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    camera.position = [0, 0, 3];
    camera.lookAt([0, 0, 0]);
    scene.add(camera);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}

function resizeCanvas() {
    main();
}
window.addEventListener('resize', resizeCanvas);




main();


