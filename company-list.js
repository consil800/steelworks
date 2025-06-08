// 업체 리스트 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const companyTableBody = document.getElementById('companyTableBody');
    const refreshBtn = document.getElementById('refreshBtn');
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const loadingMessage = document.getElementById('loadingMessage');
    const emptyMessage = document.getElementById('emptyMessage');

    // 초기 데이터 로드
    loadCompanies();

    // 이벤트 리스너 등록
    refreshBtn.addEventListener('click', loadCompanies);
    addCompanyBtn.addEventListener('click', () => {
        window.location.href = 'company-register.html';
    });

    // 업체 데이터 로드
    async function loadCompanies() {
        try {
            showLoading();
            
            // 업체 데이터와 방문 기록 데이터를 모두 가져오기
            const [companies, workLogs] = await Promise.all([
                CompanyService.getAll(),
                WorkLogService.getAll()
            ]);

            // 각 업체별 방문 통계 계산
            const companyStats = calculateVisitStats(companies, workLogs);
            
            displayCompanies(companyStats);
        } catch (error) {
            Utils.showError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
            showEmpty();
        }
    }

    // 방문 통계 계산
    function calculateVisitStats(companies, workLogs) {
        return companies.map(company => {
            const companyLogs = workLogs.filter(log => log.company_id === company.id);
            const visitCount = companyLogs.length;
            
            // 최근 방문일 찾기
            let lastVisitDate = null;
            if (companyLogs.length > 0) {
                const sortedLogs = companyLogs.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
                lastVisitDate = sortedLogs[0].visit_date;
            }

            return {
                ...company,
                visitCount,
                lastVisitDate
            };
        });
    }

    // 업체 목록 표시
    function displayCompanies(companies) {
        hideLoading();
        
        if (!companies || companies.length === 0) {
            showEmpty();
            return;
        }

        hideEmpty();

        const html = companies.map(company => `
            <tr>
                <td>
                    <span class="company-name" onclick="goToCompanyDetail('${company.id}')">
                        ${company.company_name || '미입력'}
                    </span>
                </td>
                <td>${company.address || '미입력'}</td>
                <td>${company.contact_person || '미입력'}</td>
                <td>${company.phone || '미입력'}</td>
                <td>${company.business_type || '미입력'}</td>
                <td class="visit-count">${company.visitCount || 0}</td>
                <td class="last-visit">${formatDate(company.lastVisitDate) || '방문기록 없음'}</td>
            </tr>
        `).join('');

        companyTableBody.innerHTML = html;
    }

    // 날짜 포맷팅
    function formatDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // 로딩 상태 표시
    function showLoading() {
        loadingMessage.style.display = 'block';
        emptyMessage.style.display = 'none';
        companyTableBody.innerHTML = '';
    }

    function hideLoading() {
        loadingMessage.style.display = 'none';
    }

    // 빈 상태 표시
    function showEmpty() {
        hideLoading();
        emptyMessage.style.display = 'block';
        companyTableBody.innerHTML = '';
    }

    function hideEmpty() {
        emptyMessage.style.display = 'none';
    }

    // 업체 상세 페이지로 이동
    window.goToCompanyDetail = function(companyId) {
        window.location.href = `company-detail.html?id=${companyId}`;
    };

    // WorkLogService가 없을 경우를 위한 임시 구현
    window.WorkLogService = window.WorkLogService || {
        async getAll() {
            try {
                const { data, error } = await supabase
                    .from('work_logs')
                    .select('*')
                    .order('visit_date', { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.warn('Work logs를 가져올 수 없습니다:', error);
                return [];
            }
        }
    };
});