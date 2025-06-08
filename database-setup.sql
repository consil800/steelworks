-- 철강영업 업무일지 앱 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 업체 테이블 생성
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

-- 2. 업무일지 테이블 생성
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

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_region ON companies(region);
CREATE INDEX idx_work_logs_company_id ON work_logs(company_id);
CREATE INDEX idx_work_logs_visit_date ON work_logs(visit_date);

-- 4. RLS (Row Level Security) 정책 설정 (선택사항)
-- 현재는 모든 사용자가 모든 데이터에 접근 가능하도록 설정
-- 실제 운영시에는 사용자별 권한 관리를 위해 수정 필요

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 접근 가능하도록 정책 생성 (개발/테스트용)
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on work_logs" ON work_logs
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 샘플 데이터 삽입 (테스트용)
INSERT INTO companies (company_name, region, address, contact_person, phone, business_type, notes) VALUES
('한국철강', '서울', '서울시 강남구 테헤란로 123', '김철수', '02-1234-5678', '제조업', '주력 고객사'),
('대한금속', '부산', '부산시 해운대구 센텀로 456', '이영희', '051-9876-5432', '제조업', '중요 거래처'),
('동양스틸', '인천', '인천시 연수구 송도로 789', '박민수', '032-5555-1234', '유통업', '신규 개발 업체'),
('서울건설', '서울', '서울시 종로구 세종로 321', '최준호', '02-7777-8888', '건설업', '대형 프로젝트 진행중'),
('부산조선', '부산', '부산시 영도구 해안로 654', '정수민', '051-3333-4444', '제조업', '조선업계 선두');

-- 6. 샘플 업무일지 데이터 삽입
INSERT INTO work_logs (
    company_id, 
    visit_date, 
    visit_time, 
    visit_purpose, 
    meeting_person, 
    meeting_person_title, 
    discussion_content, 
    proposed_items, 
    estimated_amount, 
    customer_response, 
    next_action, 
    follow_up_date
) VALUES
(
    (SELECT id FROM companies WHERE company_name = '한국철강' LIMIT 1),
    '2024-01-15',
    '14:00',
    '신규영업',
    '김철수',
    '구매팀장',
    '2024년 철강재 납품 계약 논의. 월 100톤 규모의 정기 납품 희망. 품질과 가격 경쟁력에 대한 문의가 많았음.',
    'H빔, 철근, 강판',
    5000,
    '긍정적',
    '견적서 작성 후 재방문 예정',
    '2024-01-22'
),
(
    (SELECT id FROM companies WHERE company_name = '대한금속' LIMIT 1),
    '2024-01-18',
    '10:30',
    '기존고객관리',
    '이영희',
    '생산부장',
    '기존 계약 만족도 높음. 추가 주문 가능성 타진. 새로운 제품 라인에 대한 관심 표명.',
    '특수강, 스테인리스',
    8000,
    '매우긍정적',
    '신제품 카탈로그 전달 예정',
    '2024-01-25'
),
(
    (SELECT id FROM companies WHERE company_name = '동양스틸' LIMIT 1),
    '2024-01-20',
    '15:30',
    '견적제공',
    '박민수',
    '영업부장',
    '견적서 검토 완료. 가격 조정 요청 있음. 3% 할인 시 계약 진행 가능.',
    '일반 철강재',
    3000,
    '보통',
    '가격 재조정 후 최종 답변',
    '2024-01-27'
);

-- 7. 업데이트 트리거 생성 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE
    ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE
    ON work_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 유용한 뷰 생성
-- 업체별 최근 방문일 및 방문 횟수
CREATE VIEW company_visit_summary AS
SELECT 
    c.id,
    c.company_name,
    c.region,
    c.contact_person,
    c.phone,
    COUNT(wl.id) as visit_count,
    MAX(wl.visit_date) as last_visit_date,
    MIN(wl.visit_date) as first_visit_date
FROM companies c
LEFT JOIN work_logs wl ON c.id = wl.company_id
GROUP BY c.id, c.company_name, c.region, c.contact_person, c.phone
ORDER BY last_visit_date DESC NULLS LAST;

-- 월별 업무일지 통계
CREATE VIEW monthly_visit_stats AS
SELECT 
    DATE_TRUNC('month', visit_date) as month,
    COUNT(*) as total_visits,
    COUNT(DISTINCT company_id) as unique_companies,
    AVG(estimated_amount) as avg_deal_amount,
    SUM(estimated_amount) as total_estimated_amount
FROM work_logs
GROUP BY DATE_TRUNC('month', visit_date)
ORDER BY month DESC;

-- 데이터베이스 설정 완료 메시지
-- 이 스크립트를 Supabase SQL Editor에서 실행하면
-- 철강영업 업무일지 앱에 필요한 모든 테이블과 샘플 데이터가 생성됩니다.