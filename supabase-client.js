// Supabase 설정
const SUPABASE_URL = 'https://jfaqjlrphjkjfoigaibe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXFqbHJwaGpramZvaWdhaWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjgxNTgsImV4cCI6MjA2NDc0NDE1OH0.EdIgkjcK4ABO_BvbM81GQ1gibwnHRlw5vjHrzaKQUZs';

// Supabase 클라이언트 초기화 (CDN 버전 사용)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 데이터베이스 테이블 구조:
// 
// companies 테이블:
// - id (uuid, primary key)
// - company_name (text, not null)
// - region (text, not null)
// - address (text)
// - contact_person (text)
// - phone (text)
// - email (text)
// - business_type (text)
// - notes (text)
// - created_at (timestamp)
// - updated_at (timestamp)
//
// work_logs 테이블:
// - id (uuid, primary key)
// - company_id (uuid, foreign key references companies.id)
// - visit_date (date, not null)
// - visit_time (time)
// - visit_purpose (text, not null)
// - meeting_person (text)
// - meeting_person_title (text)
// - discussion_content (text, not null)
// - proposed_items (text)
// - estimated_amount (numeric)
// - customer_response (text)
// - next_action (text)
// - follow_up_date (date)
// - additional_notes (text)
// - created_at (timestamp)
// - updated_at (timestamp)

// 회사 관련 함수들
const CompanyService = {
    // 모든 회사 조회
    async getAll() {
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .select('*')
                .order('company_name');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회사 목록 조회 오류:', error);
            throw error;
        }
    },

    // 회사 검색 (지역 또는 업체명)
    async search(region = '', companyName = '') {
        try {
            let query = supabaseClient.from('companies').select('*');
            
            if (region) {
                query = query.ilike('region', `%${region}%`);
            }
            
            if (companyName) {
                query = query.ilike('company_name', `%${companyName}%`);
            }
            
            const { data, error } = await query.order('company_name');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회사 검색 오류:', error);
            throw error;
        }
    },

    // 특정 회사 조회
    async getById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회사 상세 조회 오류:', error);
            throw error;
        }
    },

    // 회사 생성
    async create(companyData) {
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .insert([companyData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회사 생성 오류:', error);
            throw error;
        }
    },

    // 회사 수정
    async update(id, companyData) {
        try {
            const updateData = {
                ...companyData,
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('companies')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('회사 수정 오류:', error);
            throw error;
        }
    },

    // 회사 삭제
    async delete(id) {
        try {
            // 먼저 관련된 업무일지들을 삭제
            await WorkLogService.deleteByCompanyId(id);
            
            const { error } = await supabaseClient
                .from('companies')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('회사 삭제 오류:', error);
            throw error;
        }
    }
};

// 업무일지 관련 함수들
const WorkLogService = {
    // 특정 회사의 업무일지 조회
    async getByCompanyId(companyId) {
        try {
            const { data, error } = await supabaseClient
                .from('work_logs')
                .select('*')
                .eq('company_id', companyId)
                .order('visit_date', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('업무일지 조회 오류:', error);
            throw error;
        }
    },

    // 특정 업무일지 조회
    async getById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('work_logs')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('업무일지 상세 조회 오류:', error);
            throw error;
        }
    },

    // 업무일지 생성
    async create(workLogData) {
        try {
            const { data, error } = await supabaseClient
                .from('work_logs')
                .insert([workLogData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('업무일지 생성 오류:', error);
            throw error;
        }
    },

    // 업무일지 수정
    async update(id, workLogData) {
        try {
            const updateData = {
                ...workLogData,
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('work_logs')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('업무일지 수정 오류:', error);
            throw error;
        }
    },

    // 업무일지 삭제
    async delete(id) {
        try {
            const { error } = await supabaseClient
                .from('work_logs')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('업무일지 삭제 오류:', error);
            throw error;
        }
    },

    // 특정 회사의 모든 업무일지 삭제 (회사 삭제시 사용)
    async deleteByCompanyId(companyId) {
        try {
            const { error } = await supabaseClient
                .from('work_logs')
                .delete()
                .eq('company_id', companyId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('회사별 업무일지 삭제 오류:', error);
            throw error;
        }
    }
};

// 유틸리티 함수들
const Utils = {
    // 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    },

    // 시간 포맷팅
    formatTime(timeString) {
        if (!timeString) return '';
        return timeString.slice(0, 5); // HH:MM 형태로 변환
    },

    // 숫자 포맷팅 (금액)
    formatCurrency(amount) {
        if (!amount) return '';
        return new Intl.NumberFormat('ko-KR').format(amount) + '만원';
    },

    // 오류 메시지 표시
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    },

    // 성공 메시지 표시
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    },

    // URL 파라미터 가져오기
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // 로딩 상태 표시
    showLoading(element) {
        element.innerHTML = '<div class="loading">로딩 중...</div>';
    },

    // 빈 상태 표시
    showEmptyState(element, message) {
        element.innerHTML = `
            <div class="empty-state">
                <h3>데이터가 없습니다</h3>
                <p>${message}</p>
            </div>
        `;
    },

    // 색상 이모지 가져오기
    getColorEmoji(color) {
        const colorEmojis = {
            'red': '🔴',
            'orange': '🟠',
            'yellow': '🟡',
            'green': '🟢',
            'blue': '🔵',
            'purple': '🟣',
            'gray': '⚫'
        };
        return colorEmojis[color] || '';
    },

    // 색상 표시 텍스트 가져오기
    getColorDisplay(color) {
        const colorNames = {
            'red': '🔴 빨강',
            'orange': '🟠 주황',
            'yellow': '🟡 노랑',
            'green': '🟢 초록',
            'blue': '🔵 파랑',
            'purple': '🟣 보라',
            'gray': '⚫ 회색'
        };
        return colorNames[color] || color;
    }
};