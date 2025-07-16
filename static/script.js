// --- Constants & Configuration ---
const CUSTOM_FONT_NAME = 'FranklinGothicDemi'; // Verify this matches jsPDFAPI.addFont(...)
const FALLBACK_FONT_NAME = 'Helvetica';
const MAX_TOTAL_STICKERS = 21;
const LABELS_PER_PAGE = 21; // 3 cols * 7 rows

// PDF Dimensions and Layout (mm)
const PAGE_WIDTH_MM = 145;
const PAGE_HEIGHT_MM = 225;
const LABEL_WIDTH_MM = 45.997;
const LABEL_HEIGHT_MM = 29.438;
const INNER_BOX_WIDTH_MM = 13.121;
const INNER_BOX_HEIGHT_MM = 11.1488;
const COLS = 3;
const ROWS = 7;
const GRID_WIDTH_MM = COLS * LABEL_WIDTH_MM;
const GRID_HEIGHT_MM = ROWS * LABEL_HEIGHT_MM;
const MARGIN_X_MM = (PAGE_WIDTH_MM - GRID_WIDTH_MM) / 2;
const MARGIN_Y_MM = (PAGE_HEIGHT_MM - GRID_HEIGHT_MM) / 2;

// Text Positioning & Styling
const TEXT_PADDING_MM = 2.5;
const PRODUCT_NAME_Y_OFFSET_MM = 7.0;
const BATCH_NO_Y_OFFSET_MM = 14.5;
const QTY_LINE_Y_OFFSET_MM = 20.0;
const MFG_DATE_Y_OFFSET_MM = 26.5;
const INNER_BOX_Y_OFFSET_MM = 9.5;
const INNER_BOX_RIGHT_MARGIN_MM = 2.5;
const FONT_SIZE_PRODUCT_NAME = 27;
const FONT_SIZE_WEIGHT_VOL = 14;
const FONT_SIZE_BATCH_LABEL = 14.83;
const FONT_SIZE_BATCH_VALUE = 14.83;
const FONT_SIZE_QTY_LABEL = 18.88;
const FONT_SIZE_QTY_VALUE = 18.88;
const FONT_SIZE_QTY_UNIT = 11.57;
const FONT_SIZE_MFG_LABEL = 18.88;
const FONT_SIZE_MFG_VALUE = 18.88;
const QTY_VALUE_NOS_GAP_MM = 0.5;

// --- DOM Elements ---
const labelForm = document.getElementById('labelForm');
const productNameInput = document.getElementById('productName');
const batchNumberInput = document.getElementById('batchNumber');
const quantityInBoxInput = document.getElementById('quantityInBox');
const mfgDateInput = document.getElementById('mfgDate');
const numberOfStickersInput = document.getElementById('numberOfStickers');
const addToArrayButton = document.getElementById('addToQueueButton'); // Button id remains for HTML, but variable is now addToArrayButton
const generateAllButton = document.getElementById('generateAllButton');
const labelArrayList = document.getElementById('labelQueueList');
const emptyArrayMessage = document.querySelector('.empty-queue-message');
const arrayStatusSpan = document.getElementById('queueStatus');
const currentYearSpan = document.getElementById('currentYear');

// Modal DOM Elements
const modal = document.getElementById('notificationModal');
const modalContentContainer = document.getElementById('modalContentContainer');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCloseButton = document.getElementById('modalCloseButton');

// --- State ---
let labelArray = []; // Array of {id, productName, batchNumber, ..., numberOfStickers}

// --- SVG Icons for Buttons (as strings) ---
const LOADER_ICON_SVG = `<svg class="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
const ADD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
const GENERATE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

// --- Helper Functions ---
function showCustomModal(title, messageContent, isError = false, hideOkButton = false) {
    // Only use modal for confirmation dialogs (when hideOkButton is true)
    if (!hideOkButton) {
        // For all other cases, use toast instead
        let msg = '';
        if (typeof messageContent === 'string') {
            msg = messageContent;
        } else if (Array.isArray(messageContent)) {
            msg = messageContent.join('<br>');
        } else if (messageContent && messageContent.textContent) {
            msg = messageContent.textContent;
        } else {
            msg = String(messageContent);
        }
        showToast(msg);
        return;
    }
    // Always reset OK button visibility at the start
    modalCloseButton.style.display = hideOkButton ? 'none' : '';
    modalTitle.textContent = title;
    if (typeof messageContent === 'string') {
        modalMessage.innerHTML = messageContent;
    } else {
        modalMessage.innerHTML = '';
        if (Array.isArray(messageContent)) {
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5 mt-2 space-y-1';
            messageContent.forEach(msg => {
                const li = document.createElement('li');
                li.textContent = msg;
                ul.appendChild(li);
            });
            modalMessage.appendChild(ul);
        } else {
            modalMessage.appendChild(messageContent);
        }
    }
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('opacity-100');
        modalContentContainer.classList.remove('scale-95', 'opacity-0');
        modalContentContainer.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideCustomModal() {
    modalContentContainer.classList.remove('scale-100', 'opacity-100');
    modalContentContainer.classList.add('scale-95', 'opacity-0');
    modal.classList.remove('opacity-100');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function calculateTotalStickersInArray() {
    return labelArray.reduce((sum, item) => sum + Number(item.numberOfStickers || 0), 0);
}

function updateArrayDisplayAndButtonStates() {
    labelArrayList.innerHTML = ''; // Clear existing items
    const totalStickers = calculateTotalStickersInArray();

    if (labelArray.length === 0) {
        // Always show the empty array message
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-queue-message text-muted-foreground text-center py-10';
        emptyMsg.textContent = 'Array is empty. Add labels using the form.';
        labelArrayList.appendChild(emptyMsg);
        generateAllButton.disabled = true;
    } else {
        if (emptyArrayMessage) emptyArrayMessage.style.display = 'none';
        generateAllButton.disabled = false;
        labelArray.forEach(item => {
            const div = document.createElement('div');
            div.className = `
                bg-white border border-gray-200 shadow-lg rounded-xl mb-6 px-6 py-5
                flex flex-col gap-2
                transition-all
                hover:shadow-xl
            `.replace(/\s+/g, ' ');
            div.innerHTML = `
                <div class="mb-3">
                    <span class="text-lg font-bold text-primary tracking-wide">${item.productName}</span>
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 text-sm">
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Batch</span>
                        <span class="text-foreground font-semibold">${item.batchNumber}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Qty in Box</span>
                        <span class="text-foreground font-semibold">${item.quantityInBox}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Weight/Vol</span>
                        <span class="text-foreground font-semibold">${item.weightVolume}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">MFG Date</span>
                        <span class="text-foreground font-semibold">${item.mfgDate}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Copies</span>
                        <span class="text-foreground font-semibold">${item.numberOfStickers}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button type="button" class="remove-item-btn text-red-600 hover:text-red-700 transition-colors duration-200" data-id="${item.id}" aria-label="Remove label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            labelArrayList.appendChild(div);
        });
    }
    if (arrayStatusSpan) {
        arrayStatusSpan.textContent = `${totalStickers} / ${MAX_TOTAL_STICKERS}`;
    }
    // Defensive: If not found, do nothing (prevents error)

    // Update "Add to Array" button state
    const stickersToAdd = parseInt(numberOfStickersInput.value, 10) || 0;
    if (totalStickers >= MAX_TOTAL_STICKERS) {
        addToArrayButton.disabled = true;
        addToArrayButton.textContent = 'Sticker Array Full';
    } else if (totalStickers + stickersToAdd > MAX_TOTAL_STICKERS && stickersToAdd > 0) {
        addToArrayButton.disabled = true;
        addToArrayButton.textContent = 'Exceeds Limit';
    } else {
        addToArrayButton.disabled = false;
        addToArrayButton.textContent = 'Add to PDF Array';
    }

    if (typeof clearAllArrayButton === 'undefined') {
      var clearAllArrayButton = document.getElementById('clearAllArrayButton');
    }
    if (clearAllArrayButton) {
      clearAllArrayButton.disabled = labelArray.length === 0;
    }
}

function handleAddToArray() {
    const productName = productNameInput.value.trim().toUpperCase();
    const batchNumber = batchNumberInput.value.trim().toUpperCase();
    let quantityInBox = quantityInBoxInput.value.trim();
    // Remove any extra spaces and ensure " NOS" suffix
    quantityInBox = quantityInBox.replace(/\s+NOS$/, '') + ' NOS';
    const weightVolume = getWeightVolume();
    const mfgDate = mfgDateInput.value.trim().toUpperCase();
    const numberOfStickers = parseInt(numberOfStickersInput.value, 10);

    // Check if all required fields are filled and add shake effect to empty ones
    let hasEmptyFields = false;
    
    // Remove existing shake class from all inputs
    document.querySelectorAll('.shake-error').forEach(element => {
        element.classList.remove('shake-error');
    });
    
    // Check each field and add shake effect to empty ones
    if (!productName) {
        productNameInput.classList.add('shake-error');
        hasEmptyFields = true;
    }
    if (!batchNumber) {
        batchNumberInput.classList.add('shake-error');
        hasEmptyFields = true;
    }
    if (!quantityInBox.match(/^\d{1,4} NOS$/)) {
        quantityInBoxInput.classList.add('shake-error');
        hasEmptyFields = true;
    }
    if (!weightVolumeValueInput.value) {
        weightVolumeValueInput.classList.add('shake-error');
        hasEmptyFields = true;
    }
    if (!mfgDate.match(/^\d{2}\/[A-Z]{3}\/\d{4}$/)) {
        mfgDateInput.classList.add('shake-error');
        hasEmptyFields = true;
    }
    if (isNaN(numberOfStickers) || numberOfStickers <= 0) {
        numberOfStickersInput.classList.add('shake-error');
        hasEmptyFields = true;
    }

    if (hasEmptyFields) {
        showToast("Please fill in all the required details before adding to the array.");
        return;
    }
    
    // Remove shake class after animation completes
    setTimeout(() => {
        document.querySelectorAll('.shake-error').forEach(element => {
            element.classList.remove('shake-error');
        });
    }, 400);

    // Validate field lengths after ensuring all fields are filled
    if (productName.length > 17) {
        showToast("Product name can be at most 17 characters");
        return;
    }
    if (batchNumber.length > 5) {
        showToast("Batch number can be at most 5 characters");
        return;
    }

    const totalStickersInArray = calculateTotalStickersInArray();
    if (totalStickersInArray + numberOfStickers > MAX_TOTAL_STICKERS) {
        showCustomModal('Array Limit Reached', `Adding ${numberOfStickers} sticker(s) would exceed the array limit of ${MAX_TOTAL_STICKERS} total stickers. Currently ${totalStickersInArray} stickers in array.`, true);
        return;
    }

    const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        productName, batchNumber, quantityInBox, weightVolume, mfgDate, numberOfStickers
    };
    labelArray.push(newItem);
    updateArrayDisplayAndButtonStates();
    // Do NOT clear the form here
    // numberOfStickersInput.value = ''; // Optionally clear just this if you want
    productNameInput.focus();
    
    // Show success message as a regular toast (no OK button, no persist)
    showToast(`${productName} added to array with ${numberOfStickers} ${pluralize('sticker', numberOfStickers)}.`);
}

function handleRemoveFromArray(itemId) {
    const itemIndex = labelArray.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const removedItem = labelArray.splice(itemIndex, 1)[0];
        updateArrayDisplayAndButtonStates();
        // Show removed message as a regular toast (no OK button, no persist)
        showToast(`"${removedItem.productName}" removed from array.`);
    }
}

// --- Alignment Configuration ---
const alignmentConfig = {
    productName: {
        fontSize: 8,
        horizontalScale: 0.55,
        xPosition: 1.6,
        yPosition: 6.8
    },
    batchNo: {
        fontSize: 6.8,
        horizontalScale: 0.48,
        xPosition: 2.3,
        yPosition: 14
    },
    batchInput: {
        fontSize: 8.1,
        horizontalScale: 0.48,
        xPosition: 38.6,
        yPosition: 14
    },
    qty: {
        fontSize: 6.3,
        horizontalScale: 0.6,
        xPosition: 1.8,
        yPosition: 20.5
    },
    qtyInput: {
        fontSize: 6.8,
        horizontalScale: 0.7,
        xPosition: 22,
        yPosition: 20.5
    },
    mfg: {
        fontSize: 6.3,
        horizontalScale: 0.6,
        xPosition: 1.8,
        yPosition: 27
    },
    mfgInput: {
        fontSize: 6.6,
        horizontalScale: 0.6,
        xPosition: 25,
        yPosition: 27
    },
    volume: {
        fontSize: 6,
        horizontalScale: 0.6,
        xPosition: 62,
        yPosition: 14.5
    },
    arrow1: {
        fontSize: 5,
        horizontalScale: 0.7,
        xPosition: 14,
        yPosition: 20
    },
    arrow2: {
        fontSize: 5,
        horizontalScale: 0.7,
        xPosition: 14,
        yPosition: 26.5
    }
};

// --- Auto-complete for Product Name and Batch Number ---
function setupAutocomplete(inputElem, endpoint) {
    let dropdown;
    let suggestions = [];
    let selectedIdx = -1;

    function closeDropdown() {
        if (dropdown) {
            dropdown.remove();
            dropdown = null;
            suggestions = [];
            selectedIdx = -1;
        }
    }

    function showDropdown(items) {
        closeDropdown();
        if (!items.length) return;
        dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.zIndex = '10000';
        dropdown.style.width = inputElem.offsetWidth + 'px';
        dropdown.style.maxHeight = '180px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.fontSize = '1rem';
        dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        dropdown.style.left = inputElem.getBoundingClientRect().left + window.scrollX + 'px';
        dropdown.style.top = (inputElem.getBoundingClientRect().bottom + window.scrollY) + 'px';
        items.forEach((item, idx) => {
            const option = document.createElement('div');
            option.className = 'autocomplete-option';
            option.textContent = item;
            option.style.padding = '8px 12px';
            option.style.cursor = 'pointer';
            option.onmousedown = (e) => {
                e.preventDefault();
                inputElem.value = item;
                inputElem.dispatchEvent(new Event('input'));
                closeDropdown();
            };
            dropdown.appendChild(option);
        });
        document.body.appendChild(dropdown);
        suggestions = items;
        selectedIdx = -1;
    }

    inputElem.addEventListener('input', async function() {
        const val = this.value.trim();
        if (!val) {
            closeDropdown();
            return;
        }
        const resp = await fetch(`${endpoint}?q=${encodeURIComponent(val)}`);
        if (!resp.ok) return closeDropdown();
        const data = await resp.json();
        if (Array.isArray(data) && data.length) {
            showDropdown(data);
        } else {
            closeDropdown();
        }
    });

    inputElem.addEventListener('focus', function() {
        if (this.value.trim()) {
            inputElem.dispatchEvent(new Event('input'));
        }
    });

    inputElem.addEventListener('blur', function() {
        setTimeout(closeDropdown, 120); // allow click
    });

    inputElem.addEventListener('keydown', function(e) {
        if (!dropdown || !suggestions.length) return;
        if (e.key === 'ArrowDown') {
            selectedIdx = (selectedIdx + 1) % suggestions.length;
            updateHighlight();
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            selectedIdx = (selectedIdx - 1 + suggestions.length) % suggestions.length;
            updateHighlight();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
                inputElem.value = suggestions[selectedIdx];
                inputElem.dispatchEvent(new Event('input'));
                closeDropdown();
                e.preventDefault();
            }
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    function updateHighlight() {
        if (!dropdown) return;
        Array.from(dropdown.children).forEach((child, idx) => {
            child.style.background = idx === selectedIdx ? '#e0f7fa' : '#fff';
        });
    }
}

// Initialize alignment input values
document.addEventListener('DOMContentLoaded', () => {
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    if (labelForm) labelForm.reset(); // Ensure form is clear on load
    if (numberOfStickersInput) numberOfStickersInput.value = ''; // Specifically clear number input
    updateArrayDisplayAndButtonStates(); // Initial state
    if (productNameInput) productNameInput.focus();
    if (productNameInput) setupAutocomplete(productNameInput, '/autocomplete/product-name');
    if (batchNumberInput) setupAutocomplete(batchNumberInput, '/autocomplete/batch-number');

    // Initialize batch alignment inputs
    const batchFontSizeInput = document.getElementById('batchFontSize');
    if (batchFontSizeInput) batchFontSizeInput.value = alignmentConfig.batchNo.fontSize;
    const batchHScaleInput = document.getElementById('batchHScale');
    if (batchHScaleInput) batchHScaleInput.value = alignmentConfig.batchNo.horizontalScale;
    const batchXPosInput = document.getElementById('batchXPos');
    if (batchXPosInput) batchXPosInput.value = alignmentConfig.batchNo.xPosition;
    const batchYPosInput = document.getElementById('batchYPos');
    if (batchYPosInput) batchYPosInput.value = alignmentConfig.batchNo.yPosition;

    // Initialize qty alignment inputs
    const qtyFontSizeInput = document.getElementById('qtyFontSize');
    if (qtyFontSizeInput) qtyFontSizeInput.value = alignmentConfig.qty.fontSize;
    const qtyHScaleInput = document.getElementById('qtyHScale');
    if (qtyHScaleInput) qtyHScaleInput.value = alignmentConfig.qty.horizontalScale;
    const qtyXPosInput = document.getElementById('qtyXPos');
    if (qtyXPosInput) qtyXPosInput.value = alignmentConfig.qty.xPosition;
    const qtyYPosInput = document.getElementById('qtyYPos');
    if (qtyYPosInput) qtyYPosInput.value = alignmentConfig.qty.yPosition;

    // Initialize mfg alignment inputs
    const mfgFontSizeInput = document.getElementById('mfgFontSize');
    if (mfgFontSizeInput) mfgFontSizeInput.value = alignmentConfig.mfg.fontSize;
    const mfgHScaleInput = document.getElementById('mfgHScale');
    if (mfgHScaleInput) mfgHScaleInput.value = alignmentConfig.mfg.horizontalScale;
    const mfgXPosInput = document.getElementById('mfgXPos');
    if (mfgXPosInput) mfgXPosInput.value = alignmentConfig.mfg.xPosition;
    const mfgYPosInput = document.getElementById('mfgYPos');
    if (mfgYPosInput) mfgYPosInput.value = alignmentConfig.mfg.yPosition;

    // Initialize product name alignment inputs
    const productNameFontSizeInput = document.getElementById('productNameFontSize');
    if (productNameFontSizeInput) productNameFontSizeInput.value = alignmentConfig.productName.fontSize;
    const productNameHScaleInput = document.getElementById('productNameHScale');
    if (productNameHScaleInput) productNameHScaleInput.value = alignmentConfig.productName.horizontalScale;
    const productNameXPosInput = document.getElementById('productNameXPos');
    if (productNameXPosInput) productNameXPosInput.value = alignmentConfig.productName.xPosition;
    const productNameYPosInput = document.getElementById('productNameYPos');
    if (productNameYPosInput) productNameYPosInput.value = alignmentConfig.productName.yPosition;

    // Initialize arrow1 alignment inputs
    const arrow1FontSizeInput = document.getElementById('arrow1FontSize');
    if (arrow1FontSizeInput) arrow1FontSizeInput.value = alignmentConfig.arrow1.fontSize;
    const arrow1HScaleInput = document.getElementById('arrow1HScale');
    if (arrow1HScaleInput) arrow1HScaleInput.value = alignmentConfig.arrow1.horizontalScale;
    const arrow1XPosInput = document.getElementById('arrow1XPos');
    if (arrow1XPosInput) arrow1XPosInput.value = alignmentConfig.arrow1.xPosition;
    const arrow1YPosInput = document.getElementById('arrow1YPos');
    if (arrow1YPosInput) arrow1YPosInput.value = alignmentConfig.arrow1.yPosition;

    // Initialize arrow2 alignment inputs
    const arrow2FontSizeInput = document.getElementById('arrow2FontSize');
    if (arrow2FontSizeInput) arrow2FontSizeInput.value = alignmentConfig.arrow2.fontSize;
    const arrow2HScaleInput = document.getElementById('arrow2HScale');
    if (arrow2HScaleInput) arrow2HScaleInput.value = alignmentConfig.arrow2.horizontalScale;
    const arrow2XPosInput = document.getElementById('arrow2XPos');
    if (arrow2XPosInput) arrow2XPosInput.value = alignmentConfig.arrow2.xPosition;
    const arrow2YPosInput = document.getElementById('arrow2YPos');
    if (arrow2YPosInput) arrow2YPosInput.value = alignmentConfig.arrow2.yPosition;

    // Initialize batch input alignment inputs
    const batchInputFontSizeInput = document.getElementById('batchInputFontSize');
    if (batchInputFontSizeInput) batchInputFontSizeInput.value = alignmentConfig.batchInput.fontSize;
    const batchInputHScaleInput = document.getElementById('batchInputHScale');
    if (batchInputHScaleInput) batchInputHScaleInput.value = alignmentConfig.batchInput.horizontalScale;
    const batchInputXPosInput = document.getElementById('batchInputXPos');
    if (batchInputXPosInput) batchInputXPosInput.value = alignmentConfig.batchInput.xPosition;
    const batchInputYPosInput = document.getElementById('batchInputYPos');
    if (batchInputYPosInput) batchInputYPosInput.value = alignmentConfig.batchInput.yPosition;

    // Initialize qty input alignment inputs
    const qtyInputFontSizeInput = document.getElementById('qtyInputFontSize');
    if (qtyInputFontSizeInput) qtyInputFontSizeInput.value = alignmentConfig.qtyInput.fontSize;
    const qtyInputHScaleInput = document.getElementById('qtyInputHScale');
    if (qtyInputHScaleInput) qtyInputHScaleInput.value = alignmentConfig.qtyInput.horizontalScale;
    const qtyInputXPosInput = document.getElementById('qtyInputXPos');
    if (qtyInputXPosInput) qtyInputXPosInput.value = alignmentConfig.qtyInput.xPosition;
    const qtyInputYPosInput = document.getElementById('qtyInputYPos');
    if (qtyInputYPosInput) qtyInputYPosInput.value = alignmentConfig.qtyInput.yPosition;

    // Initialize mfg input alignment inputs
    const mfgInputFontSizeInput = document.getElementById('mfgInputFontSize');
    if (mfgInputFontSizeInput) mfgInputFontSizeInput.value = alignmentConfig.mfgInput.fontSize;
    const mfgInputHScaleInput = document.getElementById('mfgInputHScale');
    if (mfgInputHScaleInput) mfgInputHScaleInput.value = alignmentConfig.mfgInput.horizontalScale;
    const mfgInputXPosInput = document.getElementById('mfgInputXPos');
    if (mfgInputXPosInput) mfgInputXPosInput.value = alignmentConfig.mfgInput.xPosition;
    const mfgInputYPosInput = document.getElementById('mfgInputYPos');
    if (mfgInputYPosInput) mfgInputYPosInput.value = alignmentConfig.mfgInput.yPosition;

    // Initialize volume alignment inputs
    const volumeFontSizeInput = document.getElementById('volumeFontSize');
    if (volumeFontSizeInput) volumeFontSizeInput.value = alignmentConfig.volume.fontSize;
    const volumeHScaleInput = document.getElementById('volumeHScale');
    if (volumeHScaleInput) volumeHScaleInput.value = alignmentConfig.volume.horizontalScale;
    const volumeXPosInput = document.getElementById('volumeXPos');
    if (volumeXPosInput) volumeXPosInput.value = alignmentConfig.volume.xPosition;
    const volumeYPosInput = document.getElementById('volumeYPos');
    if (volumeYPosInput) volumeYPosInput.value = alignmentConfig.volume.yPosition;

    // Remove shake-error class when user starts typing/changing any input
    const formInputs = [
        productNameInput,
        batchNumberInput,
        quantityInBoxInput,
        weightVolumeValueInput,
        weightVolumeUnitInput,
        mfgDateInput,
        numberOfStickersInput
    ];

    formInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('shake-error');
            });
        }
    });
});

// Update alignment configuration
document.getElementById('updateAlignmentButton')?.addEventListener('click', () => {
    // Show confirmation dialog first
    showToast("Are you sure you want to update the alignment configuration?", {
        confirm: true,
        yesText: 'Yes',
        noText: 'Cancel',
        onYes: () => updateAlignmentConfig(),
        onNo: () => {}
    });
});

function updateAlignmentConfig() {
    // Update BATCH NO config
    const batchFontSizeInput = document.getElementById('batchFontSize');
    if (batchFontSizeInput) alignmentConfig.batchNo.fontSize = parseFloat(batchFontSizeInput.value);
    const batchHScaleInput = document.getElementById('batchHScale');
    if (batchHScaleInput) alignmentConfig.batchNo.horizontalScale = parseFloat(batchHScaleInput.value);
    const batchXPosInput = document.getElementById('batchXPos');
    if (batchXPosInput) alignmentConfig.batchNo.xPosition = parseFloat(batchXPosInput.value);
    const batchYPosInput = document.getElementById('batchYPos');
    if (batchYPosInput) alignmentConfig.batchNo.yPosition = parseFloat(batchYPosInput.value);
    
    // Update QTY config
    const qtyFontSizeInput = document.getElementById('qtyFontSize');
    if (qtyFontSizeInput) alignmentConfig.qty.fontSize = parseFloat(qtyFontSizeInput.value);
    const qtyHScaleInput = document.getElementById('qtyHScale');
    if (qtyHScaleInput) alignmentConfig.qty.horizontalScale = parseFloat(qtyHScaleInput.value);
    const qtyXPosInput = document.getElementById('qtyXPos');
    if (qtyXPosInput) alignmentConfig.qty.xPosition = parseFloat(qtyXPosInput.value);
    const qtyYPosInput = document.getElementById('qtyYPos');
    if (qtyYPosInput) alignmentConfig.qty.yPosition = parseFloat(qtyYPosInput.value);
    
    // Update MFG config
    const mfgFontSizeInput = document.getElementById('mfgFontSize');
    if (mfgFontSizeInput) alignmentConfig.mfg.fontSize = parseFloat(mfgFontSizeInput.value);
    const mfgHScaleInput = document.getElementById('mfgHScale');
    if (mfgHScaleInput) alignmentConfig.mfg.horizontalScale = parseFloat(mfgHScaleInput.value);
    const mfgXPosInput = document.getElementById('mfgXPos');
    if (mfgXPosInput) alignmentConfig.mfg.xPosition = parseFloat(mfgXPosInput.value);
    const mfgYPosInput = document.getElementById('mfgYPos');
    if (mfgYPosInput) alignmentConfig.mfg.yPosition = parseFloat(mfgYPosInput.value);
    
    // Update PRODUCT NAME config
    const productNameFontSizeInput = document.getElementById('productNameFontSize');
    if (productNameFontSizeInput) alignmentConfig.productName.fontSize = parseFloat(productNameFontSizeInput.value);
    const productNameHScaleInput = document.getElementById('productNameHScale');
    if (productNameHScaleInput) alignmentConfig.productName.horizontalScale = parseFloat(productNameHScaleInput.value);
    const productNameXPosInput = document.getElementById('productNameXPos');
    if (productNameXPosInput) alignmentConfig.productName.xPosition = parseFloat(productNameXPosInput.value);
    const productNameYPosInput = document.getElementById('productNameYPos');
    if (productNameYPosInput) alignmentConfig.productName.yPosition = parseFloat(productNameYPosInput.value);
    
    // Update Arrow 1 config
    const arrow1FontSizeInput = document.getElementById('arrow1FontSize');
    if (arrow1FontSizeInput) alignmentConfig.arrow1.fontSize = parseFloat(arrow1FontSizeInput.value);
    const arrow1HScaleInput = document.getElementById('arrow1HScale');
    if (arrow1HScaleInput) alignmentConfig.arrow1.horizontalScale = parseFloat(arrow1HScaleInput.value);
    const arrow1XPosInput = document.getElementById('arrow1XPos');
    if (arrow1XPosInput) alignmentConfig.arrow1.xPosition = parseFloat(arrow1XPosInput.value);
    const arrow1YPosInput = document.getElementById('arrow1YPos');
    if (arrow1YPosInput) alignmentConfig.arrow1.yPosition = parseFloat(arrow1YPosInput.value);

    // Update Arrow 2 config
    const arrow2FontSizeInput = document.getElementById('arrow2FontSize');
    if (arrow2FontSizeInput) alignmentConfig.arrow2.fontSize = parseFloat(arrow2FontSizeInput.value);
    const arrow2HScaleInput = document.getElementById('arrow2HScale');
    if (arrow2HScaleInput) alignmentConfig.arrow2.horizontalScale = parseFloat(arrow2HScaleInput.value);
    const arrow2XPosInput = document.getElementById('arrow2XPos');
    if (arrow2XPosInput) alignmentConfig.arrow2.xPosition = parseFloat(arrow2XPosInput.value);
    const arrow2YPosInput = document.getElementById('arrow2YPos');
    if (arrow2YPosInput) alignmentConfig.arrow2.yPosition = parseFloat(arrow2YPosInput.value);
    
    // Update Batch Number input config
    const batchInputFontSizeInput = document.getElementById('batchInputFontSize');
    if (batchInputFontSizeInput) alignmentConfig.batchInput.fontSize = parseFloat(batchInputFontSizeInput.value);
    const batchInputHScaleInput = document.getElementById('batchInputHScale');
    if (batchInputHScaleInput) alignmentConfig.batchInput.horizontalScale = parseFloat(batchInputHScaleInput.value);
    const batchInputXPosInput = document.getElementById('batchInputXPos');
    if (batchInputXPosInput) alignmentConfig.batchInput.xPosition = parseFloat(batchInputXPosInput.value);
    const batchInputYPosInput = document.getElementById('batchInputYPos');
    if (batchInputYPosInput) alignmentConfig.batchInput.yPosition = parseFloat(batchInputYPosInput.value);
    
    // Update QTY input config
    const qtyInputFontSizeInput = document.getElementById('qtyInputFontSize');
    if (qtyInputFontSizeInput) alignmentConfig.qtyInput.fontSize = parseFloat(qtyInputFontSizeInput.value);
    const qtyInputHScaleInput = document.getElementById('qtyInputHScale');
    if (qtyInputHScaleInput) alignmentConfig.qtyInput.horizontalScale = parseFloat(qtyInputHScaleInput.value);
    const qtyInputXPosInput = document.getElementById('qtyInputXPos');
    if (qtyInputXPosInput) alignmentConfig.qtyInput.xPosition = parseFloat(qtyInputXPosInput.value);
    const qtyInputYPosInput = document.getElementById('qtyInputYPos');
    if (qtyInputYPosInput) alignmentConfig.qtyInput.yPosition = parseFloat(qtyInputYPosInput.value);
    
    // Update MFG input config
    const mfgInputFontSizeInput = document.getElementById('mfgInputFontSize');
    if (mfgInputFontSizeInput) alignmentConfig.mfgInput.fontSize = parseFloat(mfgInputFontSizeInput.value);
    const mfgInputHScaleInput = document.getElementById('mfgInputHScale');
    if (mfgInputHScaleInput) alignmentConfig.mfgInput.horizontalScale = parseFloat(mfgInputHScaleInput.value);
    const mfgInputXPosInput = document.getElementById('mfgInputXPos');
    if (mfgInputXPosInput) alignmentConfig.mfgInput.xPosition = parseFloat(mfgInputXPosInput.value);
    const mfgInputYPosInput = document.getElementById('mfgInputYPos');
    if (mfgInputYPosInput) alignmentConfig.mfgInput.yPosition = parseFloat(mfgInputYPosInput.value);
    
    // Update VOLUME config
    const volumeFontSizeInput = document.getElementById('volumeFontSize');
    if (volumeFontSizeInput) alignmentConfig.volume.fontSize = parseFloat(volumeFontSizeInput.value);
    const volumeHScaleInput = document.getElementById('volumeHScale');
    if (volumeHScaleInput) alignmentConfig.volume.horizontalScale = parseFloat(volumeHScaleInput.value);
    const volumeXPosInput = document.getElementById('volumeXPos');
    if (volumeXPosInput) alignmentConfig.volume.xPosition = parseFloat(volumeXPosInput.value);
    const volumeYPosInput = document.getElementById('volumeYPos');
    if (volumeYPosInput) alignmentConfig.volume.yPosition = parseFloat(volumeYPosInput.value);
    
    showToast("Alignment configuration updated successfully");
}


async function generateCombinedPDF() {
    if (labelArray.length === 0) {
        showCustomModal('Empty Array', 'Add labels to the array before generating PDF.', true);
        return;
    }

    generateAllButton.disabled = true;
    // Show loading state: hide .play, show .now with spinner or text
    const playSpan = generateAllButton.querySelector('.play');
    const nowSpan = generateAllButton.querySelector('.now');
    if (playSpan && nowSpan) {
        playSpan.textContent = 'Generating...';
        nowSpan.textContent = '';
    }

    try {
        const response = await fetch('/generate-labels-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                labels: labelArray,
                alignment: alignmentConfig
            })
        });
        if (!response.ok) throw new Error('PDF generation failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // --- Build custom filename ---
        // 1. Get unique product names
        const uniqueNames = [...new Set(labelArray.map(l => l.productName.trim().replace(/[^a-zA-Z0-9_-]/g, '')))].filter(Boolean);
        // 2. Limit to first 5, add +N if more
        let namePart = uniqueNames.slice(0, 5).join('_');
        if (uniqueNames.length > 5) namePart += `_+${uniqueNames.length - 5}`;
        // 3. Date in DD-MM-YYYY
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const datePart = `${dd}-${mm}-${yyyy}`;
        // 4. Final filename
        a.download = `${namePart}_${datePart}_Label.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showCustomModal('Success', 'PDF generated with all labels.');
    } catch (error) {
        console.error("Error generating PDF:", error);
        showCustomModal('PDF Generation Error', `An error occurred: ${error.message}. Check console.`, true);
    } finally {
        generateAllButton.disabled = labelArray.length === 0;
        // Restore button text
        const playSpan = generateAllButton.querySelector('.play');
        const nowSpan = generateAllButton.querySelector('.now');
        if (playSpan && nowSpan) {
            playSpan.textContent = 'Generate All Labels';
            nowSpan.textContent = '?';
        }
    }
}

// --- Toast Notification ---
function showToast(message, options = {}) {
    // Remove any existing toast
    let existing = document.getElementById('customToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'customToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '32px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#222';
    toast.style.color = '#fff';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '1rem';
    toast.style.zIndex = '100000'; // ensure above all
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.pointerEvents = 'auto'; // allow interaction with toast

    if (options.confirm) {
        // Confirmation dialog with Yes/No buttons
        toast.innerHTML = `<span style='margin-right:8px;'>${message}</span>`;
        const yesBtn = document.createElement('button');
        yesBtn.textContent = options.yesText || 'Yes';
        yesBtn.style.background = '#00b1b8';
        yesBtn.style.color = '#fff';
        yesBtn.style.border = 'none';
        yesBtn.style.borderRadius = '4px';
        yesBtn.style.padding = '4px 14px';
        yesBtn.style.marginRight = '4px';
        yesBtn.style.cursor = 'pointer';
        yesBtn.onclick = () => {
            if (options.onYes) options.onYes();
            toast.remove();
        };
        const noBtn = document.createElement('button');
        noBtn.textContent = options.noText || 'No';
        noBtn.style.background = '#eee';
        noBtn.style.color = '#222';
        noBtn.style.border = 'none';
        noBtn.style.borderRadius = '4px';
        noBtn.style.padding = '4px 14px';
        noBtn.style.cursor = 'pointer';
        noBtn.onclick = () => {
            if (options.onNo) options.onNo();
            toast.remove();
        };
        toast.appendChild(yesBtn);
        toast.appendChild(noBtn);
    } else if (options.okButton || options.persist) {
        // Message with OK button
        toast.innerHTML = `<span style='margin-right:8px;'>${message}</span>`;
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.background = '#00b1b8';
        okBtn.style.color = '#fff';
        okBtn.style.border = 'none';
        okBtn.style.borderRadius = '4px';
        okBtn.style.padding = '4px 14px';
        okBtn.style.cursor = 'pointer';
        okBtn.onclick = () => toast.remove();
        toast.appendChild(okBtn);
    } else {
        // Regular auto-dismissing toast
        toast.innerHTML = `<span>${message}</span>`;
    }

    // Always append toast directly to body for reliability
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; }, 10);

    // Auto-dismiss if not a confirmation or persistent message
    if (!options.confirm && !options.persist && !options.okButton) {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.remove(); }, 200);
        }, 2000);
    }
}

// Replace all confirmation modals with toast-based confirmations
function confirmGeneratePDF() {
    const total = calculateTotalStickersInArray();
    showToast(
        `Generate PDF for all <strong>${total}</strong> ${pluralize('sticker', total)}?`,
        {
            confirm: true,
            yesText: 'Yes',
            noText: 'No',
            onYes: () => generateCombinedPDF(),
            onNo: () => {} // do nothing
        }
    );
}

// Clear form confirmation as toast
if (labelForm) {
    const clearBtn = document.getElementById('clearFormButton');
    if (clearBtn) {
        clearBtn.onclick = () => {
            // Only check text inputs, ignore selects (dropdowns)
            const inputs = labelForm.querySelectorAll('input[type="text"], input[type="number"], input[type="password"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"]');
            let hasValue = false;
            for (const input of inputs) {
                if (typeof input.value === 'string' && input.value.trim().length > 0) {
                    hasValue = true;
                    break;
                }
            }
            if (!hasValue) {
                setTimeout(() => showToast('There is nothing to clear in the form.'), 0);
                return;
            }
            showToast(
                'Clear all fields in <strong>Enter Label Details</strong>?',
                {
                    confirm: true,
                    yesText: 'Yes',
                    noText: 'No',
                    onYes: () => labelForm.reset(),
                    onNo: () => {}
                }
            );
        };
    }
}

// --- Confirmation for Generate All Labels PDF ---
// function confirmGeneratePDF() {
//     const total = calculateTotalStickersInArray();
//     showCustomModal(
//         'Generate PDF',
//         `<div>Are you sure you want to generate the PDF for all <strong>${total}</strong> ${pluralize('sticker', total)}?</div>
//          <div class="flex gap-3 mt-4">
//             <button id="confirmGeneratePDFBtn" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Yes, Generate</button>
//             <button id="cancelGeneratePDFBtn" class="bg-muted text-foreground px-4 py-2 rounded hover:bg-muted/80">Cancel</button>
//          </div>`,
//         false,
//         true // hide OK button
//     );
//     setTimeout(() => {
//         const confirmBtn = document.getElementById('confirmGeneratePDFBtn');
//         const cancelBtn = document.getElementById('cancelGeneratePDFBtn');
//         if (confirmBtn) confirmBtn.onclick = () => {
//             hideCustomModal();
//             setTimeout(() => generateCombinedPDF(), 200); // slight delay for modal animation
//         };
//         if (cancelBtn) cancelBtn.onclick = () => hideCustomModal();
//     }, 50);
// }

// --- Event Listeners ---
if (addToArrayButton) addToArrayButton.addEventListener('click', handleAddToArray);
if (generateAllButton) generateAllButton.addEventListener('click', function() {
    if (labelArray.length === 0) {
      showToast('Sticker array is empty. Add labels before generating.');
      return;
    }
    confirmGeneratePDF();
});
if (modalCloseButton) modalCloseButton.addEventListener('click', hideCustomModal);

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) hideCustomModal();
    });
}

if (labelArrayList) {
    labelArrayList.addEventListener('click', (event) => {
        const removeButton = event.target.closest('.remove-item-btn');
        if (removeButton) {
            handleRemoveFromArray(removeButton.dataset.id);
        }
    });
}

if (numberOfStickersInput) {
    numberOfStickersInput.addEventListener('input', updateArrayDisplayAndButtonStates);
}

// --- Custom Input Restrictions & Formatting ---

// Product Name: Limit to 17 characters (handled by maxlength in HTML)
// Batch Number: Limit to 5 characters (handled by maxlength in HTML)

// Quantity in Box: Only 4 digits, always ends with " NOS" (append on blur, not during typing)
if (quantityInBoxInput) {
    quantityInBoxInput.addEventListener('input', function (e) {
        // Remove all non-digits and limit to 4
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        this.value = val;
    });
    quantityInBoxInput.addEventListener('blur', function () {
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        if (val) {
            this.value = val + ' NOS';
        } else {
            this.value = '';
        }
    });
    quantityInBoxInput.addEventListener('focus', function () {
        // Remove NOS suffix for editing
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        this.value = val;
    });
}

// Weight/Volume: Only 3 digits + dropdown for unit
const weightVolumeValueInput = document.getElementById('weightVolumeValue');
const weightVolumeUnitInput = document.getElementById('weightVolumeUnit');

function getWeightVolume() {
    if (!weightVolumeValueInput || !weightVolumeUnitInput) return '';
    if (!weightVolumeValueInput.value) return '';
    // Always use lowercase for the unit
    return weightVolumeValueInput.value + ' ' + weightVolumeUnitInput.value.toLowerCase();
}

// Manufacture Date: Format on blur only
const MONTHS = [
    '', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];
if (mfgDateInput) {
    mfgDateInput.addEventListener('blur', function () {
        let val = this.value.trim();
        // Accept formats like 1/5/2025, 01.05.25, 1-5-25, 01_05_2025, etc.
        let match = val.match(/^(\d{1,2})[\/\.\-_](\d{1,2})[\/\.\-_](\d{2,4})$/);
        if (match) {
            let day = match[1].padStart(2, '0');
            let monthNum = parseInt(match[2], 10);
            let year = match[3];
            if (year.length === 2) year = '20' + year;
            let monthStr = (monthNum >= 1 && monthNum <= 12) ? MONTHS[monthNum] : '';
            if (monthStr) {
                this.value = `${day}/${monthStr}/${year}`;
            }
        }
    });
}

// Force all relevant text inputs to uppercase as the user types
function forceUppercaseInput(input) {
  if (!input) return;
  input.addEventListener('input', function() {
    // For quantityInBox, allow only digits and ' NOS' suffix
    if (input === quantityInBoxInput) {
      let val = this.value.replace(/[^0-9]/g, '').slice(0, 4);
      if (val) {
        this.value = val + ' NOS';
      } else {
        this.value = '';
      }
    } else {
      this.value = this.value.toUpperCase();
    }
  });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    if (labelForm) labelForm.reset(); // Ensure form is clear on load
    if (numberOfStickersInput) numberOfStickersInput.value = ''; // Specifically clear number input
    updateArrayDisplayAndButtonStates(); // Initial state
    if (productNameInput) productNameInput.focus();

    // Initialize batch alignment inputs
    const batchFontSizeInput = document.getElementById('batchFontSize');
    if (batchFontSizeInput) batchFontSizeInput.value = alignmentConfig.batchNo.fontSize;
    const batchHScaleInput = document.getElementById('batchHScale');
    if (batchHScaleInput) batchHScaleInput.value = alignmentConfig.batchNo.horizontalScale;
    const batchXPosInput = document.getElementById('batchXPos');
    if (batchXPosInput) batchXPosInput.value = alignmentConfig.batchNo.xPosition;
    const batchYPosInput = document.getElementById('batchYPos');
    if (batchYPosInput) batchYPosInput.value = alignmentConfig.batchNo.yPosition;

    // Initialize qty alignment inputs
    const qtyFontSizeInput = document.getElementById('qtyFontSize');
    if (qtyFontSizeInput) qtyFontSizeInput.value = alignmentConfig.qty.fontSize;
    const qtyHScaleInput = document.getElementById('qtyHScale');
    if (qtyHScaleInput) qtyHScaleInput.value = alignmentConfig.qty.horizontalScale;
    const qtyXPosInput = document.getElementById('qtyXPos');
    if (qtyXPosInput) qtyXPosInput.value = alignmentConfig.qty.xPosition;
    const qtyYPosInput = document.getElementById('qtyYPos');
    if (qtyYPosInput) qtyYPosInput.value = alignmentConfig.qty.yPosition;

    // Initialize mfg alignment inputs
    const mfgFontSizeInput = document.getElementById('mfgFontSize');
    if (mfgFontSizeInput) mfgFontSizeInput.value = alignmentConfig.mfg.fontSize;
    const mfgHScaleInput = document.getElementById('mfgHScale');
    if (mfgHScaleInput) mfgHScaleInput.value = alignmentConfig.mfg.horizontalScale;
    const mfgXPosInput = document.getElementById('mfgXPos');
    if (mfgXPosInput) mfgXPosInput.value = alignmentConfig.mfg.xPosition;
    const mfgYPosInput = document.getElementById('mfgYPos');
    if (mfgYPosInput) mfgYPosInput.value = alignmentConfig.mfg.yPosition;

    // Initialize product name alignment inputs
    const productNameFontSizeInput = document.getElementById('productNameFontSize');
    if (productNameFontSizeInput) productNameFontSizeInput.value = alignmentConfig.productName.fontSize;
    const productNameHScaleInput = document.getElementById('productNameHScale');
    if (productNameHScaleInput) productNameHScaleInput.value = alignmentConfig.productName.horizontalScale;
    const productNameXPosInput = document.getElementById('productNameXPos');
    if (productNameXPosInput) productNameXPosInput.value = alignmentConfig.productName.xPosition;
    const productNameYPosInput = document.getElementById('productNameYPos');
    if (productNameYPosInput) productNameYPosInput.value = alignmentConfig.productName.yPosition;

    // Initialize arrow1 alignment inputs
    const arrow1FontSizeInput = document.getElementById('arrow1FontSize');
    if (arrow1FontSizeInput) arrow1FontSizeInput.value = alignmentConfig.arrow1.fontSize;
    const arrow1HScaleInput = document.getElementById('arrow1HScale');
    if (arrow1HScaleInput) arrow1HScaleInput.value = alignmentConfig.arrow1.horizontalScale;
    const arrow1XPosInput = document.getElementById('arrow1XPos');
    if (arrow1XPosInput) arrow1XPosInput.value = alignmentConfig.arrow1.xPosition;
    const arrow1YPosInput = document.getElementById('arrow1YPos');
    if (arrow1YPosInput) arrow1YPosInput.value = alignmentConfig.arrow1.yPosition;

    // Initialize arrow2 alignment inputs
    const arrow2FontSizeInput = document.getElementById('arrow2FontSize');
    if (arrow2FontSizeInput) arrow2FontSizeInput.value = alignmentConfig.arrow2.fontSize;
    const arrow2HScaleInput = document.getElementById('arrow2HScale');
    if (arrow2HScaleInput) arrow2HScaleInput.value = alignmentConfig.arrow2.horizontalScale;
    const arrow2XPosInput = document.getElementById('arrow2XPos');
    if (arrow2XPosInput) arrow2XPosInput.value = alignmentConfig.arrow2.xPosition;
    const arrow2YPosInput = document.getElementById('arrow2YPos');
    if (arrow2YPosInput) arrow2YPosInput.value = alignmentConfig.arrow2.yPosition;

    // Initialize batch input alignment inputs
    const batchInputFontSizeInput = document.getElementById('batchInputFontSize');
    if (batchInputFontSizeInput) batchInputFontSizeInput.value = alignmentConfig.batchInput.fontSize;
    const batchInputHScaleInput = document.getElementById('batchInputHScale');
    if (batchInputHScaleInput) batchInputHScaleInput.value = alignmentConfig.batchInput.horizontalScale;
    const batchInputXPosInput = document.getElementById('batchInputXPos');
    if (batchInputXPosInput) batchInputXPosInput.value = alignmentConfig.batchInput.xPosition;
    const batchInputYPosInput = document.getElementById('batchInputYPos');
    if (batchInputYPosInput) batchInputYPosInput.value = alignmentConfig.batchInput.yPosition;

    // Initialize qty input alignment inputs
    const qtyInputFontSizeInput = document.getElementById('qtyInputFontSize');
    if (qtyInputFontSizeInput) qtyInputFontSizeInput.value = alignmentConfig.qtyInput.fontSize;
    const qtyInputHScaleInput = document.getElementById('qtyInputHScale');
    if (qtyInputHScaleInput) qtyInputHScaleInput.value = alignmentConfig.qtyInput.horizontalScale;
    const qtyInputXPosInput = document.getElementById('qtyInputXPos');
    if (qtyInputXPosInput) qtyInputXPosInput.value = alignmentConfig.qtyInput.xPosition;
    const qtyInputYPosInput = document.getElementById('qtyInputYPos');
    if (qtyInputYPosInput) qtyInputYPosInput.value = alignmentConfig.qtyInput.yPosition;

    // Initialize mfg input alignment inputs
    const mfgInputFontSizeInput = document.getElementById('mfgInputFontSize');
    if (mfgInputFontSizeInput) mfgInputFontSizeInput.value = alignmentConfig.mfgInput.fontSize;
    const mfgInputHScaleInput = document.getElementById('mfgInputHScale');
    if (mfgInputHScaleInput) mfgInputHScaleInput.value = alignmentConfig.mfgInput.horizontalScale;
    const mfgInputXPosInput = document.getElementById('mfgInputXPos');
    if (mfgInputXPosInput) mfgInputXPosInput.value = alignmentConfig.mfgInput.xPosition;
    const mfgInputYPosInput = document.getElementById('mfgInputYPos');
    if (mfgInputYPosInput) mfgInputYPosInput.value = alignmentConfig.mfgInput.yPosition;

    // Initialize volume alignment inputs
    const volumeFontSizeInput = document.getElementById('volumeFontSize');
    if (volumeFontSizeInput) volumeFontSizeInput.value = alignmentConfig.volume.fontSize;
    const volumeHScaleInput = document.getElementById('volumeHScale');
    if (volumeHScaleInput) volumeHScaleInput.value = alignmentConfig.volume.horizontalScale;
    const volumeXPosInput = document.getElementById('volumeXPos');
    if (volumeXPosInput) volumeXPosInput.value = alignmentConfig.volume.xPosition;
    const volumeYPosInput = document.getElementById('volumeYPos');
    if (volumeYPosInput) volumeYPosInput.value = alignmentConfig.volume.yPosition;

    // Remove shake-error class when user starts typing/changing any input
    const formInputs = [
        productNameInput,
        batchNumberInput,
        quantityInBoxInput,
        weightVolumeValueInput,
        weightVolumeUnitInput,
        mfgDateInput,
        numberOfStickersInput
    ];

    formInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('shake-error');
            });
        }
    });

    // Force all relevant text inputs to uppercase as the user types
    forceUppercaseInput(productNameInput);
    forceUppercaseInput(batchNumberInput);
    forceUppercaseInput(quantityInBoxInput);
    forceUppercaseInput(mfgDateInput);
    forceUppercaseInput(weightVolumeValueInput);
});

// Add event listener for clearAllArrayButton after DOMContentLoaded
if (typeof clearAllArrayButton === 'undefined') {
  var clearAllArrayButton = document.getElementById('clearAllArrayButton');
}
if (clearAllArrayButton) {
  clearAllArrayButton.addEventListener('click', function() {
    if (labelArray.length === 0) {
      showToast('Sticker array is already empty.');
      return;
    }
    showToast('Clear all stickers from the array?', {
      confirm: true,
      yesText: 'Yes',
      noText: 'No',
      onYes: () => {
        labelArray = [];
        updateArrayDisplayAndButtonStates();
        showToast('Sticker array cleared.');
      },
      onNo: () => {}
    });
  });
}

// Update alignment configuration
document.getElementById('updateAlignmentButton')?.addEventListener('click', () => {
    // Show confirmation dialog first
    showToast("Are you sure you want to update the alignment configuration?", {
        confirm: true,
        yesText: 'Yes',
        noText: 'Cancel',
        onYes: () => updateAlignmentConfig(),
        onNo: () => {}
    });
});

function updateAlignmentConfig() {
    // Update BATCH NO config
    const batchFontSizeInput = document.getElementById('batchFontSize');
    if (batchFontSizeInput) alignmentConfig.batchNo.fontSize = parseFloat(batchFontSizeInput.value);
    const batchHScaleInput = document.getElementById('batchHScale');
    if (batchHScaleInput) alignmentConfig.batchNo.horizontalScale = parseFloat(batchHScaleInput.value);
    const batchXPosInput = document.getElementById('batchXPos');
    if (batchXPosInput) alignmentConfig.batchNo.xPosition = parseFloat(batchXPosInput.value);
    const batchYPosInput = document.getElementById('batchYPos');
    if (batchYPosInput) alignmentConfig.batchNo.yPosition = parseFloat(batchYPosInput.value);
    
    // Update QTY config
    const qtyFontSizeInput = document.getElementById('qtyFontSize');
    if (qtyFontSizeInput) alignmentConfig.qty.fontSize = parseFloat(qtyFontSizeInput.value);
    const qtyHScaleInput = document.getElementById('qtyHScale');
    if (qtyHScaleInput) alignmentConfig.qty.horizontalScale = parseFloat(qtyHScaleInput.value);
    const qtyXPosInput = document.getElementById('qtyXPos');
    if (qtyXPosInput) alignmentConfig.qty.xPosition = parseFloat(qtyXPosInput.value);
    const qtyYPosInput = document.getElementById('qtyYPos');
    if (qtyYPosInput) alignmentConfig.qty.yPosition = parseFloat(qtyYPosInput.value);
    
    // Update MFG config
    const mfgFontSizeInput = document.getElementById('mfgFontSize');
    if (mfgFontSizeInput) alignmentConfig.mfg.fontSize = parseFloat(mfgFontSizeInput.value);
    const mfgHScaleInput = document.getElementById('mfgHScale');
    if (mfgHScaleInput) alignmentConfig.mfg.horizontalScale = parseFloat(mfgHScaleInput.value);
    const mfgXPosInput = document.getElementById('mfgXPos');
    if (mfgXPosInput) alignmentConfig.mfg.xPosition = parseFloat(mfgXPosInput.value);
    const mfgYPosInput = document.getElementById('mfgYPos');
    if (mfgYPosInput) alignmentConfig.mfg.yPosition = parseFloat(mfgYPosInput.value);
    
    // Update PRODUCT NAME config
    const productNameFontSizeInput = document.getElementById('productNameFontSize');
    if (productNameFontSizeInput) alignmentConfig.productName.fontSize = parseFloat(productNameFontSizeInput.value);
    const productNameHScaleInput = document.getElementById('productNameHScale');
    if (productNameHScaleInput) alignmentConfig.productName.horizontalScale = parseFloat(productNameHScaleInput.value);
    const productNameXPosInput = document.getElementById('productNameXPos');
    if (productNameXPosInput) alignmentConfig.productName.xPosition = parseFloat(productNameXPosInput.value);
    const productNameYPosInput = document.getElementById('productNameYPos');
    if (productNameYPosInput) alignmentConfig.productName.yPosition = parseFloat(productNameYPosInput.value);
    
    // Update Arrow 1 config
    const arrow1FontSizeInput = document.getElementById('arrow1FontSize');
    if (arrow1FontSizeInput) alignmentConfig.arrow1.fontSize = parseFloat(arrow1FontSizeInput.value);
    const arrow1HScaleInput = document.getElementById('arrow1HScale');
    if (arrow1HScaleInput) alignmentConfig.arrow1.horizontalScale = parseFloat(arrow1HScaleInput.value);
    const arrow1XPosInput = document.getElementById('arrow1XPos');
    if (arrow1XPosInput) alignmentConfig.arrow1.xPosition = parseFloat(arrow1XPosInput.value);
    const arrow1YPosInput = document.getElementById('arrow1YPos');
    if (arrow1YPosInput) alignmentConfig.arrow1.yPosition = parseFloat(arrow1YPosInput.value);

    // Update Arrow 2 config
    const arrow2FontSizeInput = document.getElementById('arrow2FontSize');
    if (arrow2FontSizeInput) alignmentConfig.arrow2.fontSize = parseFloat(arrow2FontSizeInput.value);
    const arrow2HScaleInput = document.getElementById('arrow2HScale');
    if (arrow2HScaleInput) alignmentConfig.arrow2.horizontalScale = parseFloat(arrow2HScaleInput.value);
    const arrow2XPosInput = document.getElementById('arrow2XPos');
    if (arrow2XPosInput) alignmentConfig.arrow2.xPosition = parseFloat(arrow2XPosInput.value);
    const arrow2YPosInput = document.getElementById('arrow2YPos');
    if (arrow2YPosInput) alignmentConfig.arrow2.yPosition = parseFloat(arrow2YPosInput.value);
    
    // Update Batch Number input config
    const batchInputFontSizeInput = document.getElementById('batchInputFontSize');
    if (batchInputFontSizeInput) alignmentConfig.batchInput.fontSize = parseFloat(batchInputFontSizeInput.value);
    const batchInputHScaleInput = document.getElementById('batchInputHScale');
    if (batchInputHScaleInput) alignmentConfig.batchInput.horizontalScale = parseFloat(batchInputHScaleInput.value);
    const batchInputXPosInput = document.getElementById('batchInputXPos');
    if (batchInputXPosInput) alignmentConfig.batchInput.xPosition = parseFloat(batchInputXPosInput.value);
    const batchInputYPosInput = document.getElementById('batchInputYPos');
    if (batchInputYPosInput) alignmentConfig.batchInput.yPosition = parseFloat(batchInputYPosInput.value);
    
    // Update QTY input config
    const qtyInputFontSizeInput = document.getElementById('qtyInputFontSize');
    if (qtyInputFontSizeInput) alignmentConfig.qtyInput.fontSize = parseFloat(qtyInputFontSizeInput.value);
    const qtyInputHScaleInput = document.getElementById('qtyInputHScale');
    if (qtyInputHScaleInput) alignmentConfig.qtyInput.horizontalScale = parseFloat(qtyInputHScaleInput.value);
    const qtyInputXPosInput = document.getElementById('qtyInputXPos');
    if (qtyInputXPosInput) alignmentConfig.qtyInput.xPosition = parseFloat(qtyInputXPosInput.value);
    const qtyInputYPosInput = document.getElementById('qtyInputYPos');
    if (qtyInputYPosInput) alignmentConfig.qtyInput.yPosition = parseFloat(qtyInputYPosInput.value);
    
    // Update MFG input config
    const mfgInputFontSizeInput = document.getElementById('mfgInputFontSize');
    if (mfgInputFontSizeInput) alignmentConfig.mfgInput.fontSize = parseFloat(mfgInputFontSizeInput.value);
    const mfgInputHScaleInput = document.getElementById('mfgInputHScale');
    if (mfgInputHScaleInput) alignmentConfig.mfgInput.horizontalScale = parseFloat(mfgInputHScaleInput.value);
    const mfgInputXPosInput = document.getElementById('mfgInputXPos');
    if (mfgInputXPosInput) alignmentConfig.mfgInput.xPosition = parseFloat(mfgInputXPosInput.value);
    const mfgInputYPosInput = document.getElementById('mfgInputYPos');
    if (mfgInputYPosInput) alignmentConfig.mfgInput.yPosition = parseFloat(mfgInputYPosInput.value);
    
    // Update VOLUME config
    const volumeFontSizeInput = document.getElementById('volumeFontSize');
    if (volumeFontSizeInput) alignmentConfig.volume.fontSize = parseFloat(volumeFontSizeInput.value);
    const volumeHScaleInput = document.getElementById('volumeHScale');
    if (volumeHScaleInput) alignmentConfig.volume.horizontalScale = parseFloat(volumeHScaleInput.value);
    const volumeXPosInput = document.getElementById('volumeXPos');
    if (volumeXPosInput) alignmentConfig.volume.xPosition = parseFloat(volumeXPosInput.value);
    const volumeYPosInput = document.getElementById('volumeYPos');
    if (volumeYPosInput) alignmentConfig.volume.yPosition = parseFloat(volumeYPosInput.value);
    
    showToast("Alignment configuration updated successfully");
}


// Utility for pluralization
function pluralize(word, count) {
    return count === 1 ? word : word + 's';
}

// Modal toggle logic
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');

if (settingsButton && settingsModal) {
settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});
}
if (closeSettingsButton && settingsModal) {
closeSettingsButton.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});
}
if (settingsModal) {
settingsModal.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});
}

