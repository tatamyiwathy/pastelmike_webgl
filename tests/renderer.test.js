import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';

QUnit.module('Renderer', function() {
	function createMockGL() {
		// WebGL2RenderingContextの必要な部分だけモック
		return {
			getContext: () => this,
			viewport: () => {},
			enable: () => {},
			depthFunc: () => {},
			clearColor: () => {},
			clearDepth: () => {},
			clear: () => {},
            createShader: () => {},
            shaderSource: () => {},
            compileShader: () => {},
            getShaderParameter: () => true,
            getShaderInfoLog: () => '',
            createProgram: () => {},
            attachShader: () => {},
            linkProgram: () => {},
            getProgramParameter: () => true,
            getProgramInfoLog: () => '',
            getAttribLocation: () => 0,
            getUniformLocation: () => ({}),
			canvas: { width: 100, height: 100 },
			COLOR_BUFFER_BIT: 0x4000,
			DEPTH_BUFFER_BIT: 0x0100,
			DEPTH_TEST: 0x0B71,
			LESS: 0x0201,
		};
	}

	QUnit.test('Renderer constructor sets up properties', assert =>{
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		assert.ok(renderer.gl, 'gl context is set');
		assert.ok(renderer.frustum, 'frustum is set');
		assert.equal(renderer.enableCulling, true, 'enableCulling default true');
		assert.deepEqual(renderer.clearColor, [0,0,0,1], 'clearColor default');
	});

	QUnit.test('getDirectionLightDir returns normalized direction', assert => {
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		const scene = { lights: [
			{ lightKind: 'directional', direction: [1,0,0] },
			{ lightKind: 'directional', direction: [0,1,0] },
			{ lightKind: 'point', direction: [0,0,1] }
		]};
		const dir = renderer.getDirectionLightDir(renderer.gl, scene);
		const len = Math.sqrt(dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]);
		assert.ok(Math.abs(len-1)<1e-6, 'direction is normalized');
		assert.ok(dir[0]>0 && dir[1]>0, 'direction combines x and y');
	});

	QUnit.test('frustumCulling returns only inside objects', assert => {
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		// frustum.isSphereInsideを常にtrue/false返すようにモック
		renderer.frustum.isSphereInside = (pos, r) => pos[0] > 0;
		const objects = [
			{ position: [1,0,0] },
			{ position: [-1,0,0] }
		];
		const culled = renderer.frustumCulling(objects);
		assert.equal(culled.length, 1, 'only one object inside');
		assert.deepEqual(culled[0].position, [1,0,0]);
	});

});
