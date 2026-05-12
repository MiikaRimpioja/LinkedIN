const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

async function runOCR(imagePath) {
  try {
    // Tarkista että polku on merkkijono
    if (typeof imagePath !== 'string' || imagePath.trim() === '') {
      throw new Error('Virheellinen kuvatiedoston polku');
    }

    // Varmista että tiedosto on olemassa
    if (!fs.existsSync(imagePath)) {
      throw new Error('Kuvatiedostoa ei löytynyt: ' + imagePath);
    }

    // Varmista että tiedosto on kuva (esim. jpg, png, webp)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
    const ext = path.extname(imagePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error('Tiedostotyyppi ei ole tuettu: ' + ext);
    }

    // Luo esikäsitelty versio
    const processedPath = path.join(
      path.dirname(imagePath),
      'pre_' + path.basename(imagePath)
    );

    // Käsittele kuva Sharpilla
    try {
      await sharp(imagePath)
        .resize({ width: 1200, withoutEnlargement: true }) // skaalaa isommaksi, mutta ei yli alkuperäisen
        .grayscale()
        .threshold(180)
        .toFile(processedPath);
    } catch (sharpErr) {
      throw new Error('Kuvan esikäsittely epäonnistui: ' + sharpErr.message);
    }

    // Suorita OCR
    let result;
    try {
      result = await Tesseract.recognize(processedPath, 'fin', {
        logger: m => console.log(m.status, m.progress)
      });
    } catch (ocrErr) {
      throw new Error('Tesseract epäonnistui: ' + ocrErr.message);
    }

    const text = result?.data?.text?.trim();
    if (!text) throw new Error('OCR ei löytänyt tekstiä');

    return text;
  } catch (err) {
    throw new Error('Syy: ' + (err.message || String(err)));
  }
}

module.exports = runOCR;
