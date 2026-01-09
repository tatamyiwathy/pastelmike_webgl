import { mat4 } from 'gl-matrix';
import { ShaderManager, ShaderName } from './shader.js';
import { ObjGroup } from './scene.js';
import { Frustum } from './frustum.js';
import { Clock } from './clock.js';
import { Material } from './material.js';
import { Debug } from './debug.js';


export class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', { depth: true });

        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        this.readyShader = false;

        this.frustum = new Frustum();

        this.enableCulling = false;

        this.clock = new Clock();

        this.vpMtx = mat4.create();

        this.shaderContext = {
            isFog: true,
            maxDirLights: 4,
        };

        this.clearColor = [0.0, 0.0, 0.0, 1.0];

        this.usePointLight = true;

        // デバッグモード
        this.debugShadowMap = false;
        this.debugQuadBuffers = null;

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
            Debug.log("Shader isFog:", this.shaderContext.isFog);

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

        // シャドウマップのレンダリング（全グループのオブジェクトを集める）
        const allRenderableObjects = [];
        scene.children.forEach((group) => {
            const objs = group.children.filter(obj => obj.isRenderTarget);
            allRenderableObjects.push(...objs);
        });
        
        dirLights.forEach((light) => {
            if (light.enableShadow) {
                const cameraMatrix = {
                    projection: camera.projMtx,
                    view: camera.mdlViewMtx,
                }
                light.updateMatrix(cameraMatrix, this.vpMtx);
                this.renderShadowMap(gl, allRenderableObjects, light);
            }
        });

        scene.children.forEach((group) => {

            // レンダー対象のオブジェクトを抽出
            const objs = group.children.filter(obj => obj.isRenderTarget);
            console.log(`Rendering group ${group.name} with ${objs.length} objects.`);
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
                const cameraMatrix = {
                    projection: camera.projMtx,
                    view: camera.mdlViewMtx,
                }
                obj.updateMatrix(cameraMatrix, this.vpMtx);
            });

            // デバッグ: シャドウマップ可視化
            if (this.debugShadowMap && dirLights.length > 0 && dirLights[0].enableShadow) {
                this.renderDebugShadowMap(gl, dirLights[0]);
            }

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
                    Debug.checkGlError(gl, 'Before render');
                    const shader = ShaderManager.shader(obj.material.shaderName);
                    shader.render(this.gl, Renderer.renderContext, obj.geometry)
                    Debug.checkGlError(gl, 'after render: obj:'+obj.tagName);
                }
            });
        });
    }

    createDebugQuadBuffers(gl) {
        // デバッグ用：画面右下に小さく表示する矩形の頂点（NDC座標: -1~1）
        const positions = new Float32Array([
            0.6,  1.0,   // 右上
            1.0,  1.0,   // さらに右上
            0.6,  0.6,   // 右下
            1.0,  0.6,   // さらに右下
        ]);

        const texcoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
        ]);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

        return { positionBuffer, texcoordBuffer };
    }

    renderDebugShadowMap(gl, light) {
        Debug.log('=== Debug Shadow Map Rendering Start ===');
        
        if (!this.debugQuadBuffers) {
            this.debugQuadBuffers = this.createDebugQuadBuffers(gl);
            Debug.log('Debug quad buffers created');
        }

        Debug.log('Light texture:', light.texture);
        Debug.log('Framebuffer:', light.frameBuffer);

        // 深度テストを無効化（オーバーレイとして描画）
        gl.disable(gl.DEPTH_TEST);

        const shader = ShaderManager.shader(ShaderName.DEBUG_DEPTH);
        Debug.log('Debug shader:', shader);
        
        try {
            shader.render(
                gl,
                this.debugQuadBuffers.positionBuffer,
                this.debugQuadBuffers.texcoordBuffer,
                light.texture
            );
            Debug.log('Debug render completed');
        } catch (e) {
            console.error('Debug render failed:', e);
        }

        // 深度テストを再度有効化
        gl.enable(gl.DEPTH_TEST);
        
        Debug.log('=== Debug Shadow Map Rendering End ===');
    }

    renderShadowMap(gl, objs, light) {
        Debug.log('=== Shadow Map Rendering Start ===');
        Debug.log('Light:', light);
        Debug.log('Objects to render:', objs.length);
        
        // ShadowMapクラスのメソッドを使用
        light.shadowMap.bind();
        light.shadowMap.setViewport();
        light.shadowMap.clear();

        // ポリゴンオフセットでシャドウアクネを低減
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1.0, 1.0);

        // シーン内の全オブジェクトを描画
        let rendered = 0;
        objs.forEach((obj) => {
            if (obj.type !== 'mesh') return;
            
            Debug.checkGlError(gl, 'Before shadow map render');
            Renderer.renderContext = {
                // ライトのビュー行列と射影行列を使って計算した行列
                lightSpaceMatrix: light.lightSpaceMatrix,
                modelMatrix: obj.worldMtx,
            }
            const shader = ShaderManager.shader(ShaderName.SHADOWMAP);
            shader.render(this.gl, Renderer.renderContext, obj.geometry);
            
            // インデックスバッファをバインドして描画
            if (obj.geometry.tri_ibo) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.geometry.tri_ibo.buffer);
                gl.drawElements(gl.TRIANGLES, obj.geometry.tri_indices_len, gl.UNSIGNED_INT, 0);
                rendered++;
                
                // WebGLエラーチェック
                Debug.checkGlError(gl, 'After shadow map render');
            
            }
        });
        
        Debug.log('Actually rendered:', rendered, 'objects');

        // 設定を元に戻す
        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.cullFace(gl.BACK); // 通常の描画に戻す
        light.shadowMap.unbind();
        // ビューポートもメイン描画用に復元
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        Debug.log('=== Shadow Map Rendering End ===');
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