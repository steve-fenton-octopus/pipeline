export function initBubbles() {
    const container = document.getElementById('game-container');
    const bubbleCount = 15;

    for (let i = 0; i < bubbleCount; i++) {
        setTimeout(() => createBubble(container), Math.random() * 5000);
    }

    setInterval(() => {
        createBubble(container);
    }, 400);
}

function createBubble(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bubble-container';
    wrapper.style.left = `${Math.random() * 100}vw`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const size = Math.random() * 15 + 5;
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
