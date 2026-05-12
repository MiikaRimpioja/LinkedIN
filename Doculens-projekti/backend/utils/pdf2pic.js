const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

/**
 * Muuntaa PDF:n PNG-kuviksi pdftoppm-binäärillä.
 * @param {string} pdfPath - Polku PDF-tiedostoon
 * @param {string} outputDir - Hakemisto johon PNG:t tallennetaan
 * @param {number} dpi - Kuvien resoluutio (default 200)
 * @returns {Promise<string[]>} - Lista luoduista PNG-tiedostonimistä
 */
async function convertPdfToPng(pdfPath, outputDir, dpi = 200) {
  return new Promise((resolve, reject) => {
    const outputPrefix = path.join(outputDir, "page");
    const args = ["-png", "-r", String(dpi), pdfPath, outputPrefix];

    execFile("pdftoppm", args, (error) => {
      if (error) return reject(error);

      try {
        const files = fs
          .readdirSync(outputDir)
          .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
          .sort((a, b) => {
            const numA = parseInt(a.match(/page-(\d+)\.png/)[1], 10);
            const numB = parseInt(b.match(/page-(\d+)\.png/)[1], 10);
            return numA - numB;
          });

        resolve(files);
      } catch (fsErr) {
        reject(fsErr);
      }
    });
  });
}

module.exports = convertPdfToPng;
