// ==========================================
// Global Variables & State
// ==========================================
let currentStep = 1;
let totalSteps = 5;
let productData = {};
let quillEditor = null;
let uploadedImages = [];
let autoSaveInterval = null;
let tags = [];
let variants = [];
let customOffers = [];

// ==========================================
// DOM Content Loaded
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ==========================================
// Initialize Application
// ==========================================
function initializeApp() {
    // Initialize Quill Editor
    initQuillEditor();
    
    // Generate initial SKU
    generateSKU();
    
    // Load from localStorage if exists
    loadDraft();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-save
    startAutoSave();
    
    // Update progress
    updateProgress();
    
    // Prevent accidental page leave
    setupBeforeUnload();
}

// ==========================================
// Quill Editor Initialization
// ==========================================
function initQuillEditor() {
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video']
    ];

    quillEditor = new Quill('#detailedDescriptionEditor', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow',
        placeholder: 'Écrivez une description détaillée du produit...'
    });

    // Save content to hidden input on change
    quillEditor.on('text-change', function() {
        document.getElementById('detailedDescriptionContent').value = quillEditor.root.innerHTML;
    });
}

// ==========================================
// Event Listeners Setup
// ==========================================
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('submitBtn').addEventListener('click', submitForm);
    
    // Action buttons
    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);
    document.getElementById('cancelBtn').addEventListener('click', cancelForm);
    
    // SKU generation
    document.getElementById('generateSKU').addEventListener('click', generateSKU);
    
    // Category change
    document.getElementById('categoryId').addEventListener('change', handleCategoryChange);
    
    // Brand change
    document.getElementById('brandId').addEventListener('change', handleBrandChange);
    
    // Short description character counter
    document.getElementById('shortDescription').addEventListener('input', updateCharCounter);
    
    // Video URL validation
    document.getElementById('videoUrl').addEventListener('blur', validateVideoUrl);
    
    // Tags input
    document.getElementById('tagsInput').addEventListener('keydown', handleTagInput);
    
    // Currency change
    document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
    
    // Price calculations
    document.getElementById('regularPrice').addEventListener('input', calculateDiscount);
    document.getElementById('salePrice').addEventListener('input', calculateDiscount);
    
    // Add custom offer
    document.getElementById('addCustomOffer').addEventListener('click', addCustomOffer);
    
    // Product condition change
    document.getElementById('productCondition').addEventListener('change', handleConditionChange);
    
    // Add variant
    document.getElementById('addVariant').addEventListener('click', addVariant);
    
    // Image upload
    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    
    uploadZone.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
    
    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    
    // Modal events
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
}

// ==========================================
// Navigation Functions
// ==========================================
function nextStep() {
    if (currentStep < totalSteps) {
        // Optional: Validate current step
        if (!validateStep(currentStep)) {
            return;
        }
        
        // Mark current step as completed
        markStepCompleted(currentStep);
        
        currentStep++;
        showStep(currentStep);
        updateProgress();
        updateButtons();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
        updateButtons();
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    
    // Update step indicators
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    
    // Special handling for preview step
    if (step === 5) {
        generatePreview();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Show/hide previous button
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }
    
    // Show/hide next/submit buttons
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function markStepCompleted(step) {
    document.querySelector(`.step[data-step="${step}"]`).classList.add('completed');
}

// ==========================================
// Validation Functions
// ==========================================
function validateStep(step) {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    switch(step) {
        case 1:
            isValid = validateStep1();
            break;
        case 2:
            isValid = validateStep2();
            break;
        case 3:
            isValid = validateStep3();
            break;
        case 4:
            isValid = validateStep4();
            break;
    }
    
    return isValid;
}

function validateStep1() {
    let isValid = true;
    
    // Product name
    const productName = document.getElementById('productName').value.trim();
    if (!productName) {
        showError('productName', 'Le nom du produit est requis');
        isValid = false;
    }
    
    // Category
    const categoryId = document.getElementById('categoryId').value;
    if (!categoryId) {
        showError('categoryId', 'Veuillez sélectionner une catégorie');
        isValid = false;
    }
    
    // Short description
    const shortDescription = document.getElementById('shortDescription').value.trim();
    if (!shortDescription) {
        showError('shortDescription', 'La description courte est requise');
        isValid = false;
    }
    
    // Detailed description
    const detailedDescription = quillEditor.getText().trim();
    if (!detailedDescription || detailedDescription.length < 10) {
        showError('detailedDescription', 'La description détaillée est requise');
        isValid = false;
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    // Regular price
    const regularPrice = parseFloat(document.getElementById('regularPrice').value);
    if (!regularPrice || regularPrice <= 0) {
        showError('regularPrice', 'Le prix est requis et doit être supérieur à 0');
        isValid = false;
    }
    
    // Sale price validation
    const salePrice = parseFloat(document.getElementById('salePrice').value);
    if (salePrice && salePrice >= regularPrice) {
        showError('salePrice', 'Le prix réduit doit être inférieur au prix normal');
        isValid = false;
    }
    
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
    // Stock quantity
    const stockQuantity = document.getElementById('stockQuantity').value;
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
        showError('stockQuantity', 'La quantité en stock est requise');
        isValid = false;
    }
    
    return isValid;
}

function validateStep4() {
    let isValid = true;
    
    // At least one image
    if (uploadedImages.length === 0) {
        showError('images', 'Veuillez ajouter au moins une image');
        isValid = false;
    }
    
    return isValid;
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        field.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
        el.classList.remove('error');
    });
}

// ==========================================
// SKU Generation
// ==========================================
function generateSKU() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const sku = `PRD-${timestamp}-${random}`;
    document.getElementById('productSKU').value = sku;
}

// ==========================================
// Category & Brand Handling
// ==========================================
function handleCategoryChange(e) {
    const customGroup = document.getElementById('customCategoryGroup');
    if (e.target.value === 'other') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

function handleBrandChange(e) {
    const customGroup = document.getElementById('customBrandGroup');
    if (e.target.value === 'other') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

// ==========================================
// Character Counter
// ==========================================
function updateCharCounter(e) {
    const count = e.target.value.length;
    document.getElementById('shortDescCount').textContent = count;
}

// ==========================================
// Video URL Validation
// ==========================================
function validateVideoUrl() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    
    if (!videoUrl) {
        return true;
    }
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    
    if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
        showError('videoUrl', 'URL vidéo invalide. Utilisez YouTube ou Vimeo');
        return false;
    }
    
    return true;
}

// ==========================================
// Tags Management
// ==========================================
function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
    }
}

function addTag() {
    const input = document.getElementById('tagsInput');
    const tagValue = input.value.trim();
    
    if (!tagValue) return;
    
    if (tags.length >= 5) {
        showToast('Maximum 5 tags autorisés', 'warning');
        return;
    }
    
    if (tags.includes(tagValue)) {
        showToast('Ce tag existe déjà', 'warning');
        return;
    }
    
    tags.push(tagValue);
    renderTags();
    input.value = '';
    
    // Update hidden input
    document.getElementById('productTags').value = JSON.stringify(tags);
}

function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
    document.getElementById('productTags').value = JSON.stringify(tags);
}

function renderTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';
    
    tags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            <span>${tag}</span>
            <button type="button" class="tag-remove" onclick="removeTag(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        tagsList.appendChild(tagElement);
    });
}

// ==========================================
// Currency Symbol Update
// ==========================================
function updateCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = currency;
    });
}

// ==========================================
// Discount Calculation
// ==========================================
function calculateDiscount() {
    const regularPrice = parseFloat(document.getElementById('regularPrice').value) || 0;
    const salePrice = parseFloat(document.getElementById('salePrice').value) || 0;
    
    if (regularPrice > 0 && salePrice > 0 && salePrice < regularPrice) {
        const discount = ((regularPrice - salePrice) / regularPrice * 100).toFixed(0);
        document.getElementById('discountPercentage').textContent = discount + '%';
    } else {
        document.getElementById('discountPercentage').textContent = '0%';
    }
}

// ==========================================
// Custom Offers Management
// ==========================================
function addCustomOffer() {
    const container = document.getElementById('customOffersContainer');
    const offerId = 'offer_' + Date.now();
    
    const offerElement = document.createElement('div');
    offerElement.className = 'custom-offer-item';
    offerElement.innerHTML = `
        <input type="text" class="form-input" placeholder="Ex: Acheter 5 et obtenez le 6ème gratuit" name="custom_offers[]">
        <button type="button" class="btn-remove-offer" onclick="removeCustomOffer(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(offerElement);
}

function removeCustomOffer(button) {
    button.closest('.custom-offer-item').remove();
}

// ==========================================
// Product Condition Handling
// ==========================================
function handleConditionChange(e) {
    const usageGradeGroup = document.getElementById('usageGradeGroup');
    if (e.target.value === 'used') {
        usageGradeGroup.style.display = 'block';
    } else {
        usageGradeGroup.style.display = 'none';
    }
}

// ==========================================
// Variants Management
// ==========================================
let variantCounter = 0;

function addVariant() {
    const container = document.getElementById('variantsContainer');
    const variantId = 'variant_' + variantCounter++;
    
    const variantElement = document.createElement('div');
    variantElement.className = 'variant-item';
    variantElement.setAttribute('data-variant-id', variantId);
    variantElement.innerHTML = `
        <div class="variant-header">
            <h4 class="variant-title">Variante ${variantCounter}</h4>
            <button type="button" class="btn-remove-variant" onclick="removeVariant('${variantId}')">
                <i class="fas fa-trash"></i>
                Supprimer
            </button>
        </div>
        <div class="variant-name-input">
            <label>Nom de la Variante</label>
            <input type="text" class="form-input" name="variants[${variantId}][name]" placeholder="Ex: Couleur, Taille, Matériau...">
        </div>
        <div class="variant-values-container">
            <label>Valeurs (tapez et appuyez sur Entrée)</label>
            <div class="tags-input-container">
                <div class="tags-list" id="variantTags_${variantId}"></div>
                <input type="text" class="tags-input" id="variantInput_${variantId}" placeholder="Ex: Rouge, Bleu, Noir...">
            </div>
            <input type="hidden" name="variants[${variantId}][values]" id="variantValues_${variantId}">
        </div>
    `;
    
    container.appendChild(variantElement);
    
    // Add event listener for variant values input
    document.getElementById(`variantInput_${variantId}`).addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addVariantValue(variantId);
        }
    });
}

function removeVariant(variantId) {
    const variantElement = document.querySelector(`[data-variant-id="${variantId}"]`);
    if (variantElement) {
        variantElement.remove();
    }
}

let variantValuesMap = {};

function addVariantValue(variantId) {
    const input = document.getElementById(`variantInput_${variantId}`);
    const value = input.value.trim();
    
    if (!value) return;
    
    if (!variantValuesMap[variantId]) {
        variantValuesMap[variantId] = [];
    }
    
    if (variantValuesMap[variantId].includes(value)) {
        showToast('Cette valeur existe déjà', 'warning');
        return;
    }
    
    variantValuesMap[variantId].push(value);
    renderVariantValues(variantId);
    input.value = '';
}

function removeVariantValue(variantId, index) {
    variantValuesMap[variantId].splice(index, 1);
    renderVariantValues(variantId);
}

function renderVariantValues(variantId) {
    const tagsList = document.getElementById(`variantTags_${variantId}`);
    const values = variantValuesMap[variantId] || [];
    
    tagsList.innerHTML = '';
    
    values.forEach((value, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            <span>${value}</span>
            <button type="button" class="tag-remove" onclick="removeVariantValue('${variantId}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        tagsList.appendChild(tagElement);
    });
    
    // Update hidden input
    document.getElementById(`variantValues_${variantId}`).value = JSON.stringify(values);
}

// ==========================================
// Image Upload & Management
// ==========================================
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleImageSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    const maxImages = 5;
    
    if (uploadedImages.length + files.length > maxImages) {
        showToast(`Maximum ${maxImages} images autorisées`, 'warning');
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast('Veuillez sélectionner uniquement des images', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImages.push({
                file: file,
                dataUrl: e.target.result,
                isPrimary: uploadedImages.length === 0
            });
            renderImages();
        };
        reader.readAsDataURL(file);
    });
}

function renderImages() {
    const container = document.getElementById('imagesPreview');
    container.innerHTML = '';
    
    uploadedImages.forEach((image, index) => {
        const imageElement = document.createElement('div');
        imageElement.className = 'image-preview-item';
        if (image.isPrimary) {
            imageElement.classList.add('primary');
        }
        imageElement.setAttribute('draggable', 'true');
        imageElement.setAttribute('data-index', index);
        
        imageElement.innerHTML = `
            <img src="${image.dataUrl}" alt="Image ${index + 1}">
            ${image.isPrimary ? '<span class="primary-badge">Principale</span>' : ''}
            <div class="image-preview-overlay">
                ${!image.isPrimary ? `<button type="button" class="btn-set-primary" onclick="setPrimaryImage(${index})">Définir comme principale</button>` : ''}
                <button type="button" class="btn-remove-image" onclick="removeImage(${index})">Supprimer</button>
            </div>
        `;
        
        // Drag events
        imageElement.addEventListener('dragstart', handleImageDragStart);
        imageElement.addEventListener('dragover', handleImageDragOver);
        imageElement.addEventListener('drop', handleImageDrop);
        imageElement.addEventListener('dragend', handleImageDragEnd);
        
        container.appendChild(imageElement);
    });
    
    // Update primary image index
    const primaryIndex = uploadedImages.findIndex(img => img.isPrimary);
    document.getElementById('primaryImageIndex').value = primaryIndex;
}

function setPrimaryImage(index) {
    uploadedImages.forEach((img, i) => {
        img.isPrimary = (i === index);
    });
    renderImages();
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    
    // If removed image was primary, set first image as primary
    if (uploadedImages.length > 0 && !uploadedImages.some(img => img.isPrimary)) {
        uploadedImages[0].isPrimary = true;
    }
    
    renderImages();
}

// Drag and drop for reordering
let draggedImageIndex = null;

function handleImageDragStart(e) {
    draggedImageIndex = parseInt(e.currentTarget.getAttribute('data-index'));
    e.currentTarget.style.opacity = '0.5';
}

function handleImageDragOver(e) {
    e.preventDefault();
}

function handleImageDrop(e) {
    e.preventDefault();
    const dropIndex = parseInt(e.currentTarget.getAttribute('data-index'));
    
    if (draggedImageIndex !== null && draggedImageIndex !== dropIndex) {
        const draggedImage = uploadedImages[draggedImageIndex];
        uploadedImages.splice(draggedImageIndex, 1);
        uploadedImages.splice(dropIndex, 0, draggedImage);
        renderImages();
    }
}

function handleImageDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedImageIndex = null;
}

// ==========================================
// Preview Generation
// ==========================================
function generatePreview() {
    const container = document.getElementById('previewContainer');
    
    // Collect all form data
    const formData = {
        productName: document.getElementById('productName').value,
        sku: document.getElementById('productSKU').value,
        category: getCategoryName(),
        brand: getBrandName(),
        shortDescription: document.getElementById('shortDescription').value,
        detailedDescription: quillEditor.root.innerHTML,
        videoUrl: document.getElementById('videoUrl').value,
        tags: tags,
        currency: document.getElementById('currency').value,
        regularPrice: document.getElementById('regularPrice').value,
        salePrice: document.getElementById('salePrice').value,
        discount: document.getElementById('discountPercentage').textContent,
        stockQuantity: document.getElementById('stockQuantity').value,
        productCondition: getConditionName(),
        usageGrade: getUsageGradeName(),
        variants: collectVariants(),
        offers: collectOffers(),
        images: uploadedImages
    };
    
    // Generate preview HTML
    let previewHTML = `
        <div class="product-preview-card">
            ${generateImageGallery(formData.images)}
            <div class="preview-content">
                <div class="preview-header">
                    <span class="preview-category">${formData.category}</span>
                    <h2 class="preview-title">${formData.productName}</h2>
                    <p class="preview-sku">SKU: ${formData.sku}</p>
                </div>
                
                <div class="preview-pricing">
                    ${formData.salePrice ? `
                        <span class="preview-sale-price">${formData.salePrice} ${formData.currency}</span>
                        <span class="preview-regular-price">${formData.regularPrice} ${formData.currency}</span>
                        <span class="preview-discount-badge">-${formData.discount}</span>
                    ` : `
                        <span class="preview-sale-price">${formData.regularPrice} ${formData.currency}</span>
                    `}
                </div>
                
                <div class="preview-description">
                    <h3>Description</h3>
                    <p class="preview-short-desc">${formData.shortDescription}</p>
                    <div class="preview-detailed-desc">${formData.detailedDescription}</div>
                </div>
                
                <div class="preview-meta">
                    <div class="preview-meta-item">
                        <span class="preview-meta-label">Stock</span>
                        <span class="preview-meta-value">${formData.stockQuantity} pièces</span>
                    </div>
                    <div class="preview-meta-item">
                        <span class="preview-meta-label">État</span>
                        <span class="preview-meta-value">${formData.productCondition}</span>
                    </div>
                    ${formData.brand ? `
                    <div class="preview-meta-item">
                        <span class="preview-meta-label">Marque</span>
                        <span class="preview-meta-value">${formData.brand}</span>
                    </div>
                    ` : ''}
                    ${formData.usageGrade ? `
                    <div class="preview-meta-item">
                        <span class="preview-meta-label">Degré</span>
                        <span class="preview-meta-value">${formData.usageGrade}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${formData.variants.length > 0 ? `
                <div class="preview-meta">
                    <h3>Variantes</h3>
                    ${formData.variants.map(v => `
                        <div class="preview-meta-item">
                            <span class="preview-meta-label">${v.name}</span>
                            <span class="preview-meta-value">${v.values.join(', ')}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${formData.tags.length > 0 ? `
                <div class="preview-tags">
                    ${formData.tags.map(tag => `<span class="preview-tag">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML = previewHTML;
}

function generateImageGallery(images) {
    if (images.length === 0) {
        return '<div class="preview-image-gallery"><p style="text-align: center; padding: 2rem;">Aucune image</p></div>';
    }
    
    const primaryImage = images.find(img => img.isPrimary) || images[0];
    
    return `
        <div class="preview-image-gallery">
            <img src="${primaryImage.dataUrl}" alt="Image principale" class="preview-main-image">
        </div>
        ${images.length > 1 ? `
        <div class="preview-thumbnails">
            ${images.map((img, index) => `
                <img src="${img.dataUrl}" alt="Image ${index + 1}" class="preview-thumbnail ${img.isPrimary ? 'active' : ''}">
            `).join('')}
        </div>
        ` : ''}
    `;
}

function getCategoryName() {
    const select = document.getElementById('categoryId');
    const customCategory = document.getElementById('customCategory').value;
    
    if (select.value === 'other' && customCategory) {
        return customCategory;
    }
    
    return select.options[select.selectedIndex]?.text || '';
}

function getBrandName() {
    const select = document.getElementById('brandId');
    const customBrand = document.getElementById('customBrand').value;
    
    if (select.value === 'other' && customBrand) {
        return customBrand;
    }
    
    return select.options[select.selectedIndex]?.text || '';
}

function getConditionName() {
    const select = document.getElementById('productCondition');
    return select.options[select.selectedIndex]?.text || '';
}

function getUsageGradeName() {
    const select = document.getElementById('usageGrade');
    return select.options[select.selectedIndex]?.text || '';
}

function collectVariants() {
    const variants = [];
    document.querySelectorAll('.variant-item').forEach(item => {
        const variantId = item.getAttribute('data-variant-id');
        const name = item.querySelector(`input[name="variants[${variantId}][name]"]`)?.value;
        const values = variantValuesMap[variantId] || [];
        
        if (name && values.length > 0) {
            variants.push({ name, values });
        }
    });
    return variants;
}

function collectOffers() {
    const offers = [];
    
    // Predefined offers
    document.querySelectorAll('input[name="offers[]"]:checked').forEach(checkbox => {
        offers.push(checkbox.nextElementSibling.textContent);
    });
    
    // Custom offers
    document.querySelectorAll('input[name="custom_offers[]"]').forEach(input => {
        if (input.value.trim()) {
            offers.push(input.value.trim());
        }
    });
    
    return offers;
}

// ==========================================
// Auto-Save Functions
// ==========================================
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        saveToLocalStorage();
    }, 30000); // Every 30 seconds
}

function saveToLocalStorage() {
    const saveIndicator = document.getElementById('saveStatus');
    saveIndicator.parentElement.classList.add('saving');
    saveIndicator.textContent = 'Sauvegarde...';
    
    const formData = collectAllFormData();
    localStorage.setItem('productDraft', JSON.stringify(formData));
    
    setTimeout(() => {
        saveIndicator.parentElement.classList.remove('saving');
        saveIndicator.textContent = 'Sauvegardé';
    }, 500);
}

function loadDraft() {
    const draft = localStorage.getItem('productDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            // Restore form data
            restoreFormData(data);
            showToast('Brouillon chargé', 'info');
        } catch(e) {
            console.error('Error loading draft:', e);
        }
    }
}

function saveDraft() {
    saveToLocalStorage();
    showToast('Brouillon sauvegardé avec succès', 'success');
}

function collectAllFormData() {
    return {
        currentStep: currentStep,
        productName: document.getElementById('productName').value,
        sku: document.getElementById('productSKU').value,
        categoryId: document.getElementById('categoryId').value,
        customCategory: document.getElementById('customCategory').value,
        brandId: document.getElementById('brandId').value,
        customBrand: document.getElementById('customBrand').value,
        shortDescription: document.getElementById('shortDescription').value,
        detailedDescription: quillEditor.root.innerHTML,
        videoUrl: document.getElementById('videoUrl').value,
        tags: tags,
        currency: document.getElementById('currency').value,
        regularPrice: document.getElementById('regularPrice').value,
        salePrice: document.getElementById('salePrice').value,
        stockQuantity: document.getElementById('stockQuantity').value,
        productCondition: document.getElementById('productCondition').value,
        usageGrade: document.getElementById('usageGrade').value,
        variantValuesMap: variantValuesMap,
        uploadedImages: uploadedImages.map(img => ({
            dataUrl: img.dataUrl,
            isPrimary: img.isPrimary
        }))
    };
}

function restoreFormData(data) {
    if (data.productName) document.getElementById('productName').value = data.productName;
    if (data.sku) document.getElementById('productSKU').value = data.sku;
    if (data.categoryId) document.getElementById('categoryId').value = data.categoryId;
    if (data.customCategory) document.getElementById('customCategory').value = data.customCategory;
    if (data.brandId) document.getElementById('brandId').value = data.brandId;
    if (data.customBrand) document.getElementById('customBrand').value = data.customBrand;
    if (data.shortDescription) document.getElementById('shortDescription').value = data.shortDescription;
    if (data.detailedDescription) quillEditor.root.innerHTML = data.detailedDescription;
    if (data.videoUrl) document.getElementById('videoUrl').value = data.videoUrl;
    if (data.tags) {
        tags = data.tags;
        renderTags();
    }
    if (data.currency) document.getElementById('currency').value = data.currency;
    if (data.regularPrice) document.getElementById('regularPrice').value = data.regularPrice;
    if (data.salePrice) document.getElementById('salePrice').value = data.salePrice;
    if (data.stockQuantity) document.getElementById('stockQuantity').value = data.stockQuantity;
    if (data.productCondition) document.getElementById('productCondition').value = data.productCondition;
    if (data.usageGrade) document.getElementById('usageGrade').value = data.usageGrade;
    if (data.variantValuesMap) variantValuesMap = data.variantValuesMap;
    if (data.uploadedImages) {
        uploadedImages = data.uploadedImages;
        renderImages();
    }
    
    // Recalculate
    calculateDiscount();
    updateCharCounter({ target: document.getElementById('shortDescription') });
}

// ==========================================
// Form Submission
// ==========================================
function submitForm(e) {
    e.preventDefault();
    
    // Final validation
    if (!validateAllSteps()) {
        showToast('Veuillez corriger les erreurs', 'error');
        return;
    }
    
    // Collect all data
    const formData = new FormData();
    const allData = collectAllFormData();
    
    // Add all fields to FormData
    for (let key in allData) {
        if (key === 'uploadedImages') {
            allData[key].forEach((img, index) => {
                if (img.file) {
                    formData.append('images[]', img.file);
                }
            });
        } else if (typeof allData[key] === 'object') {
            formData.append(key, JSON.stringify(allData[key]));
        } else {
            formData.append(key, allData[key]);
        }
    }
    
    // In real implementation, send to server
    // For now, just show success and redirect
    
    showToast('Produit enregistré avec succès!', 'success');
    
    // Clear localStorage
    localStorage.removeItem('productDraft');
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'products-list.html'; // Change to your products list page
    }, 2000);
}

function validateAllSteps() {
    for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
            currentStep = i;
            showStep(currentStep);
            updateProgress();
            updateButtons();
            return false;
        }
    }
    return true;
}

// ==========================================
// Cancel Form
// ==========================================
function cancelForm() {
    showConfirmModal(
        'Annuler la Création',
        'Êtes-vous sûr de vouloir annuler? Toutes les modifications seront perdues.',
        () => {
            localStorage.removeItem('productDraft');
            window.location.href = 'products-list.html'; // Change to your products list page
        }
    );
}

// ==========================================
// Before Unload
// ==========================================
function setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        const draft = localStorage.getItem('productDraft');
        if (draft) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = 'toast';
    toast.classList.add(type);
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// Modal Functions
// ==========================================
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirm');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Remove old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new listener
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('show');
}