import { variable_validation } from "./utils.js";
import { Material } from "./material.js";
import { Debug } from "./debug.js";

const SHADOWMAP_SLOT = 1; // シャドウマップ用のテクスチャユニット

const ShaderName = {
    BASIC: 'basic',
    PARTICLE: 'particle',
    SKYBOX: 'skybox',
    SIMPLE: 'simple',
    SIMPLETEX: 'simpletex',
    SHADOWMAP: 'shadowmap',
    DEBUG_DEPTH: 'debug_depth',
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
    precision mediump int;

    uniform mat4 mvpMtx;
    uniform mat4 modelMatrix;
    uniform mat4 normalMatrix;
    uniform mat4 viewMatrix;

    // 影
    uniform mat4 lightSpaceMatrix[MAX_DIR_LIGHTS]; // 平行光源の行列
    uniform int dirLightCount;  // 平行光源の数
    out vec4 v_positionInLightSpace[MAX_DIR_LIGHTS]; // フラグメントシェーダーへ送る

    in vec3 position;
    in vec3 normal;
    in vec2 texcoord; // UV座標 (vt)    

    out vec3 v_worldPosition;
    out vec3 v_normal;
    out float v_depth; // fog
    out vec2 v_texcoord; // UV座標 (vt)

    void main() {

    // 位置をワールド座標に変換 (modelMatrixを掛ける)
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        v_worldPosition = worldPosition.xyz;

        v_normal = normalize(mat3(normalMatrix) * normal);

        // v_directionalLightDir = directionalLightDir;
        v_texcoord = texcoord; // そのままフラグメントシェーダーへ

        // ライト視点での座標を計算
        for (int i = 0; i < dirLightCount; ++i) {
            v_positionInLightSpace[i] = lightSpaceMatrix[i] * worldPosition;
        }
#ifdef USE_FOG
        vec4 viewPosition = viewMatrix * worldPosition;
        v_depth = length(viewPosition.xyz);
#endif
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    precision mediump int;

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
    // uniform vec3 directionalLightColor;
    uniform vec3 pointLightPosition;    // 点光源の位置
    uniform vec3 pointLightColor;       // 点光源の色
    // uniform vec3 viewPosition;     // カメラ位置 cameraPosで代用
    uniform float constant, linear, quadratic; // 減衰係数
    uniform bool usePointLight;
    uniform vec3 ambientLightColor;

    // 平行光源
    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        int enabled;
    };
    uniform DirectionalLight dirLights[MAX_DIR_LIGHTS];
    uniform int dirLightCount;

    // シャドウマップ
    uniform sampler2D shadowMap[MAX_DIR_LIGHTS]; // パス1で作ったテクスチャ
    uniform bool enableShadow[MAX_DIR_LIGHTS];
    uniform int pcfRadius; // 0:1x1, 1:3x3, 2:5x5    
    in vec4 v_positionInLightSpace[MAX_DIR_LIGHTS];
    const int MAX_PCF_RADIUS = 2; // 2なら最大5x5

    in vec3 v_worldPosition;
    in vec3 v_normal;
    // in vec3 v_directionalLightDir;
    in float v_depth;
    in vec2 v_texcoord;   // 頂点シェーダーから届いたUV
    
    out vec4 outColor;
    
    float calculateShadowForLight(int lightIndex, vec3 projCoords, float bias) {

        // 4. 簡易PCF (3x3)

        vec2 texelSize;
        if (lightIndex == 0) {
            texelSize = 1.0 / vec2(textureSize(shadowMap[0], 0));
        } else if (lightIndex == 1) {
            texelSize = 1.0 / vec2(textureSize(shadowMap[1], 0));
        } else if (lightIndex == 2) {
            texelSize = 1.0 / vec2(textureSize(shadowMap[2], 0));
        } else {
            texelSize = 1.0 / vec2(textureSize(shadowMap[3], 0));
        }


        float shadowCount = 0.0;
        float sampleCount = 0.0;
        for (int x = -MAX_PCF_RADIUS; x <= MAX_PCF_RADIUS; ++x) {
            for (int y = -MAX_PCF_RADIUS; y <= MAX_PCF_RADIUS; ++y) {

                if (abs(x) > pcfRadius || abs(y) > pcfRadius) {
                    continue;
                }

                vec2 uv = projCoords.xy + vec2(x, y) * texelSize;
                sampleCount += 1.0;
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    continue;
                }                
                float closestDepth;
                if (lightIndex == 0) {
                    closestDepth = texture(shadowMap[0], uv).r;
                } else if (lightIndex == 1) {
                    closestDepth = texture(shadowMap[1], uv).r;
                } else if (lightIndex == 2) {
                    closestDepth = texture(shadowMap[2], uv).r;
                } else {
                    closestDepth = texture(shadowMap[3], uv).r;
                }
                float currentDepth = projCoords.z - bias;
                shadowCount += step(closestDepth, currentDepth);
            }
        }
        float occlusion = (sampleCount > 0.0) ? shadowCount / sampleCount : 0.0;
        float shadow = 1.0 - occlusion;
        return shadow;
    }
    // float calculateShadowForLight(int lightIndex, vec3 projCoords) {
    //     return 1.0; // とりあえず影なしで固定
    // }
    float calculateShadow(int lightIndex, vec3 N, vec3 Ld) {
        // 1. 透視除算 (wで割る) 
        // 平行光源(ortho)の場合はw=1ですが、汎用性のために行います
        // vec3 projCoords = v_positionInLightSpace[lightIndex].xyz / v_positionInLightSpace[lightIndex].w;
        vec4 posLS;
        if (lightIndex == 0) posLS = v_positionInLightSpace[0];
        else if (lightIndex == 1) posLS = v_positionInLightSpace[1];
        else if (lightIndex == 2) posLS = v_positionInLightSpace[2];
        else posLS = v_positionInLightSpace[3];    
        vec3 projCoords = posLS.xyz / posLS.w;    
        
        // 2. 座標を 0.0 ～ 1.0 の範囲に変換（テクスチャUV用）
        // クリップ空間は -1～1 なので、0.5倍して0.5足す
        projCoords = projCoords * 0.5 + 0.5;

        // --- ここを追加！ ---
        // ライトの視界（0.0～1.0）の外側にあるピクセルは、影を計算せず 1.0 (光) を返す
        if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) {
            return 1.0;
        }
        // ------------------        

        float bias = max(0.001 * (1.0 - dot(N, Ld)), 0.0005);
        bias = min(bias, 0.01); // 上限はシーンに合わせて調整
        return calculateShadowForLight(lightIndex, projCoords, bias);
    }
    
    void main() {
        // ベクトルの正規化
        vec3 N = normalize(v_normal);
        vec3 Lp = normalize(pointLightPosition - v_worldPosition); // 点光源から頂点への方向ベクトル
        vec3 V = normalize(cameraPos - v_worldPosition); // 視線方向

        vec3 totalDiffuse = vec3(0.0);
        vec3 totalSpecular = vec3(0.0);


        for (int i = 0; i < MAX_DIR_LIGHTS; i++) {
            if (i >= dirLightCount) break;
            if (dirLights[i].enabled == 0) continue;

            // 平行光源の方向ベクトル（ライトから頂点への方向）
            vec3 Ld = -normalize(dirLights[i].direction);
            
            //拡散反射
            float diffD = max(dot(N, Ld), 0.0);
            vec3 lightContribution = diffD * dirLights[i].color;

            // 影の計算
            if( enableShadow[i] ) {
                float shadow = calculateShadow(i, N, Ld);
                lightContribution *= shadow; // 影の影響を乗算
            }

            totalDiffuse += lightContribution;
#ifdef USE_SPECULAR
            // スペキュラ
            vec3 R = reflect(-Ld, N); // 光の反射ベクトル
            float specStrength = pow(max(dot(R, V), 0.0), shininess); // 32.0は輝きの鋭さ
            totalSpecular += vec3(1.0) * specStrength; // 白色のハイライト
#endif  
        }

        // ポイントライト
        vec3 diffuseP = vec3(0.0);
        if (usePointLight) {
            float diffP = max(dot(N, Lp), 0.0);
            float distance = length(pointLightPosition - v_worldPosition);
            float attenuation = 1.0 / (constant + linear * distance + quadratic * (distance * distance));
            diffuseP = diffP * pointLightColor * attenuation;
        }
 
        // 点光源も加算
        totalDiffuse += diffuseP;

        // 最終的な色の合成
        vec4 baseColor = vec4(totalDiffuse + totalSpecular, 1.0) * color;

        if (useTexture) {
            // 頂点シェーダーから渡されたUV座標をそのまま使う
            baseColor *= texture(samples, v_texcoord);
        }
        vec4 combinedColor = vec4(baseColor.rgb + (ambientLightColor * color.rgb), baseColor.a);

        outColor = combinedColor;

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


const shadowmap_vertexShaderSource = `
layout(location = 0) in vec3 a_position;

uniform mat4 lightSpaceMatrix;
uniform mat4 modelMatrix;

void main() {
    // ライトから見た座標に変換
    gl_Position = lightSpaceMatrix * modelMatrix * vec4(a_position, 1.0);
}
    `;

const shadowmap_fragmentShaderSource = `
precision highp float;

void main() {
    // WebGL 2.0 + 深度アタッチメントのみの場合、
    // 何も書かなくても自動的に深度が書き込まれます。
    // (空でOKです)
}
`;

// デバッグ用：深度テクスチャ可視化シェーダー
const debugDepth_vertexShaderSource = `
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const debugDepth_fragmentShaderSource = `
precision highp float;

in vec2 v_texcoord;
out vec4 outColor;

uniform sampler2D u_depthTexture;

void main() {
    float depth = texture(u_depthTexture, v_texcoord).r;
    // 深度値を可視化（0.0=黒, 1.0=白）
    outColor = vec4(vec3(depth), 1.0);
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
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(this.program));
        }
        gl.useProgram(this.program);
    }
    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const message = gl.getShaderInfoLog(shader);
        if (message.length > 0) {
            throw new Error('Shader compile error: ' + message);
        }

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('Shader compilation error: ' + gl.getShaderInfoLog(shader));
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
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
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
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
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
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
        //console.log(shaderConfigs + fragmentShaderSource);
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

        // 平行光源
        this.dirLightDirLocations = [];
        this.dirLightColorLocations = [];
        this.dirLightEnableLocations = [];
        this.shadowMapLocations = [];
        this.lightSpaceMatrixLocations = [];
        this.enableShadowLocations = [];
        for (let i = 0; i < shaderContext.maxDirLights; i++) {
            this.dirLightDirLocations[i] = gl.getUniformLocation(this.program, 'dirLights[' + i + '].direction');
            this.dirLightColorLocations[i] = gl.getUniformLocation(this.program, 'dirLights[' + i + '].color');
            this.dirLightEnableLocations[i] = gl.getUniformLocation(this.program, 'dirLights[' + i + '].enabled');
            this.shadowMapLocations[i] = gl.getUniformLocation(this.program, 'shadowMap[' + i + ']');
            this.lightSpaceMatrixLocations[i] = gl.getUniformLocation(this.program, 'lightSpaceMatrix[' + i + ']');
            this.enableShadowLocations[i] = gl.getUniformLocation(this.program, 'enableShadow[' + i + ']');
        }
        this.pcfRadiusLocation = gl.getUniformLocation(this.program, 'pcfRadius');


        this.dirLightCountLocation = gl.getUniformLocation(this.program, 'dirLightCount');
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
        // 必要な場合のみブレンドを有効化（透過マテリアル用）
        if (renderContext.blendMode !== Material.BlendMode.NONE) {
            gl.enable(gl.BLEND);
            if (renderContext.blendMode === Material.BlendMode.ALPHA) {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            } else if (renderContext.blendMode === Material.BlendMode.ADD) {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            } else if (renderContext.blendMode === Material.BlendMode.MULTIPLY) {
                gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
            }
        } else {
            gl.disable(gl.BLEND);
        }
        gl.depthMask(true);

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
        for (let i = 0; i < renderContext.dirLightNum; i++) {
            gl.uniform3f(this.dirLightDirLocations[i], ...renderContext.dirLights[i].direction);
            gl.uniform3f(this.dirLightColorLocations[i], ...renderContext.dirLights[i].color);
            gl.uniform1i(this.dirLightEnableLocations[i], renderContext.dirLights[i].enabled ? 1 : 0);
        }
        gl.uniform1i(this.dirLightCountLocation, renderContext.dirLightNum);
        gl.uniform1i(this.pcfRadiusLocation, 1);
        Debug.log(`Dir Light Count: ${renderContext.dirLightNum}`);

        // 点光源関連のユニフォーム変数を設定
        gl.uniform3f(this.pointLightPositionLocation, ...renderContext.pointLightPosition); // 点光源の位置
        gl.uniform3f(this.pointLightColorLocation, ...renderContext.pointLightColor); // 点光源の色
        gl.uniform1f(this.constantLocation, renderContext.constant); // 減衰係数（定数項）
        gl.uniform1f(this.linearLocation, renderContext.linear); // 減衰係数（一次項）
        gl.uniform1f(this.quadraticLocation, renderContext.quadratic); // 減衰係数（二次項）
        gl.uniform1i(this.usePointLightLocation, renderContext.usePointLight); // 点光源の使用有無

        // 環境光の設定
        gl.uniform3f(this.ambientLightColorLocation, ...renderContext.ambientLightColor); // 環境光の色

        // 影（全スロットに必ず何かをバインドしてGLエラーを防ぐ）
        const maxDir = this.lightSpaceMatrixLocations.length; // = MAX_DIR_LIGHTS
        let fallback = null;

        if (renderContext.dirLightNum > 0) {
            const idx = Math.min(renderContext.dirLightNum - 1, renderContext.dirLights.length - 1);
            fallback = renderContext.dirLights[idx] ? renderContext.dirLights[idx].texture : null;
        }
        // 1x1のダミー深度テクスチャを1回だけ作る
        if (!fallback) {
            if (!this._fallbackShadowTex) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 1, 1, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                this._fallbackShadowTex = tex;
            }
            fallback = this._fallbackShadowTex;
        }

        for (let i = 0; i < maxDir; i++) {
            const withinRange = i < renderContext.dirLightNum;
            const shadowOn = withinRange && renderContext.dirLights[i].enableShadow;
            const tex = shadowOn ? renderContext.dirLights[i].texture : fallback;

            gl.uniform1i(this.enableShadowLocations[i], shadowOn ? 1 : 0);
            if (shadowOn) {
                gl.uniformMatrix4fv(this.lightSpaceMatrixLocations[i], false, renderContext.dirLights[i].lightSpaceMatrix);
            }
            gl.activeTexture(gl.TEXTURE0 + SHADOWMAP_SLOT + i);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(this.shadowMapLocations[i], SHADOWMAP_SLOT + i);
        }


        if (renderContext.wireFrame) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.wire_ibo.buffer);
            gl.drawElements(gl.LINES, geometry.wire_indices_len, gl.UNSIGNED_INT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.tri_ibo.buffer);
            gl.drawElements(gl.TRIANGLES, geometry.tri_indices_len, gl.UNSIGNED_INT, 0);
        }
        Debug.checkGlError(gl, 'ShaderProgram render');
    }
}


class SkyBoxShader extends ShaderProgram {
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
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
        gl.uniformMatrix4fv(this.viewDirectionProjectionMatrix, false, renderContext.modelViewProjection);
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
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
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
        variable_validation(renderContext.particleSize);
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
        gl.uniform1f(this.pointSizeLocation, renderContext.particleSize); // パーティクルサイズ
        gl.uniform1f(this.alphaScaleLocation, renderContext.alphaScale); // currentAlphaValue は 0.0 から 1.0 までの値
        gl.uniform3f(this.particleColorLocation, ...renderContext.color); // 青色
        gl.drawArrays(gl.POINTS, 0, 1);

        // ブレンディングを無効化
        gl.disable(gl.BLEND);

        gl.depthMask(true);
        gl.depthFunc(gl.LESS);

    }


}

class ShadowMapShader extends ShaderProgram {
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
        super(gl, 'shadowmap', shaderConfigs + shadowmap_vertexShaderSource, shaderConfigs + shadowmap_fragmentShaderSource);
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.lightSpaceMatrixLocation = gl.getUniformLocation(this.program, 'lightSpaceMatrix');
        this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');
    }
    render(gl, renderContext, geometry) {
        this.useProgram(gl);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.v_vbo.buffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        // ライト行列をセット
        const mtx = renderContext.lightSpaceMatrix;
        gl.uniformMatrix4fv(this.lightSpaceMatrixLocation, false, mtx);
        // モデル行列をセット
        gl.uniformMatrix4fv(this.modelMatrixLocation, false, renderContext.modelMatrix);
    }
}

class DebugDepthShader extends ShaderProgram {
    constructor(gl, shaderContext) {
        const shaderConfigs = shaderContext.config || '';
        super(gl, 'debug_depth', shaderConfigs + debugDepth_vertexShaderSource, shaderConfigs + debugDepth_fragmentShaderSource);
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'a_texcoord');
        this.depthTextureLocation = gl.getUniformLocation(this.program, 'u_depthTexture');
    }
    render(gl, positionBuffer, texcoordBuffer, depthTexture) {
        this.useProgram(gl);

        // 位置属性
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // UV座標属性
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        // 深度テクスチャをバインド
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(this.depthTextureLocation, 0);

        // 描画
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // クリーンアップ
        gl.disableVertexAttribArray(this.positionLocation);
        gl.disableVertexAttribArray(this.texcoordLocation);
    }
}
class ShaderManager {
    static _shaders;
    constructor(gl, shaderContext) {
        ShaderManager._shaders = {};
        ShaderManager._shaders[ShaderName.BASIC] = new BasicShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.PARTICLE] = new ParticleShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.SKYBOX] = new SkyBoxShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.SIMPLE] = new SimpleShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.SIMPLETEX] = new SimpleTextureShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.SHADOWMAP] = new ShadowMapShader(gl, shaderContext);
        ShaderManager._shaders[ShaderName.DEBUG_DEPTH] = new DebugDepthShader(gl, shaderContext);
    }

    static shader(name) {
        return ShaderManager._shaders[name];
    }
    static shaders() {
        return ShaderManager._shaders;
    }
}


export { ShaderManager, ShaderName };