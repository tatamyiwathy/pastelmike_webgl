import { Renderer } from '../scripts/renderer.js';
import { Cube } from '../scripts/cube.js';
import { Plain } from '../scripts/plain.js';
import { Light } from '../scripts/light.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { Geometry,TriangleGeometry } from '../scripts/geometry.js';
import { Skybox } from '../scripts/skybox.js';
import { Triangle } from '../scripts/triangle.js';
import { Animator } from '../scripts/object_3d.js';
import { pickColor } from '../scripts/utils.js';
import { MeshSpecularMaterial, MeshSimpleMaterial } from '../scripts/material.js';
import { Mesh } from '../scripts/mesh.js';

function main() {
    let isFlat = true;

    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    const gl = renderer.gl;

    function initScene(){
        const scene = new Scene();

        for (let i = 0; i < 1000; i++) {
            const geometry = new TriangleGeometry(gl);
            const material = new MeshSimpleMaterial(gl, {
                isWireframe: !isFlat,
                color: pickColor(Math.PI * 2 * Math.random()),
            });
            const mesh = new Mesh(gl, geometry, material);
            mesh.position = [
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ];
            mesh.rotateY(Math.random() * Math.PI * 2);
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

        const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, { animator: new CameraAnimator() });
        camera.position = [0, 0, 3];
        camera.lookAt([0, 0, 0]);
        scene.addObject(camera);

        return [scene, camera];
    }

    let [scene, camera] = initScene();

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    // 変更時に値を取得する場合
    const radios = document.querySelectorAll('input[name="type"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                // console.log('選択された値:', radio.value);
                // isFlat = (radio.value === 'flat') ? true : false;
                // scene = null;
                // camera = null;
                // [scene, camera] = initScene();
                // console.log('isFlat:', isFlat);
                scene.objGroups.forEach((group) => {
                    group.objects.forEach((obj) => {
                        if( obj.type == 'mesh' ){
                            obj.material.isWireframe = (radio.value === 'wire') ? true : false;
                        }
                    });
                });
            }
        });
    });



    render();
}

console.log(' call main() ');
main();


