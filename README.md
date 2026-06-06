# 내 자산 관리 대시보드

Next.js + Vercel 기반 개인 투자 포트폴리오 대시보드

## 로컬 실행

```bash
npm install
# .env.local 파일 생성 후 환경변수 입력 (.env.example 참고)
npm run dev
```

## Vercel 배포

### 1. GitHub에 올리기
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/portfolio-dashboard
git push -u origin main
```

### 2. Vercel 연동
1. https://vercel.com 접속 → GitHub 로그인
2. "New Project" → 저장소 선택
3. Environment Variables 설정:

| 변수명 | 값 |
|--------|-----|
| `SHEET_ID` | 구글 스프레드시트 ID |
| `GCP_CLIENT_EMAIL` | 서비스 계정 이메일 |
| `GCP_PRIVATE_KEY` | 서비스 계정 private key |

4. Deploy 클릭!

## 환경변수 설정 방법

### SHEET_ID
구글 스프레드시트 URL에서 추출:
```
https://docs.google.com/spreadsheets/d/[여기가_SHEET_ID]/edit
```

### GCP_PRIVATE_KEY
JSON 키 파일의 `private_key` 값을 그대로 복사
(줄바꿈이 `\n`으로 표시된 상태 그대로 입력)

## 기술 스택
- **Framework**: Next.js 14 (App Router)
- **차트**: Recharts
- **데이터**: Google Sheets API
- **배포**: Vercel
