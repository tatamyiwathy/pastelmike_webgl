export const skyboxVertexShaderSource = `

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

export const skyboxFragmentShaderSource = `
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
