import { variable_validation } from "./utils.js";
import { Material } from "./material.js";

const ShaderName = {
    BASIC: 'basic',
    PARTICLE: 'particle',
    SKYBOX: 'skybox',
    SIMPLE: 'simple',
    SIMPLETEX: 'simpletex',
};

// シンプルシェーダー
const simpleVertexShaderSource = `
    in vec3 position;
    uniform mat4 mvpMtx;

    void main() {
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;

const simpleFragmentShaderSource = `
    precision mediump float;

    uniform vec4 color;
    
    out vec4 outColor;
    
    void main() {
        outColor = color;
    }
`;

const simpleTextureVertexShaderSource = `
    in vec3 position;
    in vec2 texcoord; // UV座標
    uniform mat4 mvpMtx;
    out vec2 v_texcoord; // フラグメントシェーダーへ渡すUV座標

    void main() {
        v_texcoord = texcoord; // そのままフラグメントシェーダーへ
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;
const simpleTextureFragmentShaderSource = `
precision mediump float;

// ユニフォーム変数
uniform sampler2D samples; // 貼り付ける画像データ
uniform float u_alpha;       // 透明度（必要に応じて）

// 頂点シェーダーから受け取る変数
in vec2 v_texcoord;          // 頂点シェーダーから届いたUV座標

// 出力する色
out vec4 outColor;

void main() {
    // 1. v_texcoord（UV座標）を使ってテクスチャの色をそのまま取り出す
    vec4 texColor = texture(samples, v_texcoord);

    // 2. 取り出した色をそのまま出力（ライト計算なし）
    outColor = texColor;
    
    // もし全体の透明度を調整したい場合は以下のようにします
    // outColor.a *= u_alpha;
}
`;

// ディフューズ・スペキュラ・フォグ対応頂点シェーダー
const vertexShaderSource = `
    precision mediump float;

    uniform mat4 mvpMtx;
    uniform mat4 modelMatrix;
    uniform mat4 normalMatrix;
    uniform mat4 viewMatrix;
    uniform vec3 directionalLightDir;  // 光の方向

    in vec3 position;
    in vec3 normal;
    in vec2 texcoord; // UV座標 (vt)    

    out vec3 v_worldPosition;
    out vec3 v_normal;
    out vec3 v_directionalLightDir;    
    out float v_depth; // fog
    out vec2 v_texcoord; // UV座標 (vt)

    void main() {
        // 位置をワールド座標に変換 (modelMatrixを掛ける)
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        v_worldPosition = worldPosition.xyz;

        v_normal = normalize(mat3(normalMatrix) * normal);

        v_directionalLightDir = directionalLightDir;

        v_texcoord = texcoord; // そのままフラグメントシェーダーへ

#ifdef USE_FOG
        vec4 viewPosition = viewMatrix * worldPosition;
        v_depth = length(viewPosition.xyz);
#endif
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    uniform vec3 cameraPos;
    uniform vec4 color;
    uniform bool useTexture;
    uniform sampler2D samples; // CPU側からバインドされたテクスチャデータ

    // フォグ
    uniform vec4 fogColor;
    uniform float fogStart;
    uniform float fogEnd;

    // ライト
    uniform float shininess;
    uniform vec3 directionalLightColor;
    uniform vec3 pointLightPosition;    // 点光源の位置
    uniform vec3 pointLightColor;       // 点光源の色
    // uniform vec3 viewPosition;     // カメラ位置 cameraPosで代用
    uniform float constant, linear, quadratic; // 減衰係数
    uniform bool usePointLight;
    uniform vec3 ambientLightColor;


    in vec3 v_worldPosition;
    in vec3 v_normal;
    in vec3 v_directionalLightDir;
    in float v_depth;
    in vec2 v_texcoord;   // 頂点シェーダーから届いたUV
    
    out vec4 outColor;
    
    void main() {
        // ベクトルの正規化
        vec3 N = normalize(v_normal);
        vec3 Ld = normalize(v_directionalLightDir);
        vec3 Lp = normalize(pointLightPosition - v_worldPosition); // 点光源から頂点への方向ベクトル
        vec3 V = normalize(cameraPos - v_worldPosition); // 視線方向

        // ポイントライト
        vec3 diffuseP = vec3(0.0);
        if (usePointLight) {
            float diffP = max(dot(N, Lp), 0.0);
            float distance = length(pointLightPosition - v_worldPosition);
            float attenuation = 1.0 / (constant + linear * distance + quadratic * (distance * distance));
            diffuseP = diffP * pointLightColor * attenuation;
        }
        // 平行光源
        float diffD = max(dot(N, Ld), 0.0);
        //vec3 diffuseColor = color.rgb * directionalLightColor * (diff * 0.7 + 0.25);
        vec3 diffuseD = diffD * directionalLightColor;

        vec3 diffuse = diffuseD + diffuseP;
#ifdef USE_SPECULAR
        // --- 2. スペキュラ (Specular: Phong反射モデル) ---
        vec3 R = reflect(-Ld, N); // 光の反射ベクトル
        float specStrength = pow(max(dot(R, V), 0.0), shininess); // 32.0は輝きの鋭さ
        vec3 specularColor = vec3(1.0) * specStrength; // 白色のハイライト
#else
        vec3 specularColor = vec3(0.0);
#endif

        // 最終的な色の合成
        vec3 combinedColor;
        if (useTexture) {
            // 頂点シェーダーから渡されたUV座標をそのまま使う
            combinedColor = texture(samples, v_texcoord).rgb * color.rgb;
        } else {
            combinedColor = (diffuseD + diffuseP + specularColor) * color.rgb;
        }
        combinedColor += ambientLightColor * color.rgb;

        outColor = vec4(combinedColor, color.a);

        // --- 3. フォグ (Fog) ---
#ifdef USE_FOG
        float fogFactor = (fogEnd - v_depth) / (fogEnd - fogStart);
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        outColor.rgb = mix(fogColor.rgb, outColor.rgb, fogFactor);
#endif
    }
`;

// パーティクル用頂点シェーダー
const particleVertexShaderSource = `
            in vec3 position;
            uniform mat4 mvpMtx;
            uniform float pointSize;
            
            void main() {
                gl_Position = mvpMtx * vec4(position, 1.0);
                gl_PointSize = pointSize;
            }
        `;

// パーティクル用フラグメントシェーダー
const particleFragmentShaderSource = `
            precision mediump float;
            uniform vec3 particleColor;
            uniform float alphaScale;
            out vec4 outColor;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= alphaScale; // 淡く光る効果
                outColor = vec4(particleColor, alpha);
            }
        `;

const skybox_vertexShaderSource = `

precision highp float;

in vec3 position;
uniform mat4 viewDirectionProjectionMatrix;
uniform mat4 viewMatrix;
out vec3 v_texCoord;
out float v_depth; // fog

void main() {
    // 頂点の座標をテクスチャ座標（方向ベクトル）として使用
    v_texCoord = position;

#ifdef USE_FOG
    vec4 viewPosition = viewMatrix * vec4(position, 1.0);
    v_depth = length(viewPosition.xyz);   // fog
#endif

    // 位置をクリップ空間へ変換
    vec4 clipPos = viewDirectionProjectionMatrix * vec4(position, 1.0);
    
    // スカイボックスを「無限遠」にあるように見せるトリック
    // W成分と同じZ成分を設定することで、クリップ空間でZ=Wに固定され、深度テストに合格しつつ、遠くにあるように見える
    gl_Position = clipPos.xyww;
    
}
`;

const skybox_fragmentShaderSource = `
precision highp float;
precision mediump int;

uniform samplerCube u_skybox;
uniform vec4 fogColor; // フォグの色 (e.g., vec3(0.5, 0.5, 0.5))
uniform float fogStart; // フォグが始まる距離
uniform float fogEnd; // フォグが完全に不透明になる距離

in vec3 v_texCoord;
in float v_depth; // fog
out vec4 fragColor;

void main() {
    // 方向ベクトルを使ってキューブマップから色をサンプリング
    // GLSL ES 3.00 では textureCube() の代わりに texture() を使用 (サンプラータイプで自動判別)
    fragColor = texture(u_skybox, v_texCoord); // 【修正点 4】

#ifdef USE_FOG
    vec3 finalColor = mix(fogColor.rgb , fragColor.rgb, fogColor.a);
#else
    vec3 finalColor = fragColor.rgb;
#endif

    fragColor = vec4(finalColor, 1.0);
}
`;

class ShaderProgram {
    constructor(gl, name, vertexSource, fragmentSource) {
        this.name = name;
        this.program = null;
        if (vertexSource && fragmentSource) {
            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
            this.program = this.createProgram(gl, vertexShader, fragmentShader);
        }
    }
    useProgram(gl) {
        gl.useProgram(this.program);
    }
    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    render() { }
}

class SimpleShader extends ShaderProgram {
    constructor(gl, shaderConfigs) {
        super(gl, ShaderName.SIMPLE, shaderConfigs + simpleVertexShaderSource, shaderConfigs + simpleFragmentShaderSource);

        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.mvpMtxLocation = gl.getUniformLocation(this.program, 'mvpMtx');
        this.colorLocation = gl.getUniformLocation(this.program, 'color');
    }

    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        variable_validation(geometry);
        variable_validation(geometry.wire_indices_len);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.mvpMtxLocation, false, renderContext.modelViewProjection);
        gl.uniform4f(this.colorLocation, renderContext.color[0], renderContext.color[1], renderContext.color[2], renderContext.color[3]);

        if (renderContext.wireFrame) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.wire_ibo.buffer);
            gl.drawElements(gl.LINES, geometry.wire_indices_len, gl.UNSIGNED_INT, 0);
        }
        else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.tri_ibo.buffer);
            gl.drawElements(gl.TRIANGLES, geometry.tri_indices_len, gl.UNSIGNED_INT, 0);
        }
    }
}

class SimpleTextureShader extends ShaderProgram {
    constructor(gl, shaderConfigs) {
        super(gl, ShaderName.SIMPLETEX, shaderConfigs + simpleTextureVertexShaderSource, shaderConfigs + simpleTextureFragmentShaderSource);

        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'texcoord');

        this.mvpMtxLocation = gl.getUniformLocation(this.program, 'mvpMtx');
        this.samplesLocation = gl.getUniformLocation(this.program, 'samples');
    }

    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        if (renderContext.blendMode !== Material.BlendMode.NONE) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        if (geometry.uv_vbo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.uv_vbo.buffer);
            gl.enableVertexAttribArray(this.texcoordLocation); // シェーダー内の a_texcoord の位置
            gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0); // UVは2要素(U, V)
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderContext.textures);
        gl.uniform1i(this.samplesLocation, 0);

        gl.uniformMatrix4fv(this.mvpMtxLocation, false, renderContext.modelViewProjection);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.tri_ibo.buffer);
        gl.drawElements(gl.TRIANGLES, geometry.tri_indices_len, gl.UNSIGNED_INT, 0);
    }
}



class BasicShader extends ShaderProgram {
    constructor(gl, shaderConfigs) {
        super(gl, ShaderName.BASIC, shaderConfigs + vertexShaderSource, shaderConfigs + fragmentShaderSource);

        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.normalLocation = gl.getAttribLocation(this.program, 'normal');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'texcoord'); // UV座標 (vt)

        this.mvpMtxLocation = gl.getUniformLocation(this.program, 'mvpMtx');
        this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');
        // this.viewProjectionMatrixLocation =  gl.getUniformLocation(this.program, 'viewProjectionMatrix');
        // this.projectionMatrixLocation =  gl.getUniformLocation(this.program, 'projectionMatrix');
        this.viewMatrixLocation = gl.getUniformLocation(this.program, 'viewMatrix');
        this.normalMatrixLocation = gl.getUniformLocation(this.program, 'normalMatrix');
        this.directionalLightDirLocation = gl.getUniformLocation(this.program, 'directionalLightDir');
        this.directionalLightColorLocation = gl.getUniformLocation(this.program, 'directionalLightColor');
        this.colorLocation = gl.getUniformLocation(this.program, 'color');
        this.cubeMapLocation = gl.getUniformLocation(this.program, 'uCubeMap');
        this.useTextureLocation = gl.getUniformLocation(this.program, 'useTexture');
        this.fogColorLocation = gl.getUniformLocation(this.program, 'fogColor'); // フォグの色 (e.g., vec3(0.5, 0.5, 0.5))
        this.fogStartLocation = gl.getUniformLocation(this.program, 'fogStart'); // フォグが始まる距離
        this.fogEndLocation = gl.getUniformLocation(this.program, 'fogEnd'); // フォグが完全に不透明になる距離
        this.cameraPosLocation = gl.getUniformLocation(this.program, 'cameraPos'); // 追加：カメラのワールド座標
        this.shininessLocation = gl.getUniformLocation(this.program, 'shininess'); // 追加：鏡面反射の鋭さ
        this.samplesLocation = gl.getUniformLocation(this.program, 'samples'); // テクスチャサンプラー
        this.pointLightPositionLocation = gl.getUniformLocation(this.program, 'pointLightPosition'); // 点光源の位置
        this.pointLightColorLocation = gl.getUniformLocation(this.program, 'pointLightColor'); // 点光源の色
        this.constantLocation = gl.getUniformLocation(this.program, 'constant'); // 減衰係数（定数項）
        this.linearLocation = gl.getUniformLocation(this.program, 'linear'); // 減衰係数（一次項）
        this.quadraticLocation = gl.getUniformLocation(this.program, 'quadratic'); // 減衰係数（二次項）
        this.usePointLightLocation = gl.getUniformLocation(this.program, 'usePointLight');
        this.ambientLightColorLocation = gl.getUniformLocation(this.program, 'ambientLightColor'); // 環境光の色
    }

    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        if (geometry.n_vbo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.n_vbo.buffer);
            gl.enableVertexAttribArray(this.normalLocation);
            gl.vertexAttribPointer(this.normalLocation, 3, gl.FLOAT, false, 0, 0);
        }

        if (geometry.uv_vbo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.uv_vbo.buffer);
            gl.enableVertexAttribArray(this.texcoordLocation); // シェーダー内の a_texcoord の位置
            gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0); // UVは2要素(U, V)
        }


        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderContext.textures);
        gl.uniform1i(this.samplesLocation, 0);

        gl.uniformMatrix4fv(this.mvpMtxLocation, false, renderContext.modelViewProjection);
        gl.uniformMatrix4fv(this.modelMatrixLocation, false, renderContext.modelMatrix);
        gl.uniformMatrix4fv(this.normalMatrixLocation, false, renderContext.normalMatrix);
        //gl.uniformMatrix4fv(this.viewProjectionMatrixLocation, false, renderContext.viewProjectionMatrix);
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, renderContext.viewMatrix);
        //gl.uniformMatrix4fv(this.projectionMatrixLocation, false, renderContext.projectionMatrix);
        gl.uniform4f(this.colorLocation, ...renderContext.color);
        gl.uniform1i(this.useTextureLocation, renderContext.useTexture);
        gl.uniform3f(this.cameraPosLocation, ...renderContext.cameraPos); // 追加：カメラのワールド座標
        gl.uniform1f(this.shininessLocation, renderContext.shininess); // 追加：鏡面反射の鋭さ

        // フォグ関連のユニフォーム変数を設定
        gl.uniform4f(this.fogColorLocation, ...renderContext.fogColor); // フォグの色
        gl.uniform1f(this.fogStartLocation, renderContext.fogStart); // フォグが始まる距離
        gl.uniform1f(this.fogEndLocation, renderContext.fogEnd); // フォグが完全に不透明になる距離

        // 平行光源関連のユニフォーム変数を設定
        gl.uniform3f(this.directionalLightDirLocation, ...renderContext.directionalLightDir); // 平行光源
        gl.uniform3f(this.directionalLightColorLocation, ...renderContext.directionalLightColor); // 白色光源

        // 点光源関連のユニフォーム変数を設定
        gl.uniform3f(this.pointLightPositionLocation, ...renderContext.pointLightPosition); // 点光源の位置
        gl.uniform3f(this.pointLightColorLocation, ...renderContext.pointLightColor); // 点光源の色
        gl.uniform1f(this.constantLocation, renderContext.constant); // 減衰係数（定数項）
        gl.uniform1f(this.linearLocation, renderContext.linear); // 減衰係数（一次項）
        gl.uniform1f(this.quadraticLocation, renderContext.quadratic); // 減衰係数（二次項）
        gl.uniform1i(this.usePointLightLocation, renderContext.usePointLight); // 点光源の使用有無

        // 環境光の設定
        gl.uniform3f(this.ambientLightColorLocation, ...renderContext.ambientLightColor); // 環境光の色

        if (renderContext.wireFrame) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.wire_ibo.buffer);
            gl.drawElements(gl.LINES, geometry.wire_indices_len, gl.UNSIGNED_INT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.tri_ibo.buffer);
            gl.drawElements(gl.TRIANGLES, geometry.tri_indices_len, gl.UNSIGNED_INT, 0);
        }
    }
}


class SkyBoxShader extends ShaderProgram {
    constructor(gl, shaderConfigs) {
        super(gl, ShaderName.SKYBOX, shaderConfigs + skybox_vertexShaderSource, shaderConfigs + skybox_fragmentShaderSource);

        this.position = gl.getAttribLocation(this.program, 'position')
        this.viewDirectionProjectionMatrix = gl.getUniformLocation(this.program, 'viewDirectionProjectionMatrix');
        this.viewMatrix = gl.getUniformLocation(this.program, 'viewMatrix');

        this.skybox = gl.getUniformLocation(this.program, 'u_skybox');
        this.fogColor = gl.getUniformLocation(this.program, 'fogColor'); // フォグの色
        this.fogStart = gl.getUniformLocation(this.program, 'fogStart'); // フォグが始まる距離
        this.fogEnd = gl.getUniformLocation(this.program, 'fogEnd'); // フォグが完全に不透明になる距離

    }


    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // ユニフォーム変数の設定
        gl.uniformMatrix4fv(this.viewDirectionProjectionMatrix,false,renderContext.modelViewProjection);
        gl.uniformMatrix4fv(this.viewMatrix, false, renderContext.viewMatrix);

        gl.uniform4f(this.fogColor, ...renderContext.fogColor); // フォグの色
        gl.uniform1f(this.fogStart, renderContext.fogStart); // フォグが始まる距離
        gl.uniform1f(this.fogEnd, renderContext.fogEnd); // フォグが完全に不透明になる距離

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, renderContext.textures);
        gl.uniform1i(this.skybox, 0);

        // 頂点属性の設定
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.vertexAttribPointer(
            this.position,
            3, // 3成分
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(this.position);

        gl.drawArrays(gl.TRIANGLES, 0, 36); // 36頂点が必要
    }


}

class ParticleShader extends ShaderProgram {
    constructor(gl, shaderConfigs) {
        super(gl, ShaderName.PARTICLE, shaderConfigs + particleVertexShaderSource, shaderConfigs + particleFragmentShaderSource);

        this.positionLocation = gl.getAttribLocation(this.program, 'position');

        this.mvpMatrixLocation = gl.getUniformLocation(this.program, 'mvpMtx');
        this.pointSizeLocation = gl.getUniformLocation(this.program, 'pointSize');

        this.particleColorLocation = gl.getUniformLocation(this.program, 'particleColor');
        this.alphaScaleLocation = gl.getUniformLocation(this.program, 'alphaScale');
    }

    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        variable_validation(geometry);
        variable_validation(renderContext.modelViewProjection);
        variable_validation(renderContext.size);
        variable_validation(renderContext.alphaScale);
        variable_validation(renderContext.color);
        //

        // ブレンディングを有効化（透明度のため）
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.depthMask(false)

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.mvpMatrixLocation, false, renderContext.modelViewProjection);
        gl.uniform1f(this.pointSizeLocation, renderContext.size); // パーティクルサイズ
        gl.uniform1f(this.alphaScaleLocation, renderContext.alphaScale); // currentAlphaValue は 0.0 から 1.0 までの値
        gl.uniform3f(this.particleColorLocation, ...renderContext.color); // 青色
        gl.drawArrays(gl.POINTS, 0, 1);

        // ブレンディングを無効化
        gl.disable(gl.BLEND);

        gl.depthMask(true);
        gl.depthFunc(gl.LESS);

    }


}

class ShaderManager {
    static _shaders;
    constructor(gl, shaderConfigs) {
        ShaderManager._shaders = {};
        ShaderManager._shaders[ShaderName.BASIC] = new BasicShader(gl, shaderConfigs);
        ShaderManager._shaders[ShaderName.PARTICLE] = new ParticleShader(gl, shaderConfigs);
        ShaderManager._shaders[ShaderName.SKYBOX] = new SkyBoxShader(gl, shaderConfigs);
        ShaderManager._shaders[ShaderName.SIMPLE] = new SimpleShader(gl, shaderConfigs);
        ShaderManager._shaders[ShaderName.SIMPLETEX] = new SimpleTextureShader(gl, shaderConfigs);
    }

    static shader(name) {
        return ShaderManager._shaders[name];
    }
    static shaders() {
        return ShaderManager._shaders;
    }
}


export { ShaderManager, ShaderName };