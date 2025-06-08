// 업체 상세 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const companyId = Utils.getUrlParameter('id');
    
    if (!companyId) {
        Utils.showError('업체 ID가 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    const companyTitle = document.getElementById('companyTitle');
    const companyDetails = document.getElementById('companyDetails');
    const workLogList = document.getElementById('workLogList');
    const editCompanyBtn = document.getElementById('editCompanyBtn');
    const deleteCompanyBtn = document.getElementById('deleteCompanyBtn');
    const newWorkLogBtn = document.getElementById('newWorkLogBtn');
    
    // 모달 관련 요소들
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const editCompanyForm = document.getElementById('editCompanyForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    let currentCompany = null;

    // 초기 데이터 로드
    loadCompanyDetail();
    loadWorkLogs();

    // 이벤트 리스너 등록
    editCompanyBtn.addEventListener('click', openEditModal);
    deleteCompanyBtn.addEventListener('click', handleDeleteCompany);
    newWorkLogBtn.addEventListener('click', () => {
        window.location.href = `work-log.html?companyId=${companyId}`;
    });

    // 모달 관련 이벤트
    closeModal.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editCompanyForm.addEventListener('submit', handleEditSubmit);

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // 업체 상세 정보 로드
    async function loadCompanyDetail() {
        try {
            Utils.showLoading(companyDetails);
            currentCompany = await CompanyService.getById(companyId);
            displayCompanyDetail(currentCompany);
        } catch (error) {
            Utils.showError('업체 정보 로드 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 업체 상세 정보 표시
    function displayCompanyDetail(company) {
        companyTitle.textContent = company.company_name;
        
        const html = `
            <div class="info-item">
                <strong>업체명</strong>
                ${company.company_name}
            </div>
            <div class="info-item">
                <strong>지역</strong>
                ${company.region}
            </div>
            <div class="info-item">
                <strong>주소</strong>
                ${company.address || '미입력'}
            </div>
            <div class="info-item">
                <strong>담당자명</strong>
                ${company.contact_person || '미입력'}
            </div>
            <div class="info-item">
                <strong>연락처</strong>
                ${company.phone || '미입력'}
            </div>
            <div class="info-item">
                <strong>이메일</strong>
                ${company.email || '미입력'}
            </div>
            <div class="info-item">
                <strong>업종</strong>
                ${company.business_type || '미입력'}
            </div>
            <div class="info-item">
                <strong>업체 색상</strong>
                ${company.company_color ? Utils.getColorDisplay(company.company_color) : '미설정'}
            </div>
            <div class="info-item">
                <strong>등록일</strong>
                ${Utils.formatDate(company.created_at)}
            </div>
            ${company.notes ? `
                <div class="info-item" style="grid-column: 1 / -1;">
                    <strong>비고</strong>
                    ${company.notes}
                </div>
            ` : ''}
        `;

        companyDetails.innerHTML = html;
    }

    // 업무일지 목록 로드
    async function loadWorkLogs() {
        try {
            Utils.showLoading(workLogList);
            const workLogs = await WorkLogService.getByCompanyId(companyId);
            displayWorkLogs(workLogs);
        } catch (error) {
            Utils.showError('업무일지 로드 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 업무일지 목록 표시
    function displayWorkLogs(workLogs) {
        if (!workLogs || workLogs.length === 0) {
            Utils.showEmptyState(workLogList, '작성된 업무일지가 없습니다. 새 일지를 작성해보세요.');
            return;
        }

        const html = workLogs.map(log => `
            <div class="work-log-item" onclick="editWorkLog('${log.id}')">
                <div class="work-log-header">
                    <span class="work-log-date">${Utils.formatDate(log.visit_date)}</span>
                    <span class="work-log-purpose">${log.visit_purpose}</span>
                </div>
                <div class="work-log-content">
                    <p><strong>면담자:</strong> ${log.meeting_person || '미입력'}</p>
                    <p><strong>상담내용:</strong> ${log.discussion_content.length > 100 ? 
                        log.discussion_content.substring(0, 100) + '...' : 
                        log.discussion_content}</p>
                </div>
            </div>
        `).join('');

        workLogList.innerHTML = html;
    }

    // 수정 모달 열기
    function openEditModal() {
        if (!currentCompany) return;

        // 폼에 현재 데이터 설정
        document.getElementById('editCompanyName').value = currentCompany.company_name;
        document.getElementById('editRegion').value = currentCompany.region;
        document.getElementById('editAddress').value = currentCompany.address || '';
        document.getElementById('editContactPerson').value = currentCompany.contact_person || '';
        document.getElementById('editPhone').value = currentCompany.phone || '';
        document.getElementById('editEmail').value = currentCompany.email || '';
        document.getElementById('editBusinessType').value = currentCompany.business_type || '';
        document.getElementById('editCompanyColor').value = currentCompany.company_color || '';
        document.getElementById('editNotes').value = currentCompany.notes || '';

        editModal.style.display = 'block';
    }

    // 수정 모달 닫기
    function closeEditModal() {
        editModal.style.display = 'none';
    }

    // 업체 정보 수정 처리
    async function handleEditSubmit(e) {
        e.preventDefault();

        const formData = new FormData(editCompanyForm);
        const updateData = {
            company_name: formData.get('companyName'),
            region: formData.get('region'),
            address: formData.get('address'),
            contact_person: formData.get('contactPerson'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            business_type: formData.get('businessType'),
            company_color: formData.get('companyColor'),
            notes: formData.get('notes')
        };

        // 필수 항목 검증
        if (!updateData.company_name || !updateData.region) {
            Utils.showError('업체명과 지역은 필수 입력 항목입니다.');
            return;
        }

        try {
            const submitBtn = editCompanyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '수정 중...';

            await CompanyService.update(companyId, updateData);
            
            Utils.showSuccess('업체 정보가 성공적으로 수정되었습니다.');
            closeEditModal();
            loadCompanyDetail(); // 업데이트된 정보 다시 로드

        } catch (error) {
            Utils.showError('업체 정보 수정 중 오류가 발생했습니다: ' + error.message);
        } finally {
            const submitBtn = editCompanyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = '수정';
        }
    }

    // 업체 삭제 처리
    async function handleDeleteCompany() {
        if (!confirm('정말로 이 업체를 삭제하시겠습니까? 관련된 모든 업무일지도 함께 삭제됩니다.')) {
            return;
        }

        try {
            deleteCompanyBtn.disabled = true;
            deleteCompanyBtn.textContent = '삭제 중...';

            await CompanyService.delete(companyId);
            
            Utils.showSuccess('업체가 성공적으로 삭제되었습니다.');
            
            // 1초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            Utils.showError('업체 삭제 중 오류가 발생했습니다: ' + error.message);
            deleteCompanyBtn.disabled = false;
            deleteCompanyBtn.textContent = '업체 삭제';
        }
    }

    // 업무일지 수정 (새 창에서)
    window.editWorkLog = function(workLogId) {
        window.location.href = `work-log.html?companyId=${companyId}&id=${workLogId}`;
    };
});