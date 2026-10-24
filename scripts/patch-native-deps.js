// 설치 직후(npm install) 자동으로 실행돼요.
// 카카오 로그인 부품(@react-native-kakao)은 오래된 안드로이드 버전(33)으로 조립하게 적혀 있는데,
// 그 안에 든 부품들이 더 새 버전을 요구해서 빌드가 'checkReleaseAarMetadata'에서 멈춰요.
// 앱 본체와 같은 버전으로 맞춰 줘요. (부품을 업데이트하면 이 숫자도 함께 확인)
const fs = require('fs');
const path = require('path');

const ANDROID = { compileSdk: 37, targetSdk: 36, minSdk: 24 };

const file = path.join(__dirname, '..', 'node_modules', '@react-native-kakao', 'core', 'package.json');
if (!fs.existsSync(file)) process.exit(0);

const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
const a = pkg.sdkVersions?.android;
if (!a) process.exit(0);

let changed = false;
for (const [k, v] of Object.entries(ANDROID)) {
  if (a[k] !== v) {
    a[k] = v;
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[patch-native-deps] 카카오 부품 안드로이드 버전 맞춤:', ANDROID);
}
