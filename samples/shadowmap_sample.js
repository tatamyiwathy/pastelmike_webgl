import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { create_plain_geometry, create_cube_geometry } from '../scripts/geometry.js';
import { MeshSpecularMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';
import { DirectionLight } from '../scripts/light.js';
import { Animator } from '../scripts/object_3d.js';
import { Debug } from '../scripts/debug.js';




function main() {
    let isExit = false;
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    renderer.clearColor = [0.2, 0.2, 0.4, 1.0];
    const gl = renderer.gl;
    const scene = new Scene();

    // デバッグモード: シャドウマップを画面右下に表示
    // renderer.debugShadowMap = true;
    document.addEventListener('keydown',
        event => {
            if (event.key === 'Escape') {
                isExit = true;
            }
        });

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
    //camera.animator = cameraRotater;
    scene.add(camera);

    const plain_geometory = create_plain_geometry(gl, 20);
    const plain_material = new MeshSpecularMaterial(gl);
    const plainMesh = new Mesh(gl, plain_geometory, plain_material);
    plainMesh.tagName = 'ground';
    plainMesh.position = [0, 0, 0];
    scene.add(plainMesh);


    class LightRotater extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }

        update(obj, deltaTime) {
            this.angle += deltaTime * 0.2;
            const radius = 50;
            const x = Math.sin(this.angle) * radius;
            const z = Math.cos(this.angle) * radius;
            obj.position = [x, 50, z];
            obj.targetPosition = [0, 0, 0];
        }
    }

    const dlight = new DirectionLight(gl, {
        position: [0, 50, 50],
        color: [1, 1, 1],
        enableShadow: true,
        shadowBoxSize: 50,
        near: 1.0,
        far: 200,
    });
    dlight.animator = new LightRotater();
    scene.add(dlight);

    const dlight2 = new DirectionLight(gl, {
        position: [50, 50, 0],
        color: [1, 1, 1],
        enableShadow: true,
        shadowBoxSize: 50,
        near: 1.0,
        far: 200,
    });
    scene.add(dlight2);


    const cube_geometry = create_cube_geometry(gl, 1, 1, 1);
    const cube_material = new MeshSpecularMaterial(gl);
    const cubeMesh = new Mesh(gl, cube_geometry, cube_material);
    cubeMesh.position = [0, 2, 0];
    cubeMesh.tagName = 'cube';
    scene.add(cubeMesh);

    function render() {
        renderer.render(scene, camera);
        if (isExit) {
            return;
        }
        requestAnimationFrame(render);
    }

    render();
}



main();


Debug.enableLog = true;