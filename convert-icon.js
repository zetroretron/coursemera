const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, 'assets', 'logo.svg');
const pngPath = path.join(__dirname, 'assets', 'icon.png');
const icoPath = path.join(__dirname, 'assets', 'icon.ico');

async function convert() {
    const svg = fs.readFileSync(svgPath);

    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    const pngBuffers = await Promise.all(
        sizes.map(size =>
            sharp(svg, { density: 300 })
                .resize(size, size)
                .png()
                .toBuffer()
        )
    );

    const idx256 = sizes.indexOf(256);
    const png256Path = pngPath.replace('.png', '256.png');
    await sharp(pngBuffers[idx256]).toFile(png256Path);
    const icoBuffer = await pngToIco.default([png256Path]);
    fs.writeFileSync(icoPath, icoBuffer);
    fs.unlinkSync(png256Path);

    await sharp(pngBuffers[idx256]).toFile(pngPath);
    console.log('Created:', pngPath);
    console.log('Created:', icoPath);
    console.log('Done!');
}

convert().catch(console.error);