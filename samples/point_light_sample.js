import { Renderer } from '../scripts/renderer.js';
import { PointLight } from '../scripts/light.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import {
    create_sphere_geometry,
    create_plain_geometry,
} from '../scripts/geometry.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';
import { TextureLoader } from '../scripts/texture.js';
import { Sprite } from '../scripts/flare.js';

function main() {
    const canvas = document.getElementById('canvas');
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    const pointLightParameters = {
        constant: 1.0,
        linear: 0.0,
        quadratic: 0.0,
    };

    const constantSlider = document.getElementById('constant_slider');
    const constantValue = document.getElementById('constant_slider_value');
    constantSlider.addEventListener('input', () => {
      constantValue.textContent = constantSlider.value;
      pointLightParameters.constant = parseFloat(constantSlider.value);
    });

    const linearSlider = document.getElementById('linear_slider');
    const linearValue = document.getElementById('linear_slider_value');
    linearSlider.addEventListener('input', () => {
      linearValue.textContent = linearSlider.value;
      pointLightParameters.linear = parseFloat(linearSlider.value);
    });

    const quadraticSlider = document.getElementById('quadratic_slider');
    const quadraticValue = document.getElementById('quadratic_slider_value');
    quadraticSlider.addEventListener('input', () => {
      quadraticValue.textContent = quadraticSlider.value;
      pointLightParameters.quadratic = parseFloat(quadraticSlider.value);
    });

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

    const plainGeometry = new create_plain_geometry(gl, 10);
    const plainMaterial = new MeshSpecularMaterial(gl);
    const plainMesh = new Mesh(gl, plainGeometry, plainMaterial);
    plainMesh.position = [0, -2, 0];
    scene.add(plainMesh);

    function render() {
        light.constant = pointLightParameters.constant;
        light.linear = pointLightParameters.linear;
        light.quadratic = pointLightParameters.quadratic;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}
main();



