import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { Skybox } from '../scripts/skybox.js';
import { Animator } from '../scripts/object_3d.js';
import { Mesh } from '../scripts/mesh.js';
import { create_plain_geometry } from '../scripts/geometry.js';
import { MeshSimpleMaterial } from '../scripts/material.js';

function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);

    const gl = renderer.gl;

    const scene = new Scene();

    const geometry = create_plain_geometry(gl, { size: 50 });
    const material = new MeshSimpleMaterial(gl); 
    const plainMesh = new Mesh(gl, geometry, material);
    plainMesh.material.color = [0.5, 0.5, 0.5, 1]; // グレーに設定
    scene.addObject(plainMesh);



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
    scene.addObject(skybox, {layer: 0} );


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
    
    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {animator: new CameraAnimator()});
    camera.position = [0, 0, 3];
    camera.lookAt([0, 0, 0]);
    scene.addObject(camera);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}


main();


