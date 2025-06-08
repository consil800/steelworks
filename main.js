// 메인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const searchRegionInput = document.getElementById('searchRegion');
    const searchCompanyInput = document.getElementById('searchCompany');
    const searchBtn = document.getElementById('searchBtn');
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    const companyList = document.getElementById('companyList');

    // 초기 데이터 로드
    loadCompanies();

    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', handleSearch);
    addCompanyBtn.addEventListener('click', () => {
        window.location.href = 'company-register.html';
    });
    exportBtn.addEventListener('click', exportCompanies);
    importBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', importCompanies);

    // 엔터키로 검색
    searchRegionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchCompanyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 검색 처리 함수
    async function handleSearch() {
        const region = searchRegionInput.value.trim();
        const companyName = searchCompanyInput.value.trim();

        try {
            Utils.showLoading(companyList);
            
            let companies;
            if (region || companyName) {
                companies = await CompanyService.search(region, companyName);
            } else {
                companies = await CompanyService.getAll();
            }

            displayCompanies(companies);
        } catch (error) {
            Utils.showError('검색 중 오류가 발생했습니다: ' + error.message);
            companyList.innerHTML = '';
        }
    }

    // 모든 회사 로드
    async function loadCompanies() {
        try {
            Utils.showLoading(companyList);
            const companies = await CompanyService.getAll();
            displayCompanies(companies);
        } catch (error) {
            Utils.showError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
            companyList.innerHTML = '';
        }
    }

    // 회사 목록 표시
    async function displayCompanies(companies) {
        if (!companies || companies.length === 0) {
            companyList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">등록된 업체가 없습니다. 새 업체를 등록해보세요.</td></tr>';
            return;
        }

        // 방문 기록 데이터 가져오기
        let workLogs = [];
        try {
            if (window.WorkLogService && WorkLogService.getAll) {
                workLogs = await WorkLogService.getAll();
            } else {
                // Supabase 직접 호출
                const { data, error } = await supabaseClient
                    .from('work_logs')
                    .select('*')
                    .order('visit_date', { ascending: false });
                
                if (error) throw error;
                workLogs = data || [];
            }
        } catch (error) {
            console.warn('방문 기록을 가져올 수 없습니다:', error);
        }

        // 각 업체별 방문 통계 계산
        const companiesWithStats = companies.map(company => {
            const companyLogs = workLogs.filter(log => log.company_id === company.id);
            const visitCount = companyLogs.length;
            
            console.log(`업체 ${company.company_name}: 전체 로그 ${workLogs.length}개, 해당 업체 로그 ${visitCount}개`);
            console.log('업체 ID:', company.id);
            console.log('해당 로그들:', companyLogs);
            
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

        const html = companiesWithStats.map(company => `
            <tr class="company-row ${company.company_color ? `color-${company.company_color}` : ''}" onclick="goToCompanyDetail('${company.id}')">
                <td>
                    ${company.company_color ? `<span class="color-indicator"></span>` : ''}
                    <span class="company-name">
                        ${company.company_name || '미입력'}
                    </span>
                </td>
                <td>${company.address || '미입력'}</td>
                <td>${company.contact_person || '미입력'}</td>
                <td>${company.phone || '미입력'}</td>
                <td>${company.business_type || '미입력'}</td>
                <td class="visit-count">${company.visitCount || 0}</td>
                <td class="last-visit">${company.company_color === 'gray' ? '-' : (company.lastVisitDate ? formatDate(company.lastVisitDate) + '일' : '방문기록 없음')}</td>
            </tr>
        `).join('');

        companyList.innerHTML = html;
        
        // 정렬용 데이터 저장
        companiesData = companiesWithStats;
    }

    // 날짜 차이 계산 (경과 일수)
    function formatDate(dateString) {
        if (!dateString) return null;
        
        const visitDate = new Date(dateString);
        const today = new Date();
        
        // 시간 정보를 제거하고 날짜만 비교
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = todayOnly - visitDateOnly;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // WorkLogService가 없을 경우를 위한 임시 구현
    window.WorkLogService = window.WorkLogService || {
        async getAll() {
            try {
                const { data, error } = await supabaseClient
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

    // 회사 상세 페이지로 이동
    window.goToCompanyDetail = function(companyId) {
        window.location.href = `company-detail.html?id=${companyId}`;
    };

    // 정렬 상태 저장
    let currentSortColumn = -1;
    let sortDirection = 'asc';
    let companiesData = [];

    // 테이블 정렬 함수
    window.sortTable = function(columnIndex) {
        const table = document.getElementById('companyTable');
        const headers = table.querySelectorAll('th.sortable');
        
        // 기존 정렬 클래스 제거
        headers.forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        // 정렬 방향 결정
        if (currentSortColumn === columnIndex) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortDirection = 'asc';
        }
        
        currentSortColumn = columnIndex;
        
        // 헤더에 정렬 클래스 추가
        headers[columnIndex].classList.add(sortDirection);

        // 데이터 정렬
        const sortedCompanies = [...companiesData].sort((a, b) => {
            let aValue, bValue;
            
            switch(columnIndex) {
                case 0: // 업체명
                    aValue = (a.company_name || '').toLowerCase();
                    bValue = (b.company_name || '').toLowerCase();
                    break;
                case 1: // 주소
                    aValue = (a.address || '').toLowerCase();
                    bValue = (b.address || '').toLowerCase();
                    break;
                case 2: // 담당자
                    aValue = (a.contact_person || '').toLowerCase();
                    bValue = (b.contact_person || '').toLowerCase();
                    break;
                case 3: // 전화번호
                    aValue = (a.phone || '').toLowerCase();
                    bValue = (b.phone || '').toLowerCase();
                    break;
                case 4: // 업종
                    aValue = (a.business_type || '').toLowerCase();
                    bValue = (b.business_type || '').toLowerCase();
                    break;
                case 5: // 방문횟수
                    aValue = a.visitCount || 0;
                    bValue = b.visitCount || 0;
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                case 6: // 최근방문일
                    // 회색 업체는 정렬에서 제외하고 맨 뒤로
                    if (a.company_color === 'gray' && b.company_color === 'gray') return 0;
                    if (a.company_color === 'gray') return sortDirection === 'asc' ? 1 : -1;
                    if (b.company_color === 'gray') return sortDirection === 'asc' ? -1 : 1;
                    
                    aValue = a.lastVisitDate ? new Date(a.lastVisitDate) : new Date(0);
                    bValue = b.lastVisitDate ? new Date(b.lastVisitDate) : new Date(0);
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                default:
                    return 0;
            }
            
            // 문자열 비교
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // 정렬된 데이터로 테이블 다시 렌더링
        renderSortedCompanies(sortedCompanies);
    };

    // 정렬된 업체 목록 렌더링
    function renderSortedCompanies(companies) {
        const html = companies.map(company => `
            <tr class="company-row ${company.company_color ? `color-${company.company_color}` : ''}" onclick="goToCompanyDetail('${company.id}')">
                <td>
                    ${company.company_color ? `<span class="color-indicator"></span>` : ''}
                    <span class="company-name">
                        ${company.company_name || '미입력'}
                    </span>
                </td>
                <td>${company.address || '미입력'}</td>
                <td>${company.contact_person || '미입력'}</td>
                <td>${company.phone || '미입력'}</td>
                <td>${company.business_type || '미입력'}</td>
                <td class="visit-count">${company.visitCount || 0}</td>
                <td class="last-visit">${company.company_color === 'gray' ? '-' : (company.lastVisitDate ? formatDate(company.lastVisitDate) + '일' : '방문기록 없음')}</td>
            </tr>
        `).join('');

        companyList.innerHTML = html;
    }

    // 업체 목록 내보내기 함수
    async function exportCompanies() {
        try {
            const companies = await CompanyService.getAll();
            
            if (!companies || companies.length === 0) {
                Utils.showError('내보낼 업체 데이터가 없습니다.');
                return;
            }

            // CSV 헤더
            const headers = [
                '업체명',
                '지역', 
                '주소',
                '담당자',
                '전화번호',
                '이메일',
                '업종',
                '메모',
                '색상'
            ];

            // CSV 데이터 생성
            const csvData = companies.map(company => [
                company.company_name || '',
                company.region || '',
                company.address || '',
                company.contact_person || '',
                company.phone || '',
                company.email || '',
                company.business_type || '',
                company.notes || '',
                company.company_color || ''
            ]);

            // CSV 문자열 생성
            const csvContent = [headers, ...csvData]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // BOM 추가 (한글 깨짐 방지)
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

            // 파일 다운로드
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `업체목록_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showSuccess('업체 목록을 성공적으로 내보냈습니다.');
        } catch (error) {
            Utils.showError('내보내기 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 업체 목록 불러오기 함수
    async function importCompanies(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            Utils.showError('CSV 파일만 업로드 가능합니다.');
            return;
        }

        try {
            const text = await readFileAsText(file);
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                Utils.showError('유효한 CSV 데이터가 없습니다.');
                return;
            }

            // 헤더 제거
            const dataLines = lines.slice(1);
            let successCount = 0;
            let errorCount = 0;

            for (const line of dataLines) {
                try {
                    const fields = parseCSVLine(line);
                    
                    if (fields.length >= 1 && fields[0].trim()) {
                        const companyData = {
                            company_name: fields[0] || '',
                            region: fields[1] || '',
                            address: fields[2] || '',
                            contact_person: fields[3] || '',
                            phone: fields[4] || '',
                            email: fields[5] || '',
                            business_type: fields[6] || '',
                            notes: fields[7] || '',
                            company_color: fields[8] || null
                        };

                        await CompanyService.create(companyData);
                        successCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('업체 추가 실패:', error);
                }
            }

            // 결과 메시지
            if (successCount > 0) {
                Utils.showSuccess(`${successCount}개 업체를 성공적으로 불러왔습니다.`);
                if (errorCount > 0) {
                    Utils.showError(`${errorCount}개 업체 불러오기에 실패했습니다.`);
                }
                // 목록 새로고침
                loadCompanies();
            } else {
                Utils.showError('업체를 불러오는데 실패했습니다.');
            }

        } catch (error) {
            Utils.showError('파일 읽기 중 오류가 발생했습니다: ' + error.message);
        }

        // 파일 입력 초기화
        csvFileInput.value = '';
    }

    // 파일을 텍스트로 읽기
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file, 'UTF-8');
        });
    }

    // CSV 라인 파싱 (간단한 CSV 파서)
    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // 다음 따옴표 건너뛰기
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        fields.push(currentField.trim());
        return fields;
    }
});