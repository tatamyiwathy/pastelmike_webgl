# copilot-instructions.md
## プロジェクトに関して
- このプロジェクトはWebGL2.0の学習を目的とした軽量な3Dレンダリングエンジンである。
- 主にJavaScriptとGLSLで構成されている。

## 開発環境
- wsl2上のUbuntu 22.04
- Node.js v20.19.6


## ディレクトリ構成
- "scripts/": エンジンの主要なJavaScriptコード
- "assets/": 画像やモデルなどのアセットファイル
- "tests/": QUnitを用いたテストコード
- "samples/": エンジンの使用例

## ライブラリ
- gl-matrix v3.4.3
- seedrandom v3.0.5

## テスト
- vitestを使用してテストコードが書かれている。
- testsディレクトリ内に*.test.jsという名前でテストコードが配置されている。scriptsディレクトリに対応するコードがある。


## ふるまい
- 回答はできるだけシンプルに。提案は必要最低限に。
- 既存のテストコードスタイルに従うこと。