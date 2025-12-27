import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { Animator } from '../scripts/object_3d.js';
import { DirectionLight } from '../scripts/light.js';
import { ObjLoader } from '../scripts/obj_loader.js';

function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);

    const gl = renderer.gl;

    const scene = new Scene();

    const light = new DirectionLight(gl, 0,1,0);
    scene.add(light);

    const objLoader = new ObjLoader();
    objLoader.load(gl,'../assets/sphere.obj').then((obj) => {
        obj.material.color[3] = 1;
        scene.add(obj);
    });

    class CameraAnimator extends Animator {
        constructor() {
            super();
            this.angle = 0;
        }
        update(obj, deltaTime) {
            // カメラをY軸中心に回転
            const radius = 4;
            this.angle += ((Math.PI * 2) / 36) * deltaTime; // 1秒で1/36回転
            obj.position = [
                radius * Math.sin(this.angle),
                2,
                radius * Math.cos(this.angle)
            ];
            obj.lookAt([0, 0, 0]);
        }
    }
    
    const camera = new PerspectiveCamera(Math.PI / 5, canvas.width / canvas.height, 0.1, 100, {animator: new CameraAnimator()});
    camera.position = [0, 1.5, 10];
    camera.lookAt([0, 1.5, 0]);
    scene.add(camera);
    renderer.enableCulling = false;
    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}


main();


