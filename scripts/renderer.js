import { mat4 } from 'gl-matrix';
import { ShaderManager, ShaderName } from './shader.js';
import { ObjGroup } from './scene.js';
import { Frustum } from './frustum.js';
import { Clock } from './clock.js';
import { Material } from './material.js';

export class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', { depth: true });

        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        this.readyShader = false;

        this.frustum = new Frustum();

        this.enableCulling = true;

        this.clock = new Clock();

        this.vpMtx = mat4.create();

        this.shaderContext = {
            isFog: true,
            maxDirLights: 4,
        };

        this.clearColor = [0.0, 0.0, 0.0, 1.0];

        this.usePointLight = true;

    }

    setupShaders(gl, shaderContext) {
        let shaderConfigs = "#version 300 es\n";
        if (shaderContext.isFog) {
            shaderConfigs += "#define USE_FOG\n";
        }
        if (shaderContext.isSpecular) {
            shaderConfigs += "#define USE_SPECULAR\n";
        }
        if (shaderContext.maxDirLights > 0) {
            shaderConfigs += `#define MAX_DIR_LIGHTS ${shaderContext.maxDirLights}\n`;
        }
        shaderContext.config = shaderConfigs;
        // Todo: Singleton化する
        new ShaderManager(this.gl, shaderContext); // シェーダーの初期化
    }

    render(scene, camera) {
        const gl = this.gl;

        // オブジェクトのモデル行列を更新
        scene.updateFrame(this.clock.elapsedTime());


        if (this.readyShader == false) {
            this.shaderContext.isFog = scene.isFog ? true : false;
            console.log("Shader isFog:", this.shaderContext.isFog);

            scene.children.forEach((group) => {
                group.children.forEach((obj) => {
                    this.shaderContext.isSpecular = obj.material && obj.material.specular ? true : false;
                });
            });

            this.setupShaders(gl, this.shaderContext);
            this.readyShader = true;
        }



        // ビューポートの設定
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 深度テストを有効にするが、常に最大値で合格するように設定する
        // これにより、スカイボックスは他のオブジェクトの背後に描画される
        gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);
        gl.depthFunc(gl.LESS);


        gl.clearColor(...this.clearColor);
        gl.clearDepth(1.0); // Zバッファのクリア値を1.0（最も遠い）に設定
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        mat4.multiply(this.vpMtx, camera.projMtx, camera.mdlViewMtx);

        // カリング用にフラスタムを更新
        this.frustum.extractPlanes(this.vpMtx);

        // ライト情報の取得
        const dirLights = scene.getDirectionalLights();
        const pointLights = scene.getPointLights();

        scene.children.forEach((group) => {

            // レンダー対象のオブジェクトを抽出
            const objs = group.children.filter(obj => obj.isRenderTarget);
            // カリング
            const culled = this.enableCulling ? this.frustumCulling(objs) : objs;

            if (group.sortOrder == ObjGroup.SortOrderKind.DESC) {
                // カメラからの距離でソート（後ろのものから描画する）
                culled.sort((a, b) => {
                    return b.clip[2] - a.clip[2];
                });
            }
            else if (group.sortOrder == ObjGroup.SortOrderKind.ASC) {
                // カメラからの距離でソート（近いものから描画する）
                culled.sort((a, b) => {
                    return a.clip[2] - b.clip[2];
                });
            }

            // 行列の更新
            culled.forEach((obj) => {
                obj.updateMatrix(camera.projMtx, camera.mdlViewMtx, this.vpMtx);
            });

            // シャドウマップのレンダリング
            dirLights.forEach((light) => {
                if (light.enableShadow) {
                    light.updateMatrix(camera.projMtx, camera.mdlViewMtx, this.vpMtx);

                    this.renderShadowMap(gl, culled, light);
                }
            });

            // オブジェクトの描画
            culled.forEach((obj) => {
                Renderer.renderContext = {
                    // カメラ
                    viewMatrix: camera.mdlViewMtx,
                    projectionMatrix: camera.projMtx,

                    //obj行列
                    viewProjectionMatrix: this.vpMtx,
                    modelViewProjection: obj.mvpMtx,
                    normalMatrix: obj.normalMtx,
                    modelMatrix: obj.worldMtx,

                    // マテリアル
                    color: obj.material ? obj.material.color : Renderer.defaultColor,
                    textures: obj.material ? obj.material.textures : null,
                    wireFrame: obj.material ? obj.material.isWireframe : false,
                    useTexture: obj.material ? obj.material.useTexture : false,
                    particleSize: obj.material ? obj.material.particleSize : false,
                    blendMode: obj.material ? obj.material.blendMode : Material.BlendMode.NONE,
                    uCubeMap: 0,
                    fogColor: scene.fogColor, // フォグの色
                    fogStart: scene.fogStart, // フォグが始まる距離
                    fogEnd: scene.fogEnd, // フォグが完全に不透明になる距離
                    cameraPos: camera.position, // 追加：カメラのワールド座標
                    shininess: 32.0, // 追加：鏡面反射の鋭さ
                    alphaScale: 1.0, // 追加：アルファスケール

                    // 平行光源の情報
                    dirLightNum: dirLights.length,
                    dirLights: dirLights,

                    // 点光源の情報
                    usePointLight: this.usePointLight && pointLights.length > 0 ? 1 : 0,
                    pointLightPosition: pointLights.length > 0 ? pointLights[0].position : [0, 10, 0], // 点光源の位置
                    pointLightColor: pointLights.length > 0 ? pointLights[0].color : [1, 1, 1], // 点光源の色
                    constant: pointLights.length > 0 ? pointLights[0].constant : 1.0, // 減衰係数（定数項）
                    linear: pointLights.length > 0 ? pointLights[0].linear : 0.001, // 減衰係数（一次項）
                    quadratic: pointLights.length > 0 ? pointLights[0].quadratic : 0, // 減衰係数（二次項）

                    // 環境光の色
                    ambientLightColor: scene.ambientColor || [0.2, 0.2, 0.2],

                    // 影関係はlightから直接取得
                }
                if (obj.type == 'mesh') {
                    const shader = ShaderManager.shader(obj.material.shaderName);
                    shader.render(this.gl, Renderer.renderContext, obj.geometry)
                }
            });
        });
    }

    renderShadowMap(gl, objs, light) {
        //function renderShadowPass(gl, shadowFBO, scene, light) {
        // 1. フレームバッファをバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, light.frameBuffer);

        // 2. ビューポートをシャドウマップの解像度に設定（超重要！）
        // shadowMapSize は FBO 作成時に指定した 1024 などの値
        gl.viewport(0, 0, light.frameBufferSize, light.frameBufferSize);
        // 3. 深度バッファをクリア（1.0で塗りつぶす）
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // 4. 背面カリングの設定（後述する「シャドウアクネ」対策）
        // gl.enable(gl.CULL_FACE);
        // gl.cullFace(gl.FRONT); // 表面を消して背面だけを描く手法がよく使われます

        // シーン内の全オブジェクトを描画
        objs.forEach((obj) => {
            Renderer.renderContext = {
                // ライトのビュー行列と射影行列を使って計算した行列
                lightSpaceMatrix: light.lightSpaceMatrix,
                modelMatrix: obj.worldMtx,
            }
            const shader = ShaderManager.shader(ShaderName.SHADOWMAP);
            shader.render(this.gl, Renderer.renderContext, obj.geometry)
        });

        // 6. 設定を元に戻す
        gl.cullFace(gl.BACK); // 通常の描画に戻す
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // ビューポートもメイン描画用に復元（追加）
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }


    static defaultFogColor = [0.5, 0.5, 0.5, 1.0];
    static defaultColor = [1.0, 1.0, 1.0, 1.0];
    static renderContext;

    frustumCulling(objects) {
        const culled = []
        objects.forEach(obj => {
            if (this.frustum.isSphereInside(obj.position, 2.0)) {
                culled.push(obj);
            }
        });
        return culled;
    }
}