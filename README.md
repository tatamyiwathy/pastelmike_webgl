# pastelmike_webgl

A repository for learning WebGL

## 🎯 現在実装されている機能

- ✅ **レンダリング**
  - 基本的なWebGL2レンダラー
  - フラスタムカリング
  - 深度テスト

- ✅ **カメラ**
  - PerspectiveCamera（透視投影カメラ）
  - カスタムアニメーター対応

- ✅ **シーン管理**
  - レイヤーシステム
  - オブジェクトグループ管理
  - ソート機能

- ✅ **ジオメトリ**
  - Triangle（三角形）
  - Cube（立方体）
  - Sphere（球体）
  - Torus（トーラス）
  - Plain（平面）
  - PointGeometry（点）

- ✅ **マテリアル**
  - MeshSimpleMaterial（シンプルマテリアル）
  - MeshSpecularMaterial（スペキュラマテリアル）
  - ParticleMaterial（パーティクルマテリアル）
  - CubeMapMaterial（キューブマップマテリアル）
  - ワイヤーフレーム表示

- ✅ **ライティング**
  - Directional Light（平行光源）

- ✅ **エフェクト**
  - Fog（フォグ効果）
  - Skybox（スカイボックス）

- ✅ **テクスチャ**
  - 基本的なテクスチャマッピング
  - キューブマップテクスチャ

- ✅ **3Dモデル読み込み**
  - OBJファイルローダー
  - MTLファイルパーサー

- ✅ **アニメーション**
  - Animatorシステム
  - カスタムアニメーション対応

- ✅ **パーティクル**
  - 基本的なパーティクルシステム

- ✅ **ユーティリティ**
  - 数学ライブラリ（行列、ベクトル演算）
  - 色相環カラーピッカー
  - タイム管理（Clock）
  - デバッグロガー

---

## ⚠️ 足りない・拡張できる機能

### 📷 カメラ
- ❌ OrthographicCamera（正投影カメラ）
- ❌ カメラコントロール（OrbitControls, FlyControls等）
- ❌ カメラのスムーズな移動・補間

### 💡 ライティング
- ❌ PointLight（点光源）
- ❌ SpotLight（スポットライト）
- ❌ AmbientLight（環境光）
- ❌ HemisphereLight（半球ライト）
- ❌ 複数ライトの同時サポート
- ❌ Shadow Mapping（影の生成）
- ❌ ライトの減衰計算

### 🎨 マテリアル/シェーダー
- ❌ PBR (Physically Based Rendering) マテリアル
- ❌ Normal Mapping（法線マップ）
- ❌ Environment Mapping（環境マッピング/反射）
- ❌ Bump Mapping（バンプマップ）
- ❌ Displacement Mapping（ディスプレイスメントマップ）
- ❌ 完全なアルファブレンディング/透明度制御
- ❌ カスタムシェーダーの簡単な追加システム
- ❌ マテリアルのクローン機能

### 🔷 ジオメトリ
- ❌ Cylinder（円柱）
- ❌ Cone（円錐）
- ❌ Capsule（カプセル）
- ❌ Icosahedron（正二十面体）
- ❌ Parametric Surface（パラメトリック曲面）
- ❌ Text Geometry（3Dテキスト）
- ❌ ジオメトリのマージ機能

### 🎬 アニメーション
- ❌ Skeletal Animation（スケルタルアニメーション）
- ❌ Morph Targets（モーフターゲット）
- ❌ Keyframe Animation（キーフレームアニメーション）
- ❌ Animation Mixer（アニメーションミキサー）
- ❌ IK (Inverse Kinematics)（逆運動学）
- ❌ イージング関数ライブラリ

### 🖼️ ポストプロセッシング
- ❌ Bloom（ブルーム）
- ❌ DOF (Depth of Field)（被写界深度）
- ❌ SSAO (Screen Space Ambient Occlusion)
- ❌ Motion Blur（モーションブラー）
- ❌ Color Grading（カラーグレーディング）
- ❌ Vignette（ビネット）
- ❌ FXAA/MSAA（アンチエイリアシング）
- ❌ God Rays（ゴッドレイ）

### 🎯 物理演算
- ❌ Collision Detection（衝突判定）
- ❌ Raycasting（レイキャスティング）
- ❌ 物理エンジン統合（Cannon.js, Ammo. js等）
- ❌ Bounding Box/Sphere計算
- ❌ リジッドボディシミュレーション

### 🖱️ UI/インタラクション
- ❌ マウスピッキング（Raycasting）
- ❌ GUI/HUDオーバーレイ
- ❌ ドラッグ&ドロップ
- ❌ ギズモ（移動・回転・スケール）
- ❌ ホバーエフェクト

### ⚡ パフォーマンス最適化
- ❌ LOD (Level of Detail)
- ❌ Instanced Rendering（インスタンスレンダリング）
- ❌ Occlusion Culling（オクルージョンカリング）
- ❌ Geometry Batching（ジオメトリバッチング）
- ❌ テクスチャアトラス
- ❌ メモリ管理・リソース破棄

### 📦 ファイルフォーマット
- ✅ OBJ（実装済み）
- ❌ GLTF/GLB（業界標準）
- ❌ FBX
- ❌ Collada (DAE)
- ❌ STL
- ❌ PLY

### 🌐 その他
- ❌ WebXR対応（VR/AR）
- ❌ Render to Texture（オフスクリーンレンダリング）
- ❌ Multi-pass Rendering（マルチパスレンダリング）
- ❌ Compute Shaders
- ❌ Audio 3D（空間音響）
- ❌ Screen Space Reflections（スクリーンスペース反射）
- ❌ ステレオレンダリング
- ❌ スクリーンショット機能
- ❌ シーンのエクスポート/インポート

---

## 🚀 優先的に追加すべき機能（推奨）

1. **OrthographicCamera** - 2D/UI表現に必要
2. **PointLight/SpotLight** - より豊かなライティング表現
3. **Raycasting** - インタラクティブな操作に必須
4. **GLTFローダー** - 現代的な3Dモデル対応
5. **Shadow Mapping** - リアルな影表現
6. **カメラコントロール** - ユーザビリティ向上
7. **PBRマテリアル** - フォトリアルなレンダリング
8. **アルファブレンディング** - 透明オブジェクトの適切な描画
