import { isMobile } from './device.js';

const BUBBLE_CONFIG = isMobile
    ? { initialCount: 5,  spawnInterval: 1500, maxLive: 12, minSize: 6,  maxSize: 14 }
    : { initialCount: 15, spawnInterval: 400,  maxLive: Infinity, minSize: 5, maxSize: 20 };

export function initBubbles() {
    const container = document.getElementById('game-container');

    for (let i = 0; i < BUBBLE_CONFIG.initialCount; i++) {
        setTimeout(() => createBubble(container), Math.random() * 5000);
    }

    setInterval(() => {
        // Don't spawn if we're already at the live cap (mobile safeguard)
        const live = container.querySelectorAll('.bubble-container').length;
        if (live < BUBBLE_CONFIG.maxLive) {
            createBubble(container);
        }
    }, BUBBLE_CONFIG.spawnInterval);
}

function createBubble(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bubble-container';
    wrapper.style.left = `${Math.random() * 100}vw`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const { minSize, maxSize } = BUBBLE_CONFIG;
    const size = Math.random() * (maxSize - minSize) + minSize;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    const duration = Math.random() * 6 + 4;
    bubble.style.animationDuration = `${duration}s`;

    wrapper.style.animationDuration = `${Math.random() * 3 + 2}s`;
    wrapper.style.animationDelay = `-${Math.random() * 3}s`;

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);

    setTimeout(() => {
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
    }, duration * 1000 + 100);
}
