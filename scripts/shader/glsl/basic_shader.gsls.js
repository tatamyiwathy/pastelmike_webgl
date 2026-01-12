// ディフューズ・スペキュラ・フォグ対応頂点シェーダー
export const basicVertexShaderSource = `
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

export const basicFragmentShaderSource = `
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


        float shadowFactor = 1.0;
        for (int i = 0; i < MAX_DIR_LIGHTS; i++) {
            if (i >= dirLightCount) break;
            if (dirLights[i].enabled == 0) continue;

            // 平行光源の方向ベクトル（ライトから頂点への方向）
            vec3 Ld = -normalize(dirLights[i].direction);
            
            //拡散反射
            float diffD = max(dot(N, Ld), 0.0);
            vec3 lightContribution = diffD * dirLights[i].color;

            // 影の計算
            float shadow = 1.0;
            if( enableShadow[i] ) {
                shadow = calculateShadow(i, N, Ld);
                shadow = smoothstep(0.2, 0.8, shadow);
            }
            shadowFactor = min(shadowFactor, shadow);

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
        vec3 lit = (totalDiffuse + totalSpecular) * shadowFactor;
        vec4 baseColor = vec4(lit, 1.0) * color;

        if (useTexture) {
            // 頂点シェーダーから渡されたUV座標をそのまま使う
            baseColor *= texture(samples, v_texcoord);
        }

        float ambientInShadow = 0.15; // いまの設定
        float ambientShadowFactor = mix(ambientInShadow, 1.0, shadowFactor);
        vec3 ambient = ambientLightColor * color.rgb * ambientShadowFactor;

        vec4 combinedColor = vec4(baseColor.rgb + ambient, baseColor.a);

        outColor = combinedColor;

        // --- 3. フォグ (Fog) ---
#ifdef USE_FOG
        float fogFactor = (fogEnd - v_depth) / (fogEnd - fogStart);
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        outColor.rgb = mix(fogColor.rgb, outColor.rgb, fogFactor);
#endif
    }
`;
