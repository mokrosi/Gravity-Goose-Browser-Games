let spriteSheetImage = new Image(); // Nano
let tilesetImage = new Image(); // Ground Tile
let bananaImage = new Image(); // Banana
let bugImage = new Image(); // Bug
let bgImage = new Image(); // Background

function removeBackground(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Assume top-left pixel is the background color
    const bgR = data[0], bgG = data[1], bgB = data[2];
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        // If pixel is close to background color, make it transparent
        if (Math.abs(r - bgR) < 25 && Math.abs(g - bgG) < 25 && Math.abs(b - bgB) < 25) {
            data[i+3] = 0; // Alpha to 0
        }
    }
    ctx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    return newImg;
}

function preload() {
    spriteSheetImage.src = "./assets/images/nano.png";
    tilesetImage.src = "./assets/images/tile.png";
    bananaImage.src = "./assets/images/banana.png";
    bugImage.src = "./assets/images/bug.png";
    bgImage.src = "./assets/images/bg.png";

    return new Promise(function(resolve, reject) {
        const promises = [
            spriteSheetImage, tilesetImage, bananaImage, bugImage, bgImage
        ].map(img => new Promise(res => {
            img.onload = () => res();
            img.onerror = () => res(); // fallback
        }));

        Promise.all(promises).then(() => {
            resolve({
                spriteSheetImage: removeBackground(spriteSheetImage),
                tilesetImage, // No bg removal for tiles
                bananaImage: removeBackground(bananaImage),
                bugImage: removeBackground(bugImage),
                bgImage // No bg removal for background
            });
        });
    });
}