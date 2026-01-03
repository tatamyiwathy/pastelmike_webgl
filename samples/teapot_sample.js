import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { Mesh } from '../scripts/mesh.js';
import { Animator } from '../scripts/object_3d.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { create_cube_geometry, create_plain_geometry } from '../scripts/geometry.js';
import { PointLight, DirectionLight } from '../scripts/light.js';
import { ObjLoader } from '../scripts/obj_loader.js';
import { create_torus_geometory, create_sphere_geometry } from '../scripts/geometry.js';
import { Sprite } from '../scripts/sprite.js';
import { TextureLoader } from '../scripts/texture_loader.js';

function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    renderer.clearColor = [0.2, 0.3, 0.4, 1.0]; // 背景色を設定

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
        scene.children.forEach((group) => {
            group.children.forEach((obj) => {
                if (obj.material) {
                    obj.material.isWireframe = isWireframe;
                    console.log('set wireframe:', isWireframe);
                }
            });
        });
    });

    const lightSWitches = ['r_light', 'g_light', 'b_light'];
    lightSWitches.forEach((id) => {
        setElementEvent(id, 'change', (event) => {
            const lights = scene.findByTagName(event.target.id);
            if (lights.length > 0) {
                const light = lights[0];
                console.log(light.enabled);
                light.enabled = event.target.checked;
                //console.log(`Set light ${event.target.id} enabled:`, light.enabled);
            }
        });
    });




    const gl = renderer.gl;

    const scene = new Scene();

    const options = {
        size: 50,
        material: new MeshSimpleMaterial(gl),
    }
    // const plain_geometry = create_plain_geometry(gl, options.size);
    // const plain_material = new MeshSimpleMaterial(gl);
    // const plainMesh = new Mesh(gl, plain_geometry, plain_material);
    // plainMesh.material.color = [0.5, 0.5, 0.5, 1]; // グレーに設定
    // scene.add(plainMesh);

    // ティーポットの読み込み
    const objLoader = new ObjLoader();
    objLoader.load(gl, './assets/teapot.obj').then((obj) => {
        obj.position = [-2.5, 1, 0];
        obj.scale = [0.025, 0.025, 0.025];
        scene.add(obj);
    });

    // 球体の読み込み
    const loader = new ObjLoader();
    loader.load(gl, './assets/sphere.obj').then((obj) => {
        obj.position = [2.5, 1, 0];
        scene.add(obj);
    });

    // トーラスの作成
    const torus = create_torus_geometory(gl, 1, 0.4, 16, 12);
    const torusMaterial = new MeshSpecularMaterial(gl);
    torusMaterial.color = [1, 1, 1, 1]; // 白色に設定
    const torusMesh = new Mesh(gl, torus, torusMaterial);
    torusMesh.position = [0, 0.5, -2.5];
    torusMesh.rotateX(Math.PI / 2);
    scene.add(torusMesh);

    // 直方体の作成
    const boxGeometry = new create_cube_geometry(gl, 2, 2, 2);
    const boxMaterial = new MeshSpecularMaterial(gl);
    const boxMesh = new Mesh(gl, boxGeometry, boxMaterial);
    boxMesh.position = [0, 0, 2.5];
    scene.add(boxMesh);

    // 平行光源
    const colors = [
        { color: [1, 0, 0], tagName: 'r_light' },
        { color: [0, 1, 0], tagName: 'g_light' },
        { color: [0, 0, 1], tagName: 'b_light' },
    ]
    for (let i = 0; i < 360; i += 120) {
        const angle = (i / 180) * Math.PI;
        const dl = new DirectionLight(gl, { direction: [Math.cos(angle), -1, Math.sin(angle)], color: colors[i / 120].color });
        dl.tagName = colors[i / 120].tagName;
        console.log(dl.tagName);
        scene.add(dl);
    }


    class LightAnimator extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }
        update(obj, deltaTime) {
            // ライトを上下に移動
            const radius = 1.5;
            this.angle += ((Math.PI * 2) / 18) * deltaTime;
            obj.position[0] = 0;
            obj.position[1] = radius * Math.sin(this.angle);
            obj.position[2] = 0;
        }
    }





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

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, { animator: new CameraAnimator() });
    camera.position = [4, 4, 4];
    camera.lookAt([0, 0, 0]);
    scene.add(camera);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}


main();


