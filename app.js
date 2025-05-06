// Initialize globals
let canvas = null;
let isInitialized = false;
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize canvas
function initCanvas() {
    try {
        const canvasEl = document.getElementById('canvas');
        if (!canvasEl) throw new Error('Canvas element not found');

        const theme = localStorage.getItem('theme') || 'light';
        const bgColor = CONFIG.THEME[theme.toUpperCase()].CANVAS_BG;

        canvas = new fabric.Canvas('canvas', {
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            backgroundColor: bgColor,
            preserveObjectStacking: true,
            selection: true,
            defaultCursor: 'default',
            moveCursor: 'move'
        });

        // Add canvas background rectangle
        const templateBg = new fabric.Rect({
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            fill: CONFIG.THEME[theme.toUpperCase()].TEMPLATE_BG,
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        
        canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
        canvas.add(templateBg);
        canvas.sendToBack(templateBg);

        // Set canvas controls
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.cornerColor = '#00a0f5';
        fabric.Object.prototype.cornerSize = 10;
        fabric.Object.prototype.padding = 5;

        // Add event listeners
        canvas.on({
            'object:moving': (e) => canvas.renderAll(),
            'object:scaling': (e) => canvas.renderAll(),
            'object:rotating': (e) => canvas.renderAll(),
            'selection:created': updateControls,
            'selection:updated': updateControls,
            'selection:cleared': clearControls
        });

        // Initial render
        resizeCanvas();
        canvas.renderAll();
        isInitialized = true;

        return true;
    } catch (error) {
        console.error('Canvas initialization failed:', error);
        return false;
    }
}

// Clear controls when no selection
function clearControls() {
    const controls = ['textColor', 'strokeColor', 'strokeWidth', 'fontFamily'];
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = element.defaultValue;
    });
}

// Update controls when object selected
function updateControls(e) {
    const obj = e.target;
    if (!obj) return;

    if (obj.type.includes('text')) {
        document.getElementById('textColor').value = obj.fill || '#000000';
        document.getElementById('strokeColor').value = obj.stroke || '#000000';
        document.getElementById('strokeWidth').value = obj.strokeWidth || 0;
        document.getElementById('fontFamily').value = obj.fontFamily || 'Arial';
    }
}

// Resize canvas maintaining aspect ratio
function resizeCanvas() {
    if (!canvas) return;

    const container = document.querySelector('.canvas-container');
    if (!container) return;

    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;

    const canvasRatio = CONFIG.CANVAS_HEIGHT / CONFIG.CANVAS_WIDTH;
    const containerRatio = containerHeight / containerWidth;

    let newWidth, newHeight;

    if (containerRatio > canvasRatio) {
        newWidth = containerWidth;
        newHeight = containerWidth * canvasRatio;
    } else {
        newHeight = containerHeight;
        newWidth = containerHeight / canvasRatio;
    }

    canvas.setDimensions({
        width: newWidth,
        height: newHeight
    });

    canvas.setZoom(newWidth / CONFIG.CANVAS_WIDTH);
    canvas.renderAll();
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize theme first
        initTheme();
        
        // Check dependencies
        if (typeof fabric === 'undefined') {
            throw new Error('Fabric.js not loaded');
        }

        // Initialize canvas first
        if (!initCanvas()) {
            throw new Error('Canvas initialization failed');
        }

        // Add event listeners after canvas is initialized
        initializeEventListeners();
        initializeCanvasEvents();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Application initialization failed:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
});

// Initialize canvas-specific events
function initializeCanvasEvents() {
    if (!canvas) return;

    // Add canvas text change handler
    canvas.on('text:changed', function(opt) {
        const text = opt.target;
        if (text) {
            text.set({
                width: Math.max(200, text.width)
            });
            canvas.requestRenderAll();
        }
    });

    // Add selection handler
    canvas.on('selection:created', function(opt) {
        if (opt.target && opt.target.type === 'i-text') {
            updateTextControls(opt.target);
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Basic controls
    document.getElementById('imageUpload')?.addEventListener('change', handleImageUpload);
    document.getElementById('addText')?.addEventListener('click', handleAddText);
    
    // Text controls
    document.getElementById('textColor')?.addEventListener('input', updateTextProperties);
    document.getElementById('strokeColor')?.addEventListener('input', updateTextProperties);
    document.getElementById('strokeWidth')?.addEventListener('input', updateTextProperties);
    document.getElementById('fontFamily')?.addEventListener('change', updateTextProperties);
    
    // Design actions
    document.getElementById('saveDesign')?.addEventListener('click', handleSaveDesign);
    document.getElementById('loadDesign')?.addEventListener('click', handleLoadDesign);
    document.getElementById('downloadThumbnail')?.addEventListener('click', handleDownload);

    // AI controls
    const removeBackgroundBtn = document.getElementById('removeBackground');
    if (removeBackgroundBtn) {
        removeBackgroundBtn.addEventListener('click', handleBackgroundRemoval);
    }

    const generateStickerBtn = document.getElementById('generateSticker');
    if (generateStickerBtn) {
        generateStickerBtn.addEventListener('click', handleStickerGeneration);
    }
}

// Debug logger
function log(message, error = false) {
    if (CONFIG.DEBUG) {
        if (error) {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Convert the loaded image to a fabric.Image object
            const fabricImage = new fabric.Image(img);
            
            // Calculate scale to fit canvas while maintaining aspect ratio
            const scaleX = canvas.width / img.width;
            const scaleY = canvas.height / img.height;
            const scale = Math.min(scaleX, scaleY) * 0.8; // Scale to 80% of canvas size
            
            // Apply scaling
            fabricImage.scale(scale);
            
            // Position the image at random location within canvas bounds
            const maxLeft = canvas.width - (img.width * scale);
            const maxTop = canvas.height - (img.height * scale);
            fabricImage.set({
                left: Math.random() * maxLeft,
                top: Math.random() * maxTop,
                originX: 'left',
                originY: 'top'
            });

            // Add new image without clearing canvas
            canvas.add(fabricImage);
            canvas.setActiveObject(fabricImage);
            canvas.renderAll();
            
            // Enable image manipulation
            fabricImage.setControlsVisibility({
                mt: true,
                mb: true,
                ml: true,
                mr: true,
                bl: true,
                br: true,
                tl: true,
                tr: true,
                mtr: true
            });

            log('Image loaded successfully');
        };

        img.onerror = function() {
            log('Failed to load image', true);
            alert('Error loading image. Please try another file.');
        };

        img.src = event.target.result;
    };

    reader.onerror = function() {
        log('Error reading file', true);
        alert('Error reading file. Please try again.');
    };

    reader.readAsDataURL(file);
}

// Add clear canvas function
function clearCanvas() {
    canvas.getObjects().forEach(obj => {
        if (!obj.excludeFromExport) { // Don't remove background
            canvas.remove(obj);
        }
    });
    canvas.renderAll();
}

// Add clear button event listener
document.getElementById('clearCanvas')?.addEventListener('click', clearCanvas);

// Add keyboard controls for fine-tuning
fabric.util.addListener(document, 'keydown', function(e) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const STEP = e.shiftKey ? 10 : 1;
    
    switch (e.key) {
        case 'ArrowLeft':
            activeObject.left -= STEP;
            break;
        case 'ArrowRight':
            activeObject.left += STEP;
            break;
        case 'ArrowUp':
            activeObject.top -= STEP;
            break;
        case 'ArrowDown':
            activeObject.top += STEP;
            break;
        case 'r':
            activeObject.rotate(activeObject.angle + (e.shiftKey ? 45 : 5));
            break;
        case 'R':
            activeObject.rotate(activeObject.angle - (e.shiftKey ? 45 : 5));
            break;
        default:
            return;
    }
    
    activeObject.setCoords();
    canvas.renderAll();
    e.preventDefault();
});

// Background removal handler
function handleBackgroundRemoval() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || !activeObject.type.includes('image')) {
        alert('Please select an image first');
        return;
    }

    removeBackground(activeObject);
}

// Background removal function
async function removeBackground(activeObject) {
    const button = document.getElementById('removeBackground');
    if (!button) return;

    button.textContent = 'Processing...';
    button.disabled = true;
    button.classList.add('loading');

    try {
        const imageData = activeObject.toDataURL({
            format: 'png',
            quality: 1
        });

        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.HUGGING_FACE_API_TOKEN}`
            },
            body: imageData.split(',')[1]
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to remove background');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        fabric.Image.fromURL(url, function(img) {
            if (!img) throw new Error('Failed to load processed image');
            
            img.set({
                left: activeObject.left,
                top: activeObject.top,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                angle: activeObject.angle
            });
            canvas.remove(activeObject);
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            URL.revokeObjectURL(url);
        }, { crossOrigin: 'Anonymous' });

    } catch (error) {
        log('Background removal failed: ' + error.message, true);
        if (error.message.includes('loading') || error.message.includes('warm')) {
            alert('The AI model is warming up. Please wait a few seconds and try again.');
        } else {
            alert('Failed to remove background. Please try again.');
        }
    } finally {
        button.textContent = 'Remove Background';
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Helper function to load images
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Handle add text
function handleAddText() {
    if (!canvas) {
        log('Canvas not initialized', true);
        return;
    }

    try {
        const textInput = document.getElementById('textInput');
        const text = textInput.value || 'Type your text';
        
        const textbox = new fabric.IText(text, {
            left: canvas.width / 4,
            top: canvas.height / 4,
            fontSize: 40,
            fill: document.getElementById('textColor').value,
            fontFamily: document.getElementById('fontFamily').value,
            stroke: document.getElementById('strokeColor').value,
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            textAlign: 'center',
            editable: true,
            hasControls: true,
            lockUniScaling: false,
            centerTransform: true,
            padding: 5
        });

        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        textbox.enterEditing();
        canvas.renderAll();
        
        textInput.value = '';
        log('Text added successfully');
    } catch (error) {
        log('Failed to add text: ' + error.message, true);
        alert('Failed to add text. Please try again.');
    }
}

// Add this to enable direct editing on canvas
canvas.on('text:changed', function(opt) {
    const text = opt.target;
    text.set({
        width: Math.max(200, text.width) // Adjust width as needed
    });
    canvas.requestRenderAll();
});

document.getElementById('fontFamily').addEventListener('change', function(e) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
        activeObject.set({
            'fontFamily': e.target.value,
            // Adjust font size for Bangla and Hindi fonts
            'fontSize': e.target.value.includes('Hindi') || e.target.value.includes('Bengali') ? 
                activeObject.fontSize * 1.2 : activeObject.fontSize
        });
        canvas.renderAll();
    }
});

document.getElementById('textColor').addEventListener('input', function(e) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
        activeObject.set('fill', e.target.value);
        canvas.renderAll();
    }
});

document.getElementById('strokeColor').addEventListener('input', function(e) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
        activeObject.set('stroke', e.target.value);
        canvas.renderAll();
    }
});

document.getElementById('strokeWidth').addEventListener('input', function(e) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
        activeObject.set('strokeWidth', parseInt(e.target.value));
        canvas.renderAll();
    }
});

// Load stickers
function loadStickers() {
    const gallery = document.getElementById('stickerGallery');
    gallery.innerHTML = ''; // Clear existing stickers
    
    CONFIG.STICKERS.forEach(stickerPath => {
        try {
            const img = document.createElement('img');
            img.src = stickerPath;
            img.className = 'sticker';
            img.addEventListener('click', () => addSticker(stickerPath));
            gallery.appendChild(img);
        } catch (error) {
            log('Failed to load sticker: ' + stickerPath, true);
        }
    });
}

function addSticker(stickerPath) {
    fabric.Image.fromURL(stickerPath, function(img) {
        img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            scaleX: 0.2,
            scaleY: 0.2,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
    }, { crossOrigin: 'Anonymous' });
}

// AI Sticker Generation
async function generateAISticker(prompt) {
    const button = document.getElementById('generateSticker');
    const promptInput = document.getElementById('stickerPrompt');
    
    try {
        button.disabled = true;
        promptInput.disabled = true;
        button.classList.add('loading');
        button.textContent = 'Generating...';

        const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.HUGGING_FACE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: `${prompt}, ${CONFIG.DEFAULT_STICKER_PROMPT}`,
                wait_for_model: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate sticker');
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
            throw new Error('Empty response from API');
        }

        const url = URL.createObjectURL(blob);
        
        await new Promise((resolve, reject) => {
            fabric.Image.fromURL(url, function(img) {
                if (!img) {
                    reject(new Error('Failed to load generated image'));
                    return;
                }

                const maxSize = 200;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

                img.set({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale
                });

                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                URL.revokeObjectURL(url);
                promptInput.value = '';
                resolve();
            }, { crossOrigin: 'Anonymous' });
        });

        log('Sticker generated successfully');

    } catch (error) {
        log('AI Sticker generation failed: ' + error.message, true);
        if (error.message.includes('loading') || error.message.includes('currently loading')) {
            alert('Please wait 1-2 minutes for the AI model to warm up, then try again.');
        } else if (error.message.includes('quota')) {
            alert('API quota exceeded. Please try again later.');
        } else {
            alert('Failed to generate sticker. Please try a different description.');
        }
    } finally {
        button.disabled = false;
        promptInput.disabled = false;
        button.classList.remove('loading');
        button.textContent = 'Generate AI Sticker';
    }
}

// Update the sticker generation event listener
function handleStickerGeneration() {
    const promptInput = document.getElementById('stickerPrompt');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        alert('Please enter a description for the sticker.');
        promptInput.focus();
        return;
    }
    
    if (prompt.length < 3) {
        alert('Please enter a more detailed description (at least 3 characters).');
        promptInput.focus();
        return;
    }
    
    generateAISticker(prompt);
}

// Save and load designs
function handleSaveDesign() {
    try {
        const design = JSON.stringify(canvas.toJSON());
        localStorage.setItem('savedDesign', design);
        alert('Design saved successfully!');
        log('Design saved successfully');
    } catch (error) {
        log('Failed to save design: ' + error.message, true);
        alert('Failed to save design. Please try again.');
    }
}

function handleLoadDesign() {
    try {
        const savedDesign = localStorage.getItem('savedDesign');
        if (savedDesign) {
            canvas.loadFromJSON(savedDesign, function() {
                canvas.renderAll();
                log('Design loaded successfully');
            });
        }
    } catch (error) {
        log('Failed to load design: ' + error.message, true);
        alert('Failed to load design. Please try again.');
    }
}

// Download thumbnail
function handleDownload() {
    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1
        });
        
        const link = document.createElement('a');
        link.download = 'thumbnail.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        log('Thumbnail downloaded successfully');
    } catch (error) {
        log('Failed to download thumbnail: ' + error.message, true);
        alert('Failed to download thumbnail. Please try again.');
    }
}

// Debounce function for resize handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Color picker initialization
function initializeColorPickers() {
    const textColor = document.getElementById('textColor');
    const strokeColor = document.getElementById('strokeColor');
    
    textColor.addEventListener('input', updateTextProperties);
    strokeColor.addEventListener('input', updateTextProperties);
    document.getElementById('strokeWidth').addEventListener('input', updateTextProperties);
}

// Update text properties
function updateTextProperties() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type.includes('text')) {
        try {
            activeObject.set({
                fill: document.getElementById('textColor').value,
                stroke: document.getElementById('strokeColor').value,
                strokeWidth: parseInt(document.getElementById('strokeWidth').value)
            });
            canvas.renderAll();
        } catch (error) {
            log('Failed to update text properties: ' + error.message, true);
        }
    }
}

// Keyboard controls
function handleKeyboardControls(e) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const STEP = e.shiftKey ? 10 : 1;
    
    switch (e.key) {
        case 'ArrowLeft':
            activeObject.left -= STEP;
            break;
        case 'ArrowRight':
            activeObject.left += STEP;
            break;
        case 'ArrowUp':
            activeObject.top -= STEP;
            break;
        case 'ArrowDown':
            activeObject.top += STEP;
            break;
        case 'Delete':
            canvas.remove(activeObject);
            break;
        default:
            return;
    }
    
    canvas.renderAll();
    e.preventDefault();
}

// Add text controls update
canvas.on('selection:created', function(opt) {
    if (opt.target && opt.target.type === 'i-text') {
        document.getElementById('textColor').value = opt.target.fill;
        document.getElementById('strokeColor').value = opt.target.stroke || '#000000';
        document.getElementById('strokeWidth').value = opt.target.strokeWidth || 0;
        document.getElementById('fontFamily').value = opt.target.fontFamily;
    }
});

// Theme initialization
function initTheme() {
    applyTheme(currentTheme);
    
    // Add theme toggle listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(currentTheme);
        });
    }
}

function applyTheme(theme) {
    // Update DOM theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Update canvas colors
    if (canvas) {
        const themeConfig = CONFIG.THEME[theme.toUpperCase()];
        canvas.backgroundColor = themeConfig.CANVAS_BG;
        
        // Update template background
        const templateBg = canvas.getObjects().find(obj => !obj.selectable);
        if (templateBg) {
            templateBg.set('fill', themeConfig.TEMPLATE_BG);
        }
        
        canvas.renderAll();
    }
}

function toggleTheme() {
    // Toggle theme
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(currentTheme);
    
    // Save preference
    localStorage.setItem('theme', currentTheme);
    
    // Update UI
    updateThemeIcon();
    
    // Update canvas
    if (canvas) {
        canvas.backgroundColor = currentTheme === 'dark' ? '#2d2d2d' : '#ffffff';
        canvas.renderAll();
    }
}

function updateThemeIcon() {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Move canvas text event outside global scope
function updateTextControls(textObject) {
    document.getElementById('textColor').value = textObject.fill;
    document.getElementById('strokeColor').value = textObject.stroke || '#000000';
    document.getElementById('strokeWidth').value = textObject.strokeWidth || 0;
    document.getElementById('fontFamily').value = textObject.fontFamily;
}
