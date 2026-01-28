/**
 * Clover Bulk Price Updater - Content Script
 * 
 * This script is injected into the Clover webpage. It handles:
 * 1. Creating the floating UI (overlay).
 * 2. Auto-navigating the complex Clover UI (clicking Select All, Edit).
 * 3. finding price input fields even inside React components.
 * 4. Simulating user typing to update prices reliably.
 */

// Check if overlay checks
if (document.getElementById('clover-bulk-editor-overlay')) {
    toggleUI();
} else {
    init();
}

function init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggle_ui") {
            toggleUI();
            sendResponse({ status: "ok" });
        }
    });
}

function toggleUI() {
    let overlay = document.getElementById('clover-bulk-editor-overlay');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    } else {
        createOverlay();
    }
}

function createOverlay() {
    const div = document.createElement('div');
    div.id = 'clover-bulk-editor-overlay';

    // Get logo URL
    const logoUrl = chrome.runtime.getURL('assets/logo.png');

    div.innerHTML = `
    <div id="clover-bulk-editor-header">
        <div style="display:flex; align-items:center;">
             <img src="${logoUrl}" style="width:24px; height:24px; margin-right:8px; border-radius:4px;">
             <span>Clover POS Bulk Price</span>
        </div>
        <span id="clover-bulk-editor-close">✖</span>
    </div>
    <div id="clover-bulk-editor-body">
         <div class="subtitle" style="text-align:center; color:#999; font-size:10px; margin-bottom:10px;">by raccoon-exe (catari)</div>
         <div class="cbe-input-group">
            <button id="cbe-auto-setup-btn" class="cbe-btn cbe-btn-secondary">Step 1: Enter Edit Mode</button>
        </div>

        <div class="cbe-input-group">
            <label class="cbe-label">New Price ($)</label>
            <input type="number" id="cbe-price-input" class="cbe-input" placeholder="e.g. 10.00" step="0.01">
        </div>
         <div class="cbe-input-group">
            <label class="cbe-label">Price Selector (Advanced)</label>
            <input type="text" id="cbe-selector-input" class="cbe-input" value="input[data-testid='QuickEditable-currency-field'], input[inputmode='decimal'], input[name*='price']">
        </div>
        <button id="cbe-preview-btn" class="cbe-btn" style="background:#3498db; margin-bottom:10px;">Step 2: Preview Fields</button>
        <button id="cbe-apply-btn" class="cbe-btn">Step 3: Apply to All</button>
        <div id="cbe-status" class="cbe-status">Ready.</div>
    </div>
    `;
    document.body.appendChild(div);

    document.getElementById('clover-bulk-editor-close').onclick = () => {
        div.style.display = 'none';
    };

    document.getElementById('cbe-auto-setup-btn').onclick = autoSetup;
    document.getElementById('cbe-preview-btn').onclick = previewFields;
    document.getElementById('cbe-apply-btn').onclick = applyPrice;

    // Make draggable
    dragElement(div);
}

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // Fix: ID is specifically 'clover-bulk-editor-header', not '...-overlay-header'
    const header = document.getElementById("clover-bulk-editor-header");

    if (header) {
        // if present, the header is where you move the DIV from:
        header.style.cursor = "move";
        header.onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        // Important: Switch to using top/left completely if dragging to avoid conflicts with bottom/right
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        elmnt.style.bottom = "auto";
        elmnt.style.right = "auto";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

async function autoSetup() {
    const status = document.getElementById('cbe-status');
    status.innerText = "Step 1: Finding 'Select All' checkbox...";

    // Strategy: The 'Select All' checkbox is typically in the table header (thead/th)
    let selectAll = document.querySelector('thead input[type="checkbox"]');
    if (!selectAll) selectAll = document.querySelector('th input[type="checkbox"]'); // Common in tables

    // Fallback: The FIRST checkbox on the page is often Select All
    if (!selectAll) {
        const allChecks = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        if (allChecks.length > 0) selectAll = allChecks[0];
    }

    if (selectAll) {
        if (!selectAll.checked) {
            selectAll.click();
            // Fire event just in case
            selectAll.dispatchEvent(new Event('change', { bubbles: true }));
            status.innerText = "Clicked 'Select All'. Waiting for Edit button...";
            await new Promise(r => setTimeout(r, 600));
        } else {
            status.innerText = "'Select All' already checked. Checking for Edit button...";
        }
    } else {
        status.innerText = "Failed to find 'Select All'. Please select items manually.";
        return;
    }

    // Step 2: Find the 'Edit' button
    // It usually appears in a toolbar *above* the list once items are selected.

    // PRIORITY 1: Specific data-testid provided by user
    let editBtn = document.querySelector('button[data-testid="quick-edit-button"]');

    if (!editBtn) {
        // PRIORITY 2: Look for button with specific "Edit" label class or text
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"]'));
        const visibleButtons = buttons.filter(b => b.offsetParent !== null);

        // Exact text match (often inside a span)
        editBtn = visibleButtons.find(b => b.innerText.trim() === 'Edit');

        // Check for visually hidden spans that might say "Edit"
        if (!editBtn) {
            editBtn = visibleButtons.find(b => {
                return b.querySelector('span[class*="visuallyHidden"]')?.innerText === 'Edit';
            });
        }
    }

    if (editBtn) {
        status.innerText = "Found 'Edit' button. Clicking...";
        editBtn.click();

        await new Promise(r => setTimeout(r, 1000));

        const inputs = getPriceInputs();
        if (inputs.length > 0) {
            status.innerText = `Ready! Found ${inputs.length} fields. Proceed to Step 2/3.`;
            previewFields();
        } else {
            status.innerText = "Clicked 'Edit', but fields didn't turn into inputs. Try clicking 'Edit' manually.";
        }
    } else {
        status.innerText = "Items selected, but couldn't auto-find the 'Edit' button. Please click 'Edit' manually.";
    }
}

function getPriceInputs() {
    const selector = document.getElementById('cbe-selector-input').value;
    // Attempt to find inputs based on the selector
    // Also try some heuristics if default
    let inputs = Array.from(document.querySelectorAll(selector));

    // Filter to ensure they are visible
    inputs = inputs.filter(el => {
        return el.offsetParent !== null && !el.disabled;
    });

    return inputs;
}

function previewFields() {
    const inputs = getPriceInputs();
    const status = document.getElementById('cbe-status');

    // Clear previous highlights
    document.querySelectorAll('.cbe-highlight').forEach(el => {
        el.style.outline = '';
        el.classList.remove('cbe-highlight');
    });

    if (inputs.length === 0) {
        status.innerText = "No price fields found. Try Step 1 or adjust selector.";
        return;
    }

    inputs.forEach(el => {
        el.style.outline = '2px solid red';
        el.classList.add('cbe-highlight');
    });

    status.innerText = `Found ${inputs.length} editable price fields.`;
}

async function applyPrice() {
    const priceVal = document.getElementById('cbe-price-input').value;
    if (!priceVal) {
        alert("Please enter a price.");
        return;
    }

    const inputs = getPriceInputs();
    if (inputs.length === 0) {
        alert("No fields found to update. Did you run Step 1?");
        return;
    }

    if (!confirm(`Are you sure you want to set ${inputs.length} items to $${priceVal}?`)) {
        return;
    }

    let count = 0;
    // We will process inputs sequentially to ensure focus works correctly
    for (const input of inputs) {
        try {
            // OPTION 1: Try document.execCommand (Simulates real user typing)
            input.focus();
            input.select(); // Select existing text to overwrite it

            let valueToType = priceVal;

            const success = document.execCommand('insertText', false, valueToType);

            if (!success) {
                // Fallback to React Setter if execCommand fails
                console.log("execCommand failed, trying native setter");

                let valueToSet = priceVal;
                if (input.value && input.value.trim().startsWith('$')) {
                    if (!valueToSet.startsWith('$')) {
                        valueToSet = '$' + valueToSet;
                    }
                }
                setNativeValue(input, valueToSet);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            input.blur();

            count++;

            // Small delay to allow UI to react
            await new Promise(r => setTimeout(r, 50));

        } catch (e) {
            console.error(e);
        }
    }

    document.getElementById('cbe-status').innerText = `Updated ${count} fields. Verify and Save!`;
}

// Helper to bypass React/Frameowrk synthetic events
function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }
}
