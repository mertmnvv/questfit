const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const brainPath = 'C:\\Users\\mertm\\.gemini\\antigravity-ide\\brain\\78c27de3-dfe0-4aab-8a8c-757f3d83d81a';
const assetsPath = 'C:\\Mert\\QuestFit\\assets';

const files = [
  { in: 'chibi_base_male_1781892867187.png', out: 'chibi_male.png' },
  { in: 'chibi_base_female_1781892876265.png', out: 'chibi_female.png' },
  { in: 'chibi_sword_1781892886618.png', out: 'chibi_sword.png' },
  { in: 'chibi_armor_1781892894107.png', out: 'chibi_armor.png' },
  { in: 'chibi_pet_1781892903158.png', out: 'chibi_pet.png' }
];

async function processImages() {
  for (const file of files) {
    const inPath = path.join(brainPath, file.in);
    const outPath = path.join(assetsPath, file.out);

    if (fs.existsSync(inPath)) {
      console.log(`Processing ${file.in}...`);
      try {
        const image = await Jimp.read(inPath);
        
        // Remove white background (tolerance for compression artifacts)
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
          const r = this.bitmap.data[idx + 0];
          const g = this.bitmap.data[idx + 1];
          const b = this.bitmap.data[idx + 2];
          
          if (r > 240 && g > 240 && b > 240) {
            this.bitmap.data[idx + 3] = 0; // Set Alpha to 0
          }
        });

        await image.writeAsync(outPath);
        console.log(`Saved transparent image to ${outPath}`);
      } catch (err) {
        console.error(`Error processing ${file.in}:`, err);
      }
    } else {
      console.log(`File not found: ${inPath}`);
    }
  }
}

processImages();
