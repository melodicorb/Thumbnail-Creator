const CONFIG = {
    // Canvas dimensions
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,

    // Default settings
    DEFAULTS: {
        TEXT_COLOR: '#ffffff',
        STROKE_COLOR: '#000000',
        STROKE_WIDTH: 0,
        FONT_SIZE: 40,
        FONT_FAMILY: 'Arial',
        CANVAS_BG: '#ffffff'
    },

    // API settings
    HUGGING_FACE_API_TOKEN: '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',
    STABLE_DIFFUSION_API: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
    
    // Sticker defaults
    DEFAULT_STICKER_PROMPT: 'simple sticker design, flat vector art style, white background, centered composition, cute, minimalist, professional quality',
    STICKERS: [
        './stickers/emoji-smile.png',
        './stickers/emoji-heart.png',
        './stickers/emoji-star.png',
        './stickers/arrow-right.png',
        './stickers/arrow-left.png',
        './stickers/circle.png'
    ],

    // Theme configuration
    THEME: {
        LIGHT: {
            CANVAS_BG: '#ffffff',
            TEMPLATE_BG: '#f5f5f5',
            TEXT_COLOR: '#333333'
        },
        DARK: {
            CANVAS_BG: '#1a1a1a',
            TEMPLATE_BG: '#2d2d2d',
            TEXT_COLOR: '#ffffff'
        }
    },

    // Debug mode
    DEBUG: true
};
