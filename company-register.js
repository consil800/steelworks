// 업체 등록 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const companyForm = document.getElementById('companyForm');
    const cancelBtn = document.getElementById('cancelBtn');

    // 이벤트 리스너 등록
    companyForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 폼 제출 처리
    async function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(companyForm);
        const companyData = {
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
        if (!companyData.company_name || !companyData.region) {
            Utils.showError('업체명과 지역은 필수 입력 항목입니다.');
            return;
        }

        try {
            // 제출 버튼 비활성화
            const submitBtn = companyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '등록 중...';

            await CompanyService.create(companyData);
            
            Utils.showSuccess('업체가 성공적으로 등록되었습니다.');
            
            // 1초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            Utils.showError('업체 등록 중 오류가 발생했습니다: ' + error.message);
            
            // 제출 버튼 다시 활성화
            const submitBtn = companyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = '등록';
        }
    }
});