// 업무일지 작성/수정 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const companyId = Utils.getUrlParameter('companyId');
    const workLogId = Utils.getUrlParameter('id');
    
    if (!companyId) {
        Utils.showError('업체 ID가 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    const workLogTitle = document.getElementById('workLogTitle');
    const workLogForm = document.getElementById('workLogForm');
    const cancelWorkLogBtn = document.getElementById('cancelWorkLogBtn');
    const backToCompanyBtn = document.getElementById('backToCompanyBtn');

    let isEditMode = !!workLogId;
    let currentCompany = null;

    // 초기 설정
    initializePage();

    // 이벤트 리스너 등록
    workLogForm.addEventListener('submit', handleSubmit);
    cancelWorkLogBtn.addEventListener('click', goBackToCompany);
    backToCompanyBtn.addEventListener('click', goBackToCompany);

    // 페이지 초기화
    async function initializePage() {
        try {
            // 업체 정보 로드
            currentCompany = await CompanyService.getById(companyId);
            
            if (isEditMode) {
                workLogTitle.textContent = `업무일지 수정 - ${currentCompany.company_name}`;
                await loadWorkLogData();
            } else {
                workLogTitle.textContent = `업무일지 작성 - ${currentCompany.company_name}`;
                // 새 일지 작성시 오늘 날짜를 기본값으로 설정
                document.getElementById('visitDate').value = new Date().toISOString().split('T')[0];
            }
        } catch (error) {
            Utils.showError('페이지 초기화 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 기존 업무일지 데이터 로드 (수정 모드)
    async function loadWorkLogData() {
        try {
            const workLog = await WorkLogService.getById(workLogId);
            
            // 폼에 데이터 설정
            document.getElementById('visitDate').value = workLog.visit_date;
            document.getElementById('visitPurpose').value = workLog.visit_purpose;
            document.getElementById('meetingPerson').value = workLog.meeting_person || '';
            document.getElementById('meetingPersonTitle').value = workLog.meeting_person_title || '';
            document.getElementById('discussionContent').value = workLog.discussion_content;
            document.getElementById('nextAction').value = workLog.next_action || '';
            document.getElementById('followUpDate').value = workLog.follow_up_date || '';
            document.getElementById('additionalNotes').value = workLog.additional_notes || '';

        } catch (error) {
            Utils.showError('업무일지 데이터 로드 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 폼 제출 처리
    async function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(workLogForm);
        const workLogData = {
            company_id: companyId,
            visit_date: formData.get('visitDate'),
            visit_purpose: formData.get('visitPurpose'),
            meeting_person: formData.get('meetingPerson'),
            meeting_person_title: formData.get('meetingPersonTitle'),
            discussion_content: formData.get('discussionContent'),
            next_action: formData.get('nextAction'),
            follow_up_date: formData.get('followUpDate') || null,
            additional_notes: formData.get('additionalNotes')
        };

        // 필수 항목 검증
        if (!workLogData.visit_date || !workLogData.visit_purpose || !workLogData.discussion_content) {
            Utils.showError('방문일자, 방문목적, 상담내용은 필수 입력 항목입니다.');
            return;
        }

        // 날짜 유효성 검증
        const visitDate = new Date(workLogData.visit_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (visitDate > today) {
            Utils.showError('방문일자는 오늘 날짜 이후로 설정할 수 없습니다.');
            return;
        }

        // 다음 방문 예정일 검증
        if (workLogData.follow_up_date) {
            const followUpDate = new Date(workLogData.follow_up_date);
            if (followUpDate <= visitDate) {
                Utils.showError('다음 방문 예정일은 방문일자 이후여야 합니다.');
                return;
            }
        }

        try {
            // 제출 버튼 비활성화
            const submitBtn = workLogForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = isEditMode ? '수정 중...' : '저장 중...';

            if (isEditMode) {
                await WorkLogService.update(workLogId, workLogData);
                Utils.showSuccess('업무일지가 성공적으로 수정되었습니다.');
            } else {
                await WorkLogService.create(workLogData);
                Utils.showSuccess('업무일지가 성공적으로 저장되었습니다.');
            }
            
            // 1초 후 업체 상세 페이지로 이동
            setTimeout(() => {
                goBackToCompany();
            }, 1000);

        } catch (error) {
            Utils.showError(`업무일지 ${isEditMode ? '수정' : '저장'} 중 오류가 발생했습니다: ` + error.message);
            
            // 제출 버튼 다시 활성화
            const submitBtn = workLogForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? '수정' : '저장';
        }
    }

    // 업체 상세 페이지로 돌아가기
    function goBackToCompany() {
        window.location.href = `company-detail.html?id=${companyId}`;
    }

    // 삭제 기능 (수정 모드에서만 사용)
    if (isEditMode) {
        // 삭제 버튼 추가
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', handleDelete);
        
        const formActions = document.querySelector('.form-actions');
        formActions.appendChild(deleteBtn);
    }

    // 업무일지 삭제 처리
    async function handleDelete() {
        if (!confirm('정말로 이 업무일지를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const deleteBtn = document.querySelector('.btn-danger');
            deleteBtn.disabled = true;
            deleteBtn.textContent = '삭제 중...';

            await WorkLogService.delete(workLogId);
            
            Utils.showSuccess('업무일지가 성공적으로 삭제되었습니다.');
            
            // 1초 후 업체 상세 페이지로 이동
            setTimeout(() => {
                goBackToCompany();
            }, 1000);

        } catch (error) {
            Utils.showError('업무일지 삭제 중 오류가 발생했습니다: ' + error.message);
            
            const deleteBtn = document.querySelector('.btn-danger');
            deleteBtn.disabled = false;
            deleteBtn.textContent = '삭제';
        }
    }

    // 폼 자동 저장 기능 (선택사항)
    let autoSaveTimeout;
    const autoSaveElements = workLogForm.querySelectorAll('input, select, textarea');
    
    autoSaveElements.forEach(element => {
        element.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                saveToLocalStorage();
            }, 2000); // 2초 후 자동 저장
        });
    });

    // 로컬 스토리지에 임시 저장
    function saveToLocalStorage() {
        if (!isEditMode) { // 새 일지 작성시만 자동 저장
            const formData = new FormData(workLogForm);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            localStorage.setItem(`worklog_draft_${companyId}`, JSON.stringify(data));
        }
    }

    // 로컬 스토리지에서 임시 저장된 데이터 복원
    function restoreFromLocalStorage() {
        if (!isEditMode) {
            const saved = localStorage.getItem(`worklog_draft_${companyId}`);
            if (saved) {
                const data = JSON.parse(saved);
                Object.keys(data).forEach(key => {
                    const element = document.querySelector(`[name="${key}"]`);
                    if (element && data[key]) {
                        element.value = data[key];
                    }
                });
            }
        }
    }

    // 페이지 로드시 임시 저장된 데이터 복원
    if (!isEditMode) {
        restoreFromLocalStorage();
        
        // 폼 제출 성공시 임시 저장 데이터 삭제
        workLogForm.addEventListener('submit', () => {
            localStorage.removeItem(`worklog_draft_${companyId}`);
        });
    }
});