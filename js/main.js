window.addEventListener('load', () => {
    const game = new Game();
    game.start();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
});
