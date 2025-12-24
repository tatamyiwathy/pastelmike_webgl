import { Renderer } from '../scripts/renderer.js';
import { Light } from '../scripts/light.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import {
    create_cube_geometry,
    create_plain_geometry,
    create_triangle_geometry,
} from '../scripts/geometry.js';
import { Skybox } from '../scripts/skybox.js';
import { Animator } from '../scripts/object_3d.js';
import { pickColor } from '../scripts/utils.js';
import { parseObj } from '../scripts/obj_parser.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';
import { create_torus_geometory } from '../scripts/geometry.js';

function main() {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    const mouseState = {
        isMouseDown: false,
        mouseX: 0,
        mouseY: 0,
        prevX: 0,
        prevY: 0
    }
    // マウスイベント
    window.addEventListener('mousedown', (event) => {
        event.preventDefault(); // デフォルトの動作をキャンセル（テキスト選択などを防止）
        mouseState.isMouseDown = true;
        mouseState.mouseX = event.clientX;
        mouseState.mouseY = event.clientY;
        mouseState.prevX = mouseState.mouseX;
        mouseState.prevY = mouseState.mouseY;
    });
    window.addEventListener('mouseup', (event) => {
        event.preventDefault();
        mouseState.isMouseDown = false;
        mouseState.prevX = mouseState.mouseX;
        mouseState.prevY = mouseState.mouseY;
    });
    window.addEventListener('mousemove', (event) => {
        event.preventDefault();
        if (mouseState.isMouseDown) {
            // マウスが押されているときの処理
            mouseState.prevX = mouseState.mouseX;
            mouseState.prevY = mouseState.mouseY;
            mouseState.mouseX = event.clientX;
            mouseState.mouseY = event.clientY;

            console.log(`MovementX: ${mouseState.mouseX - mouseState.prevX}, MovementY: ${mouseState.mouseY - mouseState.prevY}`);
        }
    });




    const renderer = new Renderer(canvas);

    const gl = renderer.gl;

    const scene = new Scene();
    scene.isFog = true;

    document.getElementById('fog_switch').addEventListener('change', (event) => {
        if (event.target.checked) {
            scene.fogStart = 1.0;
            scene.fogEnd = 5.0;
        } else {
            scene.isFog = false;
            scene.fogStart = 1000.0;
            scene.fogEnd = 1000.0;
        }
    });

    const cube_geometry = new create_cube_geometry(gl, 2, 2, 2);
    const cube_material = new MeshSpecularMaterial(gl);
    const cube_mesh = new Mesh(gl, cube_geometry, cube_material);
    cube_mesh.position = [2, 1, 0];
    cube_mesh.material.color = [1, 1, 1, 1];
    scene.addObject(cube_mesh);

    {
        const light = new Light(gl, -1, 0, 0);
        light.color = [1, 1, 1]; // 白色光源
        scene.addObject(light);
    }

    const plain_geometry = create_plain_geometry(gl, 50);
    const plain_material = new MeshSpecularMaterial(gl);
    const plain_mesh = new Mesh(gl, plain_geometry, plain_material);
    plain_mesh.material.color = [0.5, 0.5, 0.5, 1]; // グレーに設定
    scene.addObject(plain_mesh);


    // キューブマップの画像情報
    const skyboxImages = {
        right: '../assets/Panorama_Sky_01-512x512_r.png',
        left: '../assets/Panorama_Sky_01-512x512_l.png',
        up: '../assets/Panorama_Sky_01-512x512_u.png',
        down: '../assets/Panorama_Sky_01-512x512_d.png',
        front: '../assets/Panorama_Sky_01-512x512_f.png',
        back: '../assets/Panorama_Sky_01-512x512_b.png'
    };

    const skybox = new Skybox(gl, 15, skyboxImages);
    console.log('skybox', skybox);
    scene.addObject(skybox, { layer: 0 });


    // for (let i = 0; i < 500; i++){
    //     const p = new MyParticle(gl);
    //     // 半径40の球内のランダム位置
    //     const radius = Math.random() * 40; // 0～40のランダム
    //     const theta = Math.random() * Math.PI * 2; // 0～2πのランダム
    //     const phi = Math.acos(Math.random() * 2 - 1); // 0～πのランダム（球面均等分布）

    //     const position = [
    //         radius * Math.sin(phi) * Math.cos(theta),
    //         radius * Math.sin(phi) * Math.sin(theta),
    //         radius * Math.cos(phi)
    //     ];
    //     p.position = position;
    //     scene.addObject(p, {layer: 1} );
    // }

    for (let i = 0; i < 1000; i++) {
        const geometry = create_triangle_geometry(gl, Math.random() * 0.5 + 0.1);
        const material = new MeshSpecularMaterial(gl);
        const mesh = new Mesh(gl, geometry, material);


        mesh.position = [Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10];
        mesh.rotateY(Math.random() * Math.PI * 2);
        mesh.material.color = pickColor(Math.random() * Math.PI * 2);
        scene.addObject(mesh);
    }


    class CameraAnimator extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }
        update(obj, deltaTime) {
            // カメラをY軸中心に回転
            const radius = 5;
            this.angle += ((Math.PI * 2) / 36) * deltaTime; // 1秒で1/36回転
            obj.position = [
                radius * Math.sin(this.angle),
                1.5,
                radius * Math.cos(this.angle)
            ];
            obj.lookAt([0, 1.5, 0]);
        }
    }


    class CameraHead {
        constructor() {
            this.yaw = 0;// 左右の回転
            this.pitch = 0; // 上下の回転
            this.quat = glMatrix.quat.create();
            this.look = glMatrix.vec3.create();
        }

        update(camera, dPitch, dYaw) {
            this.pitch += dPitch;
            this.yaw += dYaw;

            glMatrix.quat.fromEuler(this.quat, this.pitch, this.yaw, 0);

            // 2. [0, 0, 1] ベクトルを用意
            // ※右手座標系の初期状態（回転なし）で「前」をどこにするか定義します
            const forward = glMatrix.vec3.fromValues(0, 0, 1);

            // 3. クォータニオンを適用して回転させる
            glMatrix.vec3.transformQuat(this.look, forward, this.quat);

            camera.look(this.look);
        }

    }

    const cameraHead = new CameraHead();

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    camera.position = [0, 1.5, 3];
    camera.look([0, 0, 1]);
    scene.addObject(camera);
    let lookat_x = 0;
    let lookat_y = 1.5;
    function render() {

        const dYaw = -(mouseState.mouseX - mouseState.prevX) * 0.5;
        const dPitch = (mouseState.mouseY - mouseState.prevY) * 0.5;

        cameraHead.update(camera, dPitch, dYaw);

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}

function resizeCanvas() {
    main();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);




main();


