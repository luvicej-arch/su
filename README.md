# Classroom Tools

교실 도구와 우리말 게임의 소스 코드입니다. 로컬 버전과 계정 저장을 지원하는 클라우드 버전을 구분해 관리합니다.

- [교실 도구함](classroom-hub/README.md): 타이머, 소수 탐험대, PDF 글자 수 세기, 개인 일기장.
- [말글](malgeul/README.md): 맞춤법과 띄어쓰기 미니게임.
- [소수 탐험대 클라우드 버전](decimal-quest/README.md): 아이디·비밀번호 가입과 개인별 학습 기록 저장.

## 사용 주소

- [교실 도구함](https://luvicej-arch.github.io/su/)
- [수업용 타이머](https://luvicej-arch.github.io/su/timer.html)
- [소수 탐험대](https://classroom-decimal-quest.vercel.app/)

허브와 타이머는 GitHub Pages, 소수 탐험대는 Vercel에 배포하며 학습 기록은 Supabase 서울 리전에 저장합니다. 일기장 클라우드 버전은 Firebase 구성 후 연결합니다.

Node.js 24 이상에서 각 폴더의 실행 안내를 따르세요. 동시에 실행하려면 교실 도구함의 PORT를 4174 등으로 지정하세요.

## 공개 범위와 보안

GitHub Pages는 명시적으로 선별한 정적 파일만 배포합니다. 기존 `classroom-hub/server.cjs`와 `malgeul/server.js`는 로컬 전용이며 127.0.0.1에서만 실행하세요. 로컬 일기 API는 인증·사용자 구분·암호화가 없으므로 외부에 노출하지 마세요.

실제 일기 데이터, 데이터베이스, 화면 캡처, 개인 PC 경로가 포함된 로컬 검증 스크립트, 내부 감사 자료는 포함하지 않습니다. 자세한 검토 범위와 남은 제약은 [SECURITY.md](SECURITY.md)를 확인하세요.

PDF.js 등 포함된 외부 라이브러리는 해당 폴더의 라이선스가 적용됩니다. 프로젝트 자체의 별도 오픈소스 라이선스는 아직 지정하지 않았습니다.
