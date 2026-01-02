import { describe, it, expect, test } from 'vitest';
import * as geometry from '../scripts/geometry.js';

// 共通のglモック生成関数
function createMockGL(overrides = {}) {
    return {
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        deleteBuffer: () => {},
        STATIC_DRAW: 0,
        ARRAY_BUFFER: 0,
        ELEMENT_ARRAY_BUFFER: 0,
        ...overrides
    };
}

// サンプルテスト: 必要に応じて関数名やテスト内容を追加してください

describe('geometry.js', () => {
    test('create_triangle_geometryでGeometryが生成できる', () => {
        const gl = createMockGL();
        const tri = geometry.create_triangle_geometry(gl);
        expect(tri).toBeInstanceOf(geometry.Geometry);
        expect(tri.v_vbo).not.toBeNull();
        expect(tri.n_vbo).not.toBeNull();
        expect(tri.tri_ibo).not.toBeNull();
        expect(tri.tri_indices_len).toBe(3);
    });
    test('generateIndexForWireframe: indicesがnullなら例外', () => {
        const gl = createMockGL();
        const g = new geometry.Geometry(gl);
        expect(() => {
            g.generateIndexForWireframe(null);
        }).toThrow('IBOのインデックスデータがありません');
        expect(() => {
            g.generateIndexForWireframe(undefined);
        }).toThrow('IBOのインデックスデータがありません');
    });
    test('モジュールが定義されている', () => {
        expect(geometry).toBeDefined();
    });


    test('PointGeometryのインスタンスが生成できる', () => {
        const gl = createMockGL();
        const p = new geometry.PointGeometry(gl);
        expect(p).toBeInstanceOf(geometry.PointGeometry);
        expect(p).toBeInstanceOf(geometry.Geometry);
        // v_vboがnullでないこと（点なので）
        expect(p.v_vbo).not.toBeNull();
    });



    test('Geometryの初期値', () => {
        const gl = createMockGL();
        const g = new geometry.Geometry(gl);
        expect(g.v_vbo).toBeNull();
        expect(g.n_vbo).toBeNull();
        expect(g.uv_vbo).toBeNull();
        expect(g.tri_ibo).toBeNull();
        expect(g.tri_indices_len).toBe(0);
        expect(g.wire_ibo).toBeNull();
        expect(g.wire_indices_len).toBe(0);
    });

    test('dispose: VBO/IBOのdisposeが呼ばれる', () => {
        // Geometryインスタンスの各VBO/IBOにdisposeが呼ばれるか確認
        const called = { v: false, n: false, uv: false, tri: false, wire: false };
        function makeVBO() { return { dispose: () => { called.v = true; } }; }
        function makeNBO() { return { dispose: () => { called.n = true; } }; }
        function makeUVBO() { return { dispose: () => { called.uv = true; } }; }
        function makeIBO() { return { dispose: () => { called.tri = true; } }; }
        function makeWireIBO() { return { dispose: () => { called.wire = true; } }; }
        const gl = createMockGL();
        const g = new geometry.Geometry(gl);
        g.v_vbo = makeVBO();
        g.n_vbo = makeNBO();
        g.uv_vbo = makeUVBO();
        g.tri_ibo = makeIBO();
        g.wire_ibo = makeWireIBO();
        g.dispose({});
        expect(called.v).toBe(true);
        expect(called.n).toBe(true);
        expect(called.uv).toBe(true);
        expect(called.tri).toBe(true);
        expect(called.wire).toBe(true);
    });

    test('generateIndexForWireframe: ワイヤーフレームインデックス生成', () => {
        const gl = createMockGL();
        const g = new geometry.Geometry(gl);
        // 三角形1つ（0,1,2）
        const indices = new Uint32Array([0, 1, 2]);
        const wire = g.generateIndexForWireframe(indices);
        // 3辺分のインデックスが2つずつ
        expect(Array.from(wire)).toEqual([0, 1, 1, 2, 2, 0]);
    });


    test('create_torus_geometoryでGeometryが生成できる', () => {
        const gl = createMockGL();
        const torus = geometry.create_torus_geometory(gl);
        expect(torus).toBeInstanceOf(geometry.Geometry);
        expect(torus.v_vbo).not.toBeNull();
        expect(torus.n_vbo).not.toBeNull();
        expect(torus.uv_vbo).not.toBeNull();
        expect(torus.tri_ibo).not.toBeNull();
        expect(torus.tri_indices_len).toBeGreaterThan(0);
    });


    test('create_sphere_geometryでGeometryが生成できる', () => {
        const gl = createMockGL();
        const sphere = geometry.create_sphere_geometry(gl);
        expect(sphere).toBeInstanceOf(geometry.Geometry);
        expect(sphere.v_vbo).not.toBeNull();
        expect(sphere.n_vbo).not.toBeNull();
        expect(sphere.uv_vbo).not.toBeNull();
        expect(sphere.tri_ibo).not.toBeNull();
        expect(sphere.tri_indices_len).toBeGreaterThan(0);
    });

    test('create_cube_geometryでGeometryが生成できる', () => {
        const gl = createMockGL();
        const cube = geometry.create_cube_geometry(gl, 1, 1, 1);
        expect(cube).toBeInstanceOf(geometry.Geometry);
        expect(cube.v_vbo).not.toBeNull();
        expect(cube.n_vbo).not.toBeNull();
        expect(cube.uv_vbo.array.length).not.toBe(0);
        expect(cube.tri_ibo).not.toBeNull();
        expect(cube.tri_indices_len).toBeGreaterThan(0);
    });

    test('create_plain_geometryでGeometryが生成できる', () => {
        const gl = { createBuffer: () => ({}), bindBuffer: () => { }, bufferData: () => { }, deleteBuffer: () => { } };
        const cube = geometry.create_plain_geometry(gl, 1);
        expect(cube).toBeInstanceOf(geometry.Geometry);
        expect(cube.v_vbo).not.toBeNull();
        expect(cube.n_vbo).not.toBeNull();
        expect(cube.uv_vbo.array.length).not.toBe(0);
        expect(cube.tri_ibo).not.toBeNull();
        expect(cube.tri_indices_len).toBeGreaterThan(0);
    });

    test('VOBO/IBOが正しく生成されているか', () => {
        const gl = createMockGL();

        {
            const vbo = new geometry.VBO(gl, new Float32Array([0, 1, 2, 3, 4, 5]));
            expect(vbo).toBeInstanceOf(geometry.VBO);
            expect(vbo.array).toBeInstanceOf(Float32Array);
            expect(vbo.array.length).toBe(6);
        }
        {
            expect(() => {
                const vbo = new geometry.VBO(gl, [0, 1, 2, 3, 4, 5]);
            }).toThrow();
        }

        const ibo = new geometry.IBO(gl, new Uint32Array([0, 1, 2, 3]));
        expect(ibo).toBeInstanceOf(geometry.IBO);
        expect(ibo.array).toBeInstanceOf(Uint32Array);
        expect(ibo.array.length).toBe(4);

        {
            expect(() => {
                const ibo = new geometry.IBO(gl, [0, 1, 2, 3]);
            }).toThrow();
        }
    });

    test('VBO/IBOのdisposeがgl.deleteBufferを呼ぶ', () => {
        let called = false;
        const fakeBuffer = {};
        const gl = createMockGL({
            createBuffer: () => fakeBuffer,
            deleteBuffer: (buf) => {
                expect(buf).toBe(fakeBuffer);
                called = true;
            }
        });
        const vbo = new geometry.VBO(gl, new Float32Array([1, 2, 3]));
        vbo.dispose(gl);
        expect(called).toBe(true);

        const ibo = new geometry.IBO(gl, new Uint32Array([1, 2, 3]));
        ibo.dispose(gl);
        expect(called).toBe(true);
    });
});
