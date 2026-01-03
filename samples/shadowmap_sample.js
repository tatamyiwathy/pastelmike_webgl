import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';
import { PerspectiveCamera } from '../scripts/camera.js';




function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new Renderer(canvas);
    const gl = renderer.gl;
    const scene = new Scene();

    const camera = new PerspectiveCamera(Math.PI / 2, canvas.width / canvas.height, 0.1, 100, {});
    camera.position = [0, 10, 10];
    camera.lookAt([0, 0, 0]);
    scene.add(camera);

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}



main();


