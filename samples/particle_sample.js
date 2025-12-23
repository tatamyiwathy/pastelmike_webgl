import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';
import { PointGeometry } from '../scripts/geometry.js';
import { Mesh } from '../scripts/mesh.js';
import { ParticleMaterial } from '../scripts/material.js';
import { Animator } from '../scripts/object_3d.js';
import { pickColor } from '../scripts/utils.js';




function main() {
    const canvas = document.getElementById('canvas');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    const renderer = new Renderer(canvas);

    const gl = renderer.gl;

    const scene = new Scene();

    const drugging = {
        isDragging: false,
        fistX: 0,
        fistY: 0,
        lastX: 0,
        lastY: 0,
        deltaX: 0,
        deltaY: 0
    };

    canvas.addEventListener('mousedown', () => {
        drugging.isDragging = true;
        drugging.fistX = event.clientX;
        drugging.fistY = event.clientY;
        drugging.lastX = event.clientX;
        drugging.lastY = event.clientY;
    });
    canvas.addEventListener('mousemove', () => {
        if (drugging.isDragging) {
            drugging.deltaX = drugging.lastX - event.clientX;
            drugging.deltaY = drugging.lastY - event.clientY;
            drugging.lastX = event.clientX;
            drugging.lastY = event.clientY;
        }
    });
    canvas.addEventListener('mouseup', () => {
        drugging.isDragging = false;
        drugging.deltaX = 0;
        drugging.deltaY = 0;
    });

    for (let i = 0; i < 100 * 100; i++) {
        const x = ((i % 100) - 50) * 0.5; // -50 〜 49 を 0.5倍して -25 〜 24.5 に変換
        const y = 0;
        const z = (Math.floor(i / 100) - 50) * 0.5;

        const geometry = new PointGeometry(gl);
        const material = new ParticleMaterial(gl, {
            // color: pickColor( (Math.PI * 2) / 6  * Math.random() + ((Math.PI * 2)/3)*2),
            size: 10.0
        });

        class ParticleAnimator extends Animator {
            constructor() {
                super();
                this.angle = 0;
                this.anglespeed = 1 / Math.PI * 2;
            }
            update(obj, deltaTime) {
                const distance = Math.sqrt(
                    obj.position[0] * obj.position[0] +
                    obj.position[2] * obj.position[2]
                );
                const y = Math.sin(distance / 5 + this.angle) * 1.5;   // 波の高さを計算(-2.0 〜 2.0)
                obj.position[1] = y;
                const c = (y + 2.0) / 4.0; // 0.0 〜 1.0 に正規化
                obj.material.color = pickColor(c * Math.PI / 2 + (Math.PI * 4 / 3)); // 色相を変化させる

                this.angle -= this.anglespeed * deltaTime;
            }
        };
        const mesh = new Mesh(gl, geometry, material);
        mesh.animator = new ParticleAnimator();

        mesh.position = [x, y, z];
        scene.addObject(mesh);
    }

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    camera.position = [0, 10, 10];
    camera.lookAt([0, 0, 0]);
    scene.addObject(camera);

    let lookat_x = 0;
    let lookat_y = 0;

    function render() {
        lookat_x += drugging.deltaX * 0.01;
        lookat_y += drugging.deltaY * 0.01;
        camera.lookAt([lookat_x, lookat_y, 0]);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}



main();


