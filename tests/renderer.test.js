import { describe, test, expect } from 'vitest';
import { Renderer } from '../scripts/renderer.js';
import { Scene } from '../scripts/scene.js';

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

describe('Renderer', () => {
	test('Renderer constructor sets up properties', () => {
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		expect(renderer.gl).toBeTruthy();
		expect(renderer.frustum).toBeTruthy();
		expect(renderer.enableCulling).toBe(true);
		expect(renderer.clearColor).toEqual([0,0,0,1]);
	});

	test('getDirectionLightDir returns normalized direction', () => {
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		const scene = { lights: [
			{ lightKind: 'directional', direction: [1,0,0] },
			{ lightKind: 'directional', direction: [0,1,0] },
			{ lightKind: 'point', direction: [0,0,1] }
		]};
		const dir = renderer.getDirectionLightDir(renderer.gl, scene);
		const len = Math.sqrt(dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]);
		expect(Math.abs(len-1)).toBeLessThan(1e-6);
		expect(dir[0]).toBeGreaterThan(0);
		expect(dir[1]).toBeGreaterThan(0);
	});

	test('frustumCulling returns only inside objects', () => {
		const canvas = { getContext: () => createMockGL() };
		const renderer = new Renderer(canvas);
		// frustum.isSphereInsideを常にtrue/false返すようにモック
		renderer.frustum.isSphereInside = (pos, r) => pos[0] > 0;
		const objects = [
			{ position: [1,0,0] },
			{ position: [-1,0,0] }
		];
		const culled = renderer.frustumCulling(objects);
		expect(culled.length).toBe(1);
		expect(culled[0].position).toEqual([1,0,0]);
	});
});
