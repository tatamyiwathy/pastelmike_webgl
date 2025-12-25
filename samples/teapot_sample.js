import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { Mesh } from '../scripts/mesh.js';
import { Animator } from '../scripts/object_3d.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { create_plain_geometry } from '../scripts/geometry.js';
import { PointLight, Light } from '../scripts/light.js';
import { ObjLoader } from '../scripts/obj_loader.js';
import { create_torus_geometory, create_sphere_geometry } from '../scripts/geometry.js';

function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    renderer.clearColor = [0.2, 0.3, 0.4, 1.0]; // 背景色を設定

    // function resizeCanvas() {
    //     canvas.width = window.innerWidth;
    //     canvas.height = window.innerHeight;
    // }
    // resizeCanvas();
    // window.addEventListener('resize', resizeCanvas);

    function getSwitchState(id) {
        return document.getElementById(id).checked;
    }

    renderer.usePointLight = true

    function setElementEvent(id, property, callback) {
        document.getElementById(id).addEventListener(property, (event) => {
            callback(event);
        });
    }

    setElementEvent('wireframe_switch', 'change', (event) => {
        const isWireframe = event.target.checked;
        scene.objGroups.forEach((group) => {
            group.objects.forEach((obj) => {
                if (obj.material) {
                    obj.material.isWireframe = isWireframe;
                }
            });
        });
    });

    setElementEvent('point_light_switch', 'change', (event) => {
        renderer.usePointLight = event.target.checked;
    });

    const gl = renderer.gl;

    const scene = new Scene();

    const options = {
        size: 50,
        material: new MeshSimpleMaterial(gl),
    }
    const plain_geometry = create_plain_geometry(gl, options.size);
    const plain_material = new MeshSimpleMaterial(gl);
    const plainMesh = new Mesh(gl, plain_geometry, plain_material);
    plainMesh.material.color = [0.5, 0.5, 0.5, 1]; // グレーに設定
    scene.addObject(plainMesh);

    const objLoader = new ObjLoader();
    objLoader.load(gl, '../assets/teapot.obj').then((obj) => {
        obj.position = [-1, 1, -3];
        obj.scale = [0.025, 0.025, 0.025];
        scene.addObject(obj);
    });

    const sphere = create_sphere_geometry(gl, 1, 16, 8);
    const sphereMaterial = new MeshSpecularMaterial(gl);
    sphereMaterial.color = [1, 1, 1, 1];
    const sphereMesh = new Mesh(gl, sphere, sphereMaterial);
    sphereMesh.position = [0, 1, 3];
    scene.addObject(sphereMesh);

    const torus = create_torus_geometory(gl, 1, 0.4, 16, 12);
    const torusMaterial = new MeshSpecularMaterial(gl);
    torusMaterial.color = [1, 1, 1, 1]; // 白色に設定
    const torusMesh = new Mesh(gl, torus, torusMaterial);
    torusMesh.position = [3, 0.5, 0];
    torusMesh.rotateX(Math.PI / 2);
    scene.addObject(torusMesh);

    const dl = new Light(gl, 1,0,0);
    scene.addObject(dl);


    class LightAnimator extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }
        update(obj, deltaTime) {
            // ライトを上下に移動
            const radius =5;
            this.angle += ((Math.PI * 2) / 18) * deltaTime;
            obj.position[0] = 0;
            obj.position[1] = radius * Math.sin(this.angle);;
            obj.position[2] = 0;
        }
    }


    const light = new PointLight(gl, { animator: new LightAnimator() });
    scene.addObject(light);

    class CameraAnimator extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }
        update(obj, deltaTime) {
            // カメラをY軸中心に回転
            const radius = 3;
            this.angle += ((Math.PI * 2) / 36) * deltaTime; // 1秒で1/36回転
            obj.position = [
                radius * Math.sin(this.angle),
                4,
                radius * Math.cos(this.angle)
            ];
            obj.lookAt([0, 1.5, 0]);
        }
    }

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    camera.position = [4, 4, 4];
    camera.lookAt([0, 0, 0]);
    scene.addObject(camera);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}


main();


