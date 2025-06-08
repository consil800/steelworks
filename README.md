# 철강영업 업무일지 앱

철강영업에 특화된 업체 관리 및 업무일지 작성 웹 애플리케이션입니다.

## 주요 기능

### 🏢 업체 관리
- **업체 등록**: 업체명, 지역, 주소, 담당자 정보 등 관리
- **업체 검색**: 지역 또는 업체명으로 빠른 검색
- **업체 수정/삭제**: 기존 업체 정보 수정 및 삭제

### 📝 업무일지
- **일지 작성**: 방문일자, 목적, 상담내용, 예상거래금액 등 상세 기록
- **일지 조회**: 업체별 과거 방문 기록 확인
- **일지 수정/삭제**: 기존 일지 내용 수정 및 삭제

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL, Real-time API)
- **스타일링**: 반응형 디자인, CSS Grid/Flexbox

## 설치 및 설정

### 1. Supabase 설정

1. [Supabase](https://supabase.com) 계정 생성 및 새 프로젝트 생성
2. SQL Editor에서 다음 테이블 생성:

```sql
-- 업체 테이블
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    region TEXT NOT NULL,
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    business_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업무일지 테이블
CREATE TABLE work_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_time TIME,
    visit_purpose TEXT NOT NULL,
    meeting_person TEXT,
    meeting_person_title TEXT,
    discussion_content TEXT NOT NULL,
    proposed_items TEXT,
    estimated_amount NUMERIC,
    customer_response TEXT,
    next_action TEXT,
    follow_up_date DATE,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_region ON companies(region);
CREATE INDEX idx_work_logs_company_id ON work_logs(company_id);
CREATE INDEX idx_work_logs_visit_date ON work_logs(visit_date);
```

### 2. 환경 설정

1. `supabase-client.js` 파일에서 Supabase 설정 정보 입력:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

2. HTML 파일들에 Supabase CDN 추가:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### 3. 로컬 실행

정적 파일 서버를 실행하여 앱을 사용할 수 있습니다:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server 확장 사용
```

## 파일 구조

```
steel-business-app/
├── index.html              # 메인 페이지 (업체 목록 및 검색)
├── company-register.html    # 업체 등록 페이지
├── company-detail.html      # 업체 상세 및 업무일지 목록
├── work-log.html           # 업무일지 작성/수정 페이지
├── styles.css              # 공통 스타일시트
├── supabase-client.js      # Supabase 연동 및 데이터베이스 함수들
├── main.js                 # 메인 페이지 JavaScript
├── company-register.js     # 업체 등록 JavaScript
├── company-detail.js       # 업체 상세 JavaScript
├── work-log.js             # 업무일지 JavaScript
└── README.md               # 프로젝트 문서
```

## 사용 방법

### 업체 등록
1. 메인 페이지에서 "새 업체 등록" 버튼 클릭
2. 필수 정보(업체명, 지역) 입력
3. 선택 정보(주소, 담당자, 연락처 등) 입력
4. "등록" 버튼으로 저장

### 업체 검색
1. 메인 페이지 상단 검색창 사용
2. 지역 또는 업체명으로 검색 가능
3. 검색 결과에서 업체 클릭하여 상세 페이지 이동

### 업무일지 작성
1. 업체 상세 페이지에서 "새 일지 작성" 버튼 클릭
2. 방문 정보 입력 (일자, 시간, 목적)
3. 면담 정보 및 상담 내용 작성
4. 예상 거래 금액 및 고객 반응 기록
5. 향후 계획 및 다음 방문 예정일 설정

## 데이터베이스 스키마

### companies 테이블
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본키 |
| company_name | TEXT | 업체명 (필수) |
| region | TEXT | 지역 (필수) |
| address | TEXT | 주소 |
| contact_person | TEXT | 담당자명 |
| phone | TEXT | 연락처 |
| email | TEXT | 이메일 |
| business_type | TEXT | 업종 |
| notes | TEXT | 비고 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

### work_logs 테이블
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본키 |
| company_id | UUID | 업체 ID (외래키) |
| visit_date | DATE | 방문일자 (필수) |
| visit_time | TIME | 방문시간 |
| visit_purpose | TEXT | 방문목적 (필수) |
| meeting_person | TEXT | 면담자 |
| meeting_person_title | TEXT | 면담자 직책 |
| discussion_content | TEXT | 상담내용 (필수) |
| proposed_items | TEXT | 제안제품/서비스 |
| estimated_amount | NUMERIC | 예상거래금액 |
| customer_response | TEXT | 고객반응 |
| next_action | TEXT | 향후계획 |
| follow_up_date | DATE | 다음방문예정일 |
| additional_notes | TEXT | 특이사항 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

## 주요 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 화면에서 사용 가능
- **실시간 데이터**: Supabase를 통한 실시간 데이터 동기화
- **사용자 친화적**: 직관적인 UI/UX 디자인
- **데이터 검증**: 클라이언트 및 서버 사이드 데이터 유효성 검증
- **오류 처리**: 친화적인 오류 메시지 및 예외 처리
- **자동 저장**: 업무일지 작성 중 임시 저장 기능

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.