-- 업체 테이블에 색상 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. company_color 컬럼 추가
ALTER TABLE companies ADD COLUMN company_color TEXT;

-- 2. 기존 샘플 데이터에 색상 추가 (선택사항)
UPDATE companies SET company_color = 'red' WHERE company_name = '한국철강';
UPDATE companies SET company_color = 'blue' WHERE company_name = '대한금속';
UPDATE companies SET company_color = 'green' WHERE company_name = '동양스틸';
UPDATE companies SET company_color = 'orange' WHERE company_name = '서울건설';
UPDATE companies SET company_color = 'purple' WHERE company_name = '부산조선';

-- 3. 색상 컬럼에 대한 체크 제약 조건 추가 (선택사항)
ALTER TABLE companies 
ADD CONSTRAINT check_company_color 
CHECK (company_color IS NULL OR company_color IN ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'));

-- 컬럼 추가 완료