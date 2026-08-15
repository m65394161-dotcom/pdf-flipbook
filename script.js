// إعداد مسار الـ Worker الخاص بمكتبة PDF.js لزيادة سرعة القراءة
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// تحديد عناصر الواجهة
const pdfInput = document.getElementById('pdf-input');
const loadingStatus = document.getElementById('loading-status');
const flipbookContainer = document.getElementById('flipbook');
let pageFlipInstance = null;

// الاستماع لحدث اختيار ملف PDF جديد
pdfInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('يرجى اختيار ملف PDF صحيح.');
        return;
    }

    loadingStatus.textContent = 'جاري قراءة الملف...';
    
    // قراءة الملف وتحويله إلى صيغة يفهمها المتصفح
    const fileReader = new FileReader();
    fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        await renderPDFToFlipbook(typedarray);
    };
    fileReader.readAsArrayBuffer(file);
});

// دالة معالجة الـ PDF وتحويله لكتاب تفاعلي
async function renderPDFToFlipbook(pdfData) {
    try {
        // تحميل مستند الـ PDF
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        const totalPages = pdf.numPages;
        
        loadingStatus.textContent = `جاري تجهيز ${totalPages} صفحة...`;

        // إزالة الكتاب القديم إن وجد
        flipbookContainer.innerHTML = '';
        if (pageFlipInstance) {
            pageFlipInstance.destroy();
        }

        // أخذ أبعاد الصفحة الأولى لمعايرة حجم الكتاب
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });

        // تحويل كل صفحات الـ PDF إلى عناصر صور
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            loadingStatus.textContent = `جاري معالجة الصفحة ${pageNum} من ${totalPages}...`;
            
            const page = await pdf.getPage(pageNum);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // رسم الصفحة على الـ Canvas
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // إنشاء عنصر Diva يحتوي صورة الصفحة
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-node';
            pageDiv.style.width = viewport.width + 'px';
            pageDiv.style.height = viewport.height + 'px';
            pageDiv.style.backgroundImage = `url(${canvas.toDataURL('image/jpeg')})`;
            
            flipbookContainer.appendChild(pageDiv);
        }

        // إظهار حاوية الكتاب
        flipbookContainer.style.display = 'block';

        // تشغيل مكتبة PageFlip لعمل تأثير التقليب
        pageFlipInstance = new St.PageFlip(flipbookContainer, {
            width: viewport.width,
            height: viewport.height,
            size: "fixed",
            minWidth: 300,
            maxWidth: 1000,
            minHeight: 400,
            maxHeight: 1200,
            maxShadowOpacity: 0.5,
            showCover: true
        });

        // تحميل العناصر المحضرة
        pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-node'));
        loadingStatus.textContent = 'تم تحميل الكتاب بنجاح!';

    } catch (error) {
        console.error(error);
        loadingStatus.textContent = 'حدث خطأ أثناء معالجة الملف.';
    }
}
