class VBO {
    constructor(gl, array) {
        if (!(array instanceof Float32Array)) {
            throw new Error('VBO: Float32Arrayではありません');
        }
        this.array = array;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    }
}

class IBO {
    constructor(gl, array) {
        if (!(array instanceof Uint32Array)) {
            throw new Error('IBO: Uint32Arrayではありません');
        }
        this.array = array;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
    }
}

class Geometry {
    constructor(gl, vertices, normals, uvs, indices) {
        this.v_vbo = vertices ? new VBO(gl, vertices) : null;
        this.n_vbo = normals ? new VBO(gl, normals) : null;
        this.uv_vbo = uvs ? new VBO(gl, uvs) : null;
        this.tri_ibo = indices ? new IBO(gl, indices) : null;
        this.tri_indices_len = indices ? indices.length : 0;
        this.wire_ibo = indices ? new IBO(gl, this.generateIndexForWireframe(indices)) : null;
        this.wire_indices_len = this.wireIndices ? this.wireIndices.length : 0;
    }
    generateIndexForWireframe(indices) {
        if (!indices) {
            return null;
        }
        const wireframeIndices = [];
        const edgeSet = {};
        for (let i = 0; i < indices.length / 3; ++i) {
            const t0 = indices[i * 3];
            const t1 = indices[i * 3 + 1];
            const t2 = indices[i * 3 + 2];

            const key1 = t0 < t1 ? `${t0}_${t1}` : `${t1}_${t0}`;
            const key2 = t1 < t2 ? `${t1}_${t2}` : `${t2}_${t1}`;
            const key3 = t2 < t0 ? `${t2}_${t0}` : `${t0}_${t2}`;

            if (!(key1 in edgeSet)) {
                edgeSet[key1] = true;
                wireframeIndices.push(t0);
                wireframeIndices.push(t1);
            }
            if (!(key2 in edgeSet)) {
                edgeSet[key2] = true;
                wireframeIndices.push(t1);
                wireframeIndices.push(t2);
            }
            if (!(key3 in edgeSet)) {
                edgeSet[key3] = true;
                wireframeIndices.push(t2);
                wireframeIndices.push(t0);
            }

        }
        this.wireIndices = wireframeIndices;
        return new Uint32Array(wireframeIndices);
    }
}


class PointGeometry extends Geometry {
    constructor(gl) {
        super(gl, new Float32Array([0, 0, 0]), null, null, null);
    }
}

function create_torus_geometory(gl, radius = 1, tubeRadius = 0.4, radialSegments = 32, tubularSegments = 24) {
    const vertices = [];
    const normals = [];
    const indices = [];



    for (let j = 0; j <= radialSegments; j++) {
        for (let i = 0; i <= tubularSegments; i++) {
            const u = i / tubularSegments * Math.PI * 2;
            const v = j / radialSegments * Math.PI * 2;
            const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
            const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
            const z = tubeRadius * Math.sin(v);
            vertices.push(x, y, z);
            const nx = Math.cos(v) * Math.cos(u);
            const ny = Math.cos(v) * Math.sin(u);
            const nz = Math.sin(v);
            normals.push(nx, ny, nz);
        }
    }

    for (let j = 1; j <= radialSegments; j++) {
        for (let i = 1; i <= tubularSegments; i++) {
            const a = (tubularSegments + 1) * j + i - 1;
            const b = (tubularSegments + 1) * (j - 1) + i - 1;
            const c = (tubularSegments + 1) * (j - 1) + i;
            const d = (tubularSegments + 1) * j + i;
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }
    return new Geometry(gl, new Float32Array(vertices), new Float32Array(normals), null, new Uint32Array(indices));
}

function create_sphere_geometry(gl, radius = 1, sectors = 32, rings = 16) {
    const vertices = [];
    const normals = [];
    const indices = [];

    for (let i = 0; i <= rings; i++) { // 緯度方向
        const phi = Math.PI * i / rings - Math.PI / 2.0;
        for (let j = 0; j <= sectors; j++) { // 経度方向
            const theta = 2.0 * Math.PI * j / sectors;

            // 頂点座標 (Position)
            const x = radius * Math.cos(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi);
            const z = radius * Math.cos(phi) * Math.sin(theta);
            vertices.push(x, y, z);

            // 法線ベクトル (Normal)
            // 中心が(0,0,0)なら、座標を半径で割るだけで「外向きの法線」になる
            const nx = x / radius;
            const ny = y / radius;
            const nz = z / radius;
            normals.push(nx, ny, nz);
        }
    }

    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < sectors; j++) {
            const first = (i * (sectors + 1)) + j;
            const second = first + sectors + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);

        }
    }

    return new Geometry(gl, new Float32Array(vertices), new Float32Array(normals), null, new Uint32Array(indices));
}

function createMeshData(vtx, nrm, faces) {

    const boxVertices = [];
    const boxNormals = [];
    const boxIndices = [];
    let index = 0;
    for (let face of faces) {
        for (let i = 0; i < face.length; i++) {
            const vi = face[i][0] - 1;
            const ni = face[i][1] - 1;
            const v = vtx[vi];
            const n = nrm[ni];
            boxVertices.push(v[0], v[1], v[2]);
            boxNormals.push(n[0], n[1], n[2]);
            boxIndices.push(index++);
        }
    }

    const uvs = new Float32Array();

    return [new Float32Array(boxVertices), new Float32Array(boxNormals), uvs, new Uint32Array(boxIndices)];
}

function create_cube_geometry(gl, width, height, depth, inverted = false) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertex = [
        // 背面
        [-w, -h, -d], // 4
        [w, -h, -d],  // 5
        [w, h, -d],   // 6
        [-w, h, -d],   // 7
        // 前面
        [-w, -h, d],  // 0
        [w, -h, d],   // 1
        [w, h, d],    // 2
        [-w, h, d],   // 3
    ];

    const normals = [

        [0, 0, -1],  // 後
        [0, 0, 1],  // 前
        [0, -1, 0],   // 下
        [0, 1, 0],   // 上
        [-1, 0, 0],  // 左
        [1, 0, 0],  // 右
    ];

    // 各面ごとの頂点データ
    // 添え字は１始まりに注意
    const faces = [
        // back (-Z)
        [
            [1, 1], [3, 1], [2, 1],
            [1, 1], [4, 1], [3, 1],
        ],

        // front (+Z)
        [
            [5, 2], [6, 2], [7, 2],
            [5, 2], [7, 2], [8, 2],
        ],
        // bottom (-Y)
        [
            [1, 3], [2, 3], [6, 3],
            [1, 3], [6, 3], [5, 3],
        ],

        // top (+Y)
        [
            [4, 4], [8, 4], [7, 4],
            [4, 4], [7, 4], [3, 4],
        ],

        // left (-X)
        [
            [1, 5], [8, 5], [4, 5],
            [1, 5], [5, 5], [8, 5],
        ],

        // right (+X)
        [
            [2, 6], [3, 6], [7, 6],
            [2, 6], [7, 6], [6, 6],
        ]
    ]

    if (inverted) {
        // 面の向きを反転
        for (let i = 0; i < faces.length; i++) {
            faces[i] = faces[i].reverse();
        }

        for (let i = 0; i < normals.length; i++) {
            normals[i] = normals[i].map(v => -v);
        }
    }

    return new Geometry(gl, ...createMeshData(vertex, normals, faces));
}


function create_plain_geometry(gl, size) {

    // 床パネルの頂点データ（白色パネル、Y = 0）
    const vertex = [
        [-size, 0, -size],  // 0
        [size, 0, -size],   // 1
        [size, 0, size],    // 2
        [-size, 0, size]    // 3
    ];

    // 床パネルの法線データ（上向き）
    const normals = [
        [0, 1, 0],  // 0
    ];

    // 床パネルのインデックス（2つの三角形で四角形を構成）
    const faces = [
        [[1, 1], [3, 1], [2, 1]],  // 最初の三角形
        [[1, 1], [4, 1], [3, 1]]   // 2番目の三角形
    ];



    return new Geometry(gl, ...createMeshData(vertex, normals, faces));
}

function create_triangle_geometry(gl) {

    const vertex = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0
    ])

    const normal = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ])

    const index = new Uint32Array([
        0, 1, 2
    ]);

    return new Geometry(gl, vertex, normal, null, index);
}

export { Geometry, PointGeometry, create_torus_geometory, create_sphere_geometry, create_cube_geometry, create_plain_geometry, create_triangle_geometry };