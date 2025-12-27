# copilot-instructions.md
## プロジェクトに関して
- このプロジェクトはWebGL2.0の学習を目的とした軽量な3Dレンダリングエンジンである。
- 主にJavaScriptとGLSLで構成されている。

## ライブラリ
- gl-matrix v3.4.3
- QUnit v2.17.2
- seedrandom v3.0.5

## テスト
- テストフレームワークにはQUnitを使用する。
- scripts/*.js内のクラスや関数をテストするために、tests/ディレクトリ内に対応するテストファイルを作成する。
- テストを生成する場合、以下のスタイルを踏襲すること
- windowオブジェクトを使用せず、ESモジュールのimport文を使用してクラスや関数をインポートすること。
```js
QUnit.module('テスト', function() {
    QUnit.test('関数名または機能の説明', function(assert) {
        // テストコード
        assert.ok(条件, '説明');
    });
});
```
## ふるまい
- 回答はできるだけシンプルに。提案は必要最低限に。
- 既存のテストコードスタイルに従うこと。