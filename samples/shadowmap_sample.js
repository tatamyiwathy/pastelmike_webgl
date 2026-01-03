import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { create_plain_geometry, create_cube_geometry } from '../scripts/geometry.js';
import { MeshSpecularMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';
import { DirectionLight } from '../scripts/light.js';
import { Animator } from '../scripts/object_3d.js';




function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    const gl = renderer.gl;
    const scene = new Scene();

    // デバッグモード: シャドウマップを画面右下に表示
    renderer.debugShadowMap = true;


    class CameraRotater extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }

        update(obj, deltaTime) {
            this.angle += deltaTime * 0.5;
            const radius = 3;
            const x = Math.sin(this.angle) * radius;
            const z = Math.cos(this.angle) * radius;
            obj.position = [x, 2, z];
            obj.lookAt([0, 0, 0]);
        }
    }

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    const cameraRotater = new CameraRotater();
    camera.position = [3, 2, 3];
    camera.lookAt([0, 0, 0]);
    // camera.animator = cameraRotater;
    scene.add(camera);

    const plain_geometory = create_plain_geometry(gl, 20);
    const plain_material = new MeshSpecularMaterial(gl);
    const plainMesh = new Mesh(gl, plain_geometory, plain_material);
    plainMesh.position = [0, 0, 0];
    scene.add(plainMesh);

    const dlight = new DirectionLight(gl, {
        direction: [0, -1, 0],
        up: [0, 0, 1],
        position: [0, 50, 0],
        color: [1, 1, 1],
        enableShadow: true,
        shadowBoxSize: 50,
        near: 1.0,
        far: 200,
    });
    scene.add(dlight);

    const cube_geometry = create_cube_geometry(gl, 1, 1, 1);
    const cube_material = new MeshSpecularMaterial(gl);
    const cubeMesh = new Mesh(gl, cube_geometry, cube_material);
    cubeMesh.position = [0, 0.5, 0];
    scene.add(cubeMesh);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}



main();


