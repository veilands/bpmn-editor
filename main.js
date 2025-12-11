import BpmnModeler from 'bpmn-js/lib/Modeler';
import minimapModule from 'diagram-js-minimap';
import BpmnColorPickerModule from 'bpmn-js-color-picker';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'diagram-js-minimap/assets/diagram-js-minimap.css';
import 'bpmn-js-color-picker/colors/color-picker.css';
import './style.css';

// ==========================================
// STATE
// ==========================================
// ==========================================
// STATE
// ==========================================
let bpmnModeler;
let fileHandle = null;
let isDirty = false;

// New Diagram Template
const NEW_DIAGRAM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    bpmnModeler = new BpmnModeler({
        container: '#canvas',
        additionalModules: [
            minimapModule,
            BpmnColorPickerModule
        ]
    });
    window.bpmnModeler = bpmnModeler; // Debug access

    // GUI Listeners
    // GUI Listeners
    document.getElementById('btn-new').addEventListener('click', createNewDiagram);
    document.getElementById('btn-open').addEventListener('click', openFile);
    document.getElementById('btn-save').addEventListener('click', saveFile);
    document.getElementById('btn-save-as').addEventListener('click', saveAsFile);
    document.getElementById('btn-export-png').addEventListener('click', exportAsPng);
    document.getElementById('btn-close').addEventListener('click', closeDiagram);

    // Dirty State Listener
    bpmnModeler.on('commandStack.changed', () => {
        isDirty = true;
        document.title = `BPMN Editor${fileHandle ? ' - ' + fileHandle.name : ''} *`;
        updateToolbar();
    });

    // Listeners
    bpmnModeler.on('import.done', handleImportDone);


    // Drill-down Listener - Handled natively by bpmn-js


    // Shortcuts
    document.addEventListener('keydown', handleShortcuts);

    // Drag & Drop
    const dropZone = document.body;
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);

    // Load Default or Empty
    try {
        await bpmnModeler.importXML(NEW_DIAGRAM_XML);
        openMinimap();
    } catch (e) {
        console.error('Init error', e);
    }
}

// ==========================================
// CORE FEATURES
// ==========================================
function openMinimap() {
    try {
        const minimap = bpmnModeler.get('minimap');
        if (minimap) minimap.open();
    } catch (e) { console.warn('Minimap not loaded', e); }
}

// ---- Logic ----

// On Import, open minimap
function handleImportDone() {
    openMinimap();
}

// ---- Drill-down Logic ----
// (Native bpmn-js drill-down handles this now)


// ---- Navigation Utilities (Removed custom logic) ----

// ==========================================
// MODAL SYSTEM
// ==========================================
function showModal(title, message, buttons) {
    const modal = document.getElementById('save-modal');
    modal.querySelector('h3').textContent = title;
    modal.querySelector('p').textContent = message;

    // Clear dynamic content or use it for filename
    const filenameDisplay = document.getElementById('save-filename');
    filenameDisplay.textContent = fileHandle ? fileHandle.name : '';
    if (!fileHandle) filenameDisplay.classList.add('hidden');
    else filenameDisplay.classList.remove('hidden');

    const actions = modal.querySelector('.modal-actions');
    actions.innerHTML = ''; // Clear old buttons

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.label;
        if (btn.primary) button.classList.add('primary');
        button.onclick = () => {
            modal.classList.add('hidden');
            if (btn.onClick) btn.onClick();
        };
        actions.appendChild(button);
    });

    modal.classList.remove('hidden');
}

async function checkUnsavedChanges() {
    if (isDirty) {
        return new Promise((resolve) => {
            showModal(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to discard them?',
                [
                    { label: 'Cancel', onClick: () => resolve(false) },
                    { label: 'Discard Changes', primary: true, onClick: () => resolve(true) }
                ]
            );
        });
    }
    return true; // Proceed
}


async function createNewDiagram() {
    if (!(await checkUnsavedChanges())) return;

    try {
        await bpmnModeler.importXML(NEW_DIAGRAM_XML);
        isDirty = false;
        document.title = 'BPMN Editor - New Diagram *'; // It's technically dirty/new? No, "New" is clean until edited.
        // Actually "New" usually means "Untitled". 
        document.title = 'BPMN Editor - Untitled';
        openMinimap();
        updateToolbar();
    } catch (err) {
        console.error('Error creating new diagram', err);
    }
}

async function closeDiagram() {
    if (!(await checkUnsavedChanges())) return;

    // Unload / Clear
    try {
        await bpmnModeler.importXML(NEW_DIAGRAM_XML); // Or clear() if available, but importXML is safer to reset state
        // bpmnModeler.clear(); // clear() leaves it in a weird state sometimes, better to load empty
        fileHandle = null;
        isDirty = false;
        document.title = 'BPMN Editor';
        updateToolbar();
    } catch (e) { console.error(e); }
}

async function openFile() {
    if (!(await checkUnsavedChanges())) return;

    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'BPMN', accept: { 'text/xml': ['.bpmn', '.xml'] } }]
        });
        const file = await fileHandle.getFile();
        const text = await file.text();
        await bpmnModeler.importXML(text);
        isDirty = false;
        document.title = `BPMN Editor - ${fileHandle.name}`;
        updateToolbar();
    } catch (e) { console.error(e); }
}

async function saveFile() {
    if (!fileHandle) return saveAsFile();

    // Direct Save (Standard UX)
    // The visual cue (modal) was removed for optimization.
    // Permission check will happen on this click event.
    await performSave();
}

async function performSave() {
    try {
        // 2. Verify Permission (Now inside a fresh click handler)
        const opts = { mode: 'readwrite' };
        if ((await fileHandle.queryPermission(opts)) !== 'granted') {
            if ((await fileHandle.requestPermission(opts)) !== 'granted') {
                alert('Permission denied. Please use Save As.');
                return saveAsFile();
            }
        }

        const { xml } = await bpmnModeler.saveXML({ format: true });
        const writable = await fileHandle.createWritable();
        await writable.write(xml);
        await writable.close();

        console.log('File saved successfully');
        isDirty = false;
        document.title = `BPMN Editor - ${fileHandle.name}`;
        updateToolbar();
    } catch (e) {
        console.error('Save failed', e);
        alert('Save failed: ' + e.message);
    }
}

async function saveAsFile() {
    try {
        const { xml } = await bpmnModeler.saveXML({ format: true });
        fileHandle = await window.showSaveFilePicker({
            types: [{ description: 'BPMN', accept: { 'text/xml': ['.bpmn'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(xml);
        await writable.close();
        isDirty = false;
        document.title = `BPMN Editor - ${fileHandle.name}`;
        updateToolbar(); // Ensure toolbar updates on Save As too
    } catch (e) { console.error(e); }
}



async function exportAsPng() {
    try {
        const { svg } = await bpmnModeler.saveSVG();

        // Create an Image to render the SVG
        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // White background (otherwise transparency might look black in some viewers)
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            // Download
            const link = document.createElement('a');
            link.download = `diagram-${Date.now()}.png`; // Simple timestamp name
            link.href = canvas.toDataURL('image/png');
            link.click();

            URL.revokeObjectURL(url);
        };

        img.src = url;

    } catch (err) {
        console.error('Error exporting PNG', err);
        alert('Could not export PNG: ' + err.message);
    }
}

function handleShortcuts(e) {
    if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 's') { e.preventDefault(); saveFile(); }
        if (e.key === 'o') { e.preventDefault(); openFile(); }
    }
}

// ==========================================
// DRAG & DROP HANDLERS
// ==========================================
function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

async function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const name = file.name.toLowerCase();

    if (name.endsWith('.bpmn') || name.endsWith('.xml')) {
        if (!(await checkUnsavedChanges())) return;

        try {
            const text = await file.text();
            await bpmnModeler.importXML(text);

            fileHandle = null;
            isDirty = true;
            document.title = `BPMN Editor - ${file.name} *`;
            updateToolbar();
        } catch (err) {
            console.error('Error processing dropped file', err);
            alert('Could not open file: ' + err.message);
        }
    } else {
        alert('Only .bpmn and .xml files are supported.');
    }
}

// ==========================================
// UI STATE
// ==========================================
function updateToolbar() {
    const isSessionActive = document.title !== 'BPMN Editor';

    const btnNew = document.getElementById('btn-new');
    const btnOpen = document.getElementById('btn-open');
    const btnSave = document.getElementById('btn-save');
    const btnSaveAs = document.getElementById('btn-save-as');
    const btnExportPng = document.getElementById('btn-export-png');
    const btnClose = document.getElementById('btn-close');

    // Always visible & valid
    // btnNew.classList.remove('hidden');
    // btnOpen.classList.remove('hidden');
    btnNew.disabled = false;
    btnOpen.disabled = false;

    // Session Dependent
    if (isSessionActive || isDirty) {
        btnSaveAs.disabled = false;
        btnExportPng.disabled = false;
        btnClose.disabled = false;
    } else {
        btnSaveAs.disabled = true;
        btnExportPng.disabled = true;
        btnClose.disabled = true;
    }

    // Dirty Dependent
    if (isDirty) {
        btnSave.disabled = false;
        btnSave.innerText = 'Save *'; // Visual cue
    } else {
        btnSave.disabled = true;
        btnSave.innerText = 'Save';
    }
}

// Boot
init();
updateToolbar();
