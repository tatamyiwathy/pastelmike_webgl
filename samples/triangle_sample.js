// 頂点シェーダー
const vertexShaderSource = `
            attribute vec3 a_position;
            attribute vec3 a_normal;
            uniform mat4 u_modelViewProjection;
            uniform mat4 u_model;
            uniform mat4 u_view;
            varying vec3 v_normal;
            varying vec3 v_worldPos;
            
            void main() {
                vec4 worldPos = u_model * vec4(a_position, 1.0);
                v_worldPos = worldPos.xyz;
                // 法線はモデル行列の上位3x3を使用（スケール1前提）
                v_normal = mat3(u_model) * a_normal;
                gl_Position = u_modelViewProjection * worldPos;
            }
        `;

// フラグメントシェーダー
const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 u_color;
            uniform vec3 u_lightDir;
            uniform vec3 u_cameraPos;
            varying vec3 v_normal;
            varying vec3 v_worldPos;
            
            void main() {
                vec3 n = normalize(v_normal);
                // ワールド空間での光源方向（固定）
                vec3 lightDir = normalize(u_lightDir);

                // ディフューズ
                float diff = max(dot(n, lightDir), 0.0);
                float light = 0.5 + 2.0 * diff;
                
                // スペキュラ（視線方向とカメラ位置で計算）
                vec3 viewDir = normalize(u_cameraPos - v_worldPos);
                vec3 reflectDir = reflect(-lightDir, n);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
                
                // スペキュラは基本色に白色をブレンド
                vec3 baseColor = u_color.rgb * light;
                vec3 specColor = mix(u_color.rgb, vec3(1.0), 0.3) * spec * 3.0;
                
                gl_FragColor = vec4(baseColor + specColor, u_color.a);
            }
        `;

// シェーダーをコンパイルする関数
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('シェーダーコンパイルエラー:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// シェーダープログラムを作成する関数
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('プログラムリンクエラー:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

// 行列演算のヘルパー関数
const mat4 = {
    // 透視投影行列を作成
    perspective: function (fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        const out = new Float32Array(16);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;
        return out;
    },

    // ビュー行列を作成（カメラの位置と方向）
    // lookAt: function (eye, target, up) {
    //     const zAxis = this.normalize(this.subtract(eye, target));
    //     const xAxis = this.normalize(this.cross(up, zAxis));
    //     const yAxis = this.normalize(this.cross(zAxis, xAxis));

    //     return [
    //         xAxis[0], yAxis[0], zAxis[0], 0,
    //         xAxis[1], yAxis[1], zAxis[1], 0,
    //         xAxis[2], yAxis[2], zAxis[2], 0,
    //         -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
    //     ];
    // },
    lookAt: function (eye, center, up) {
        const f = this.normalize(this.subtract(center, eye)); // forward
        const sVec = this.normalize(this.cross(f, up));  // right
        const uVec = this.cross(sVec, f);

        const out = new Float32Array(16);
        out[0] = sVec[0]; out[4] = sVec[1]; out[8] = sVec[2]; out[12] = -this.dot(sVec, eye);
        out[1] = uVec[0]; out[5] = uVec[1]; out[9] = uVec[2]; out[13] = -this.dot(uVec, eye);
        out[2] = -f[0]; out[6] = -f[1]; out[10] = -f[2]; out[14] = this.dot(f, eye);
        out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
        return out;
    },

    // ベクトルの内積
    dot: function (a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    // 行列の乗算
    multiply: function (a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[k * 4 + i] * b[j * 4 + k];
                }
                result[j * 4 + i] = sum;
            }
        }
        return result;
    },
    // Y軸回転行列
    rotationY: function (angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        const mtx = new Float32Array([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ]);
        return mtx;
    },

    // 任意の軸周りの回転行列（ロドリゲスの回転公式）
    rotationAxis: function (axis, angleInRadians) {
        const [x, y, z] = this.normalize(axis);
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        const t = 1 - c;

        const mtx = new Float32Array([
            t * x * x + c, t * x * y - z * s, t * x * z + y * s, 0,
            t * x * y + z * s, t * y * y + c, t * y * z - x * s, 0,
            t * x * z - y * s, t * y * z + x * s, t * z * z + c, 0,
            0, 0, 0, 1
        ]);
        return mtx;
    },

    // スケーリング行列
    scale: function (x, y, z) {
        return new Float32Array([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    },

    // 平行移動行列
    translation: function (x, y, z) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    },

    // ベクトル演算
    subtract: function (a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    },

    normalize: function (v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    },

    cross: function (a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    },

    // 4x4行列の逆行列を計算
    inverse: function (m) {
        const inv = new Array(16);

        inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
        inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
        inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
        inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
        inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
        inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
        inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
        inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
        inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
        inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
        inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
        inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
        inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
        inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
        inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
        inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

        const det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

        if (det === 0) return null;

        for (let i = 0; i < 16; i++) {
            inv[i] = inv[i] / det;
        }

        return inv;
    },

    // 4x4行列とvec3（w=1想定）の乗算。結果はFloat32Arrayを返す。
    transformVec3: function (m, v) {
        const x = v[0], y = v[1], z = v[2];
        const nx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const ny = m[1] * x + m[5] * y + m[9] * z + m[13];
        const nz = m[2] * x + m[6] * y + m[10] * z + m[14];
        const nw = m[3] * x + m[7] * y + m[11] * z + m[15];
        if (nw !== 0 && nw !== 1) {
            return new Float32Array([nx / nw, ny / nw, nz / nw]);
        }
        return new Float32Array([nx, ny, nz]);
    },

    unit4x4: function () {
        const mtx = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return mtx;
    }
};

// 直方体クラス
class Cube {
    constructor(position, rotationAxis, rotationSpeed, color) {
        this.position = position;  // [x, y, z]
        this.rotationAxis = rotationAxis;  // [x, y, z]
        this.rotationSpeed = rotationSpeed;  // スカラー値
        this.color = color;  // [r, g, b, a]
    }

    // モデル行列を計算（回転値を引数で受け取る）
    getModelMatrix(rotation) {
        const transMtx = mat4.translation(this.position[0], this.position[1], this.position[2]);
        const rotMtx = mat4.rotationAxis(this.rotationAxis, rotation * this.rotationSpeed * 100);
        const scaleMtx = mat4.scale(1.0, 1.0, 1.0);
        return mat4.multiply(transMtx, mat4.multiply(rotMtx, scaleMtx));
    }
}

// 三角形クラス
class Triangle {
    constructor(position, rotationAxis, rotationSpeed, scale, color) {
        this.position = position;  // [x, y, z]
        this.rotationAxis = rotationAxis;  // [x, y, z]
        this.rotationSpeed = rotationSpeed;  // スカラー値
        this.initAngle = Math.random() * Math.PI * 2; // 初期角度をランダムに設定
        this.scale = scale; // [sx, sy, sz]
        this.color = color;  // [r, g, b, a]
    }

    // モデル行列を計算（回転値を引数で受け取る）
    getModelMatrix(rotation) {
        const transMtx = mat4.translation(this.position[0], this.position[1], this.position[2]);
        const rotMtx = mat4.rotationAxis(this.rotationAxis, this.initAngle + rotation * this.rotationSpeed * 2);
        const scaleMtx = mat4.scale(this.scale[0], this.scale[1], this.scale[2]);
        return mat4.multiply(transMtx, mat4.multiply(rotMtx, scaleMtx));
    }

    updateColor(angle) {
        const a = angle % (Math.PI * 2); // 0～2πに正規化
        const d = Math.sqrt(this.position[0] * this.position[0] + this.position[1] * this.position[1] + this.position[2] * this.position[2]);
        const t = d / 40; // 最大距離で1になるように正規化
        const r = t * (Math.PI * 120) / 120 + a;    // 
        const c = pickColor(r);
        this.color = c;
    }
}

// 4x4行列を見やすく表示する関数
function printMatrix(matrix, name = 'Matrix') {
    console.log(`${name}:`);
    for (let i = 0; i < 4; i++) {
        const row = [
            matrix[i * 4 + 0].toFixed(3),
            matrix[i * 4 + 1].toFixed(3),
            matrix[i * 4 + 2].toFixed(3),
            matrix[i * 4 + 3].toFixed(3)
        ];
        console.log(`  [${row.join(', ')}]`);
    }
    console.log('');
}

/**
 * 円周上の角度に応じて R->G->B のグラデーション色を返す関数
 * @param {number} angle - 0～2πの範囲の角度（ラジアン）
 * @returns {Array<number>} [r, g, b, a] の配列（各値は 0.0～1.0）
 */
// function pickColor(angle) {
//     // 角度を 0～1 の範囲に正規化
//     const normalizedAngle = (angle % (Math.PI * 2)) / (Math.PI * 2);
    
//     // 0～1 の範囲を 3分割
//     // 0.0～0.33: R(1,0,0) → G(0,1,0)
//     // 0.33～0.67: G(0,1,0) → B(0,0,1)
//     // 0.67～1.0: B(0,0,1) → R(1,0,0)
    
//     let r, g, b;
    
//     if (normalizedAngle < 0.333) {
//         // R → G
//         const t = normalizedAngle / 0.333;
//         r = 1.0 - t;
//         g = t;
//         b = 0.0;
//     } else if (normalizedAngle < 0.667) {
//         // G → B
//         const t = (normalizedAngle - 0.333) / 0.334;
//         r = 0.0;
//         g = 1.0 - t;
//         b = t;
//     } else {
//         // B → R
//         const t = (normalizedAngle - 0.667) / 0.333;
//         r = t;
//         g = 0.0;
//         b = 1.0 - t;
//     }
    
//     return [r, g, b, 1.0];
// }


/**
 * 色相環から色を取得（HSV→RGB変換）
 * @param {number} angle - 0～2πの範囲の角度（ラジアン）
 * @returns {Array<number>} [r, g, b, a] の配列（各値は 0.0～1.0）
 */
function pickColor(angle) {
    // 角度を0～360度の色相に変換
    const hue = ((angle % (Math.PI * 2)) / (Math.PI * 2)) * 360;
    
    // HSV (彩度=1, 明度=1) → RGB 変換
    const c = 1; // chroma
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    
    let r, g, b;
    if (hue < 60) { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return [r, g, b, 1.0];
}

// メイン関数
function main() {
    const canvas = document.getElementById('canvas');
    const objSlider = document.getElementById('obj-slider');
    const objCountLabel = document.getElementById('obj-count');
    const overlayText = document.getElementById('overlay-text');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext('webgl', { alpha: true });

    if (!gl) {
        alert('WebGLがサポートされていません');
        return;
    }

    // ウィンドウリサイズ時に対応
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });

    // シェーダーをコンパイル
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
        return;
    }

    // プログラムを作成
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        return;
    }

    // 属性とuniformの場所を取得
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const normalAttributeLocation = gl.getAttribLocation(program, 'a_normal');
    const matrixUniformLocation = gl.getUniformLocation(program, 'u_modelViewProjection');
    const modelUniformLocation = gl.getUniformLocation(program, 'u_model');
    const viewUniformLocation = gl.getUniformLocation(program, 'u_view');
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const lightDirUniformLocation = gl.getUniformLocation(program, 'u_lightDir');
    const cameraPosUniformLocation = gl.getUniformLocation(program, 'u_cameraPos');

    // 直方体の頂点データ（中心が原点）
    const vertices = new Float32Array([
        // 前面
        -0.5, -0.5, 0.5,   // 左下
        0.5, -0.5, 0.5,    // 右下
        0.5, 0.5, 0.5,     // 右上
        -0.5, 0.5, 0.5,    // 左上

        // 背面
        -0.5, -0.5, -0.5,  // 左下
        0.5, -0.5, -0.5,   // 右下
        0.5, 0.5, -0.5,    // 右上
        -0.5, 0.5, -0.5    // 左上
    ]);

    // 頂点法線（中心からの方向で近似）
    const normals = new Float32Array([
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1
    ]);

    // ポリゴン描画用（三角形リスト）のインデックス
    const indices = new Uint16Array([
        // 前面 (+Z)
        0, 1, 2, 0, 2, 3,
        // 背面 (-Z)
        5, 4, 7, 5, 7, 6,
        // 左面 (-X)
        4, 0, 3, 4, 3, 7,
        // 右面 (+X)
        1, 5, 6, 1, 6, 2,
        // 上面 (+Y)
        3, 2, 6, 3, 6, 7,
        // 底面 (-Y)
        4, 5, 1, 4, 1, 0
    ]);

    // 頂点バッファを作成
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 法線バッファを作成
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    // インデックスバッファを作成
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // 直角三角形の頂点データ（30-60-90度の直角三角形）
    // 辺の比は 1 : √3 : 2
    // 斜辺を2として、短辺1、長辺√3
    const sqrt3 = Math.sqrt(3);
    const triangleVertices = new Float32Array([
        0, 0, 0,           // 直角の頂点（原点）
        1, 0, 0,           // 短辺方向の頂点（長さ1）
        0, sqrt3, 0        // 長辺方向の頂点（長さ√3）
    ]);

    // 三角形の法線（Z軸方向）
    const triangleNormals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ]);

    // 三角形のインデックス
    const triangleIndices = new Uint16Array([
        0, 1, 2
    ]);

    // 三角形バッファを作成
    const trianglePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    const triangleNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleNormals, gl.STATIC_DRAW);

    const triangleIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);

    // 軸の頂点データ（原点から各軸の正方向へ）
    const axisVertices = new Float32Array([
        // X軸: 赤
        -20, 0, 0, 20, 0, 0,
        // Y軸: 緑
        0, -20, 0, 0, 20, 0,
        // Z軸: 青
        0, 0, -20, 0, 0, 20
    ]);
    const axisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);

    // XZ平面のメッシュ線（グリッド）
    const gridSize = 20;
    const gridVertices = [];
    for (let i = -gridSize; i <= gridSize; i++) {
        // Z方向の線
        gridVertices.push(i, 0, -gridSize);
        gridVertices.push(i, 0, gridSize);
        // X方向の線
        gridVertices.push(-gridSize, 0, i);
        gridVertices.push(gridSize, 0, i);
    }
    const gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);


    // 描画設定
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // =========================
    // 描画セットアップ
    // =========================
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.lineWidth(1.0); // ブラウザ依存

    // =========================

    // アニメーション変数
    let rotation = 0;

    // 色情報
    const colors = [
        [0, 0, 1, 1],//青
        [1, 0, 0, 1],//赤
        [0, 1, 0, 1],//緑
        [1, 1, 0, 1],//黄
        [1, 0, 1, 1],//紫
        [0, 1, 1, 1]  //水色
    ];

    // Cubeインスタンスの配列
    let cubes = [];
    let objNum = 10000; // 初期表示オブジェクト数

    function initCubes(count) {
        if (objCountLabel) objCountLabel.textContent = String(count);
        if (overlayText) overlayText.textContent = `Objs: ${count}`;

        // 新しいCubeインスタンスを生成
        cubes = [];
        for (let i = 0; i < count; i++) {
            const position = [
                Math.random() * 40.0 - 20.0,
                Math.random() * 40.0 - 20.0,
                Math.random() * 40.0 - 20.0
            ];
            const rotationAxis = [
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ];

            // // 原点からposiotonの距離
            // const distance = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
            // // 距離に比例して青から赤にグラデーションさせる
            // const t = distance / 40; // 最大距離で1になるように正規化
            // const c = [
            //     (1 - t) * 1 + t * 0, // 青成分
            //     0,
            //     (1 - t) * 0 + t * 1, // 赤成分
            //     1
            // ];

            const rotationSpeed = Math.random() * 2 + 1;

            const angle = Math.atan2(position[1], position[0]) + Math.PI; // 0～2πに変換
            const c = pickColor(angle);            
            cubes.push(new Cube(position, rotationAxis, rotationSpeed, c));
        }
    }

    let triangles = [];
    function initTriangles(count) {
        if (objCountLabel) objCountLabel.textContent = String(count);
        triangles = [];
        for (let i = 0; i < count; i++) {
            // 半径40の球内のランダム位置
            const radius = Math.random() * 40; // 0～40のランダム
            const theta = Math.random() * Math.PI * 2; // 0～2πのランダム
            const phi = Math.acos(Math.random() * 2 - 1); // 0～πのランダム（球面均等分布）
            
            const position = [
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            ];
            
            const rotationAxis = [
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ];


            
            const rotationSpeed = Math.random() * 2 + 1;


            const d = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
            const t = d / 40; // 最大距離で1になるように正規化
            const r = t * Math.PI / 2;
            const c = pickColor(0);  
            
            const s = Math.min(t + 0.25, 2.0); // スケールを距離に応じて変化（0.5～2.0）

            triangles.push(new Triangle(position, rotationAxis, rotationSpeed, [s, s, s], c));
        }
    }

    // initCubes(objNum);
    initTriangles(objNum);

    // スライダーのイベント設定（最大値100000、初期値10000）
    if (objSlider) {
        objSlider.max = '100000';
        objSlider.value = String(objNum);
        objSlider.addEventListener('input', (e) => {
            const val = Math.min(100000, parseInt(e.target.value, 10));
            initTriangles(val);
        });
    }

    // カメラ距離の制御
    let cameraDistance = 20.0;
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.005;
        cameraDistance = Math.max(1.0, Math.min(cameraDistance, 50.0));
    });

    gl.uniform3f(lightDirUniformLocation, 0.5, -1.0, 0.3);

    function render() {
        rotation += 0.001;

        // 画面をクリア
        gl.clearColor(0, 0, 0, 0.5);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // プログラムを使用
        gl.useProgram(program);

        // === 毎フレーム行列を生成 ===
        // 投影行列
        const aspect = canvas.width / canvas.height;
        const projectionMatrix = mat4.perspective(Math.PI / 2, aspect, 0.1, 100.0);
        // ビュー行列（カメラをY軸中心で回転、距離は可変）
        const cameraPos = mat4.transformVec3(
            mat4.rotationY(rotation),
            [0, 1.5, cameraDistance]);
        const viewMatrix = mat4.lookAt(
            cameraPos,
            [0, 0, 0],
            [0, 1, 0]
        );
        const pvMatrix = mat4.multiply(projectionMatrix, viewMatrix);

        // // 直方体の描画
        // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(positionAttributeLocation);
        // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        // gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(normalAttributeLocation);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // for (let i = 0; i < cubeNum; i++) {
        //     const cube = cubes[i];
        //     const modelMtx = cube.getModelMatrix(rotation);

        //     gl.uniform3f(cameraPosUniformLocation, cameraPos[0], cameraPos[1], cameraPos[2]);
        //     gl.uniformMatrix4fv(matrixUniformLocation, false, pvMatrix);
        //     gl.uniformMatrix4fv(modelUniformLocation, false, modelMtx);
        //     gl.uniform4f(colorUniformLocation, cube.color[0], cube.color[1], cube.color[2], cube.color[3]);
        //     gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        // }

        // 三角形の描画
        gl.bindBuffer(gl.ARRAY_BUFFER, trianglePositionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleNormalBuffer);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);

        for (let i = 0; i < triangles.length; i++) {
            const triangle = triangles[i];
            const modelMtx = triangle.getModelMatrix(rotation);
            triangle.updateColor(rotation * 5);

            gl.uniform3f(cameraPosUniformLocation, cameraPos[0], cameraPos[1], cameraPos[2]);
            gl.uniformMatrix4fv(matrixUniformLocation, false, pvMatrix);
            gl.uniformMatrix4fv(modelUniformLocation, false, modelMtx);
            gl.uniform4f(colorUniformLocation, triangle.color[0], triangle.color[1], triangle.color[2], triangle.color[3]);
            gl.drawElements(gl.TRIANGLES, triangleIndices.length, gl.UNSIGNED_SHORT, 0);
        }

        // {
        //     const mvpMatrix = mat4.multiply(projectionMatrix, viewMatrix);
        //     // グリッド描画（法線不要）
        //     gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
        //     gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        //     gl.enableVertexAttribArray(positionAttributeLocation);
        //     gl.disableVertexAttribArray(normalAttributeLocation);
        //     gl.uniformMatrix4fv(matrixUniformLocation, false, mvpMatrix);
        //     const identity = mat4.unit4x4();
        //     gl.uniformMatrix4fv(modelUniformLocation, false, identity); // モデル行列をリセット
        //     for (let i = 0; i < gridVertices.length / 3; i += 2) {
        //         gl.uniform4f(colorUniformLocation, 0.3, 0.3, 0.3, 1.0);
        //         gl.drawArrays(gl.LINES, i, 2);
        //     }
        // }

        // {
        //     // 軸線の描画（法線不要）
        //     gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
        //     gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        //     gl.enableVertexAttribArray(positionAttributeLocation);
        //     gl.disableVertexAttribArray(normalAttributeLocation);
        //     gl.uniformMatrix4fv(modelUniformLocation, false, mat4.unit4x4()); // モデル行列をリセット
        //     gl.uniformMatrix4fv(matrixUniformLocation, false, pvMatrix);
        //     // X軸（赤）
        //     gl.uniform4f(colorUniformLocation, 1.0, 0.0, 0.0, 1.0);
        //     gl.drawArrays(gl.LINES, 0, 2);
        //     // Y軸（緑）
        //     gl.uniform4f(colorUniformLocation, 0.0, 1.0, 0.0, 1.0);
        //     gl.drawArrays(gl.LINES, 2, 2);
        //     // Z軸（青）
        //     gl.uniform4f(colorUniformLocation, 0.0, 0.5, 1.0, 1.0);
        //     gl.drawArrays(gl.LINES, 4, 2);

        // }

        // 次のフレームを要求
        requestAnimationFrame(render);
    }

    // 描画開始
    render();
}

// ページが読み込まれたら実行
window.onload = main;