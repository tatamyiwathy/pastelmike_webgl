# Vitest + Docker（WSL2）導入手順

## 1. 必要ファイルの準備

- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `vitest.config.js`
- `tests/` ディレクトリ

---

## 2. `Dockerfile` の作成

```Dockerfile
# filepath: /mnt/c/Users/tatam/Projects/pastelmike_webgl/Dockerfile
FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

CMD ["npm", "test"]
```

---

## 3. `docker-compose.yml` の作成

```yaml
# filepath: /mnt/c/Users/tatam/Projects/pastelmike_webgl/docker-compose.yml
services:
  test:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/app
```

---

## 4. 必要なパッケージのインストール

WSL2上でプロジェクトディレクトリにて実行：

```sh
npm install --save-dev vitest jsdom
```

---

## 5. `vitest.config.js` の作成

```js
// filepath: /mnt/c/Users/tatam/Projects/pastelmike_webgl/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

---

## 6. サンプルテストの作成（任意）

```js
// filepath: /mnt/c/Users/tatam/Projects/pastelmike_webgl/tests/sample.vitest.js
import { test, expect } from 'vitest';

test('1 + 1', () => {
  expect(1 + 1).toBe(2);
});
```

---

## 7. テストの実行

Dockerイメージをビルド：

```sh
docker compose build
```

テストを実行：

```sh
docker compose run --rm test npx vitest run
```

---

## 備考

- 既存のQUnitテストはそのまま残してOK。
- 新規テストはVitest形式で `tests/` に追加。
- `npm test` でVitestが動作することを確認。