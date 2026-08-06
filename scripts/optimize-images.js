import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

async function optimizeImage(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let sharpImage = image;

    // Convert to WebP for better compression
    if (ext !== '.svg') {
      sharpImage = sharpImage.webp({ quality: WEBP_QUALITY });
      outputPath = outputPath.replace(ext, '.webp');
    }

    // Optimize
    await sharpImage.toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller)`);

    return true;
  } catch (error) {
    console.error(`✗ Error optimizing ${inputPath}:`, error.message);
    return false;
  }
}

async function findImages(dir) {
  const images = [];

  const walk = (currentDir) => {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and dist
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          walk(filePath);
        }
      } else if (IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
        images.push(filePath);
      }
    }
  };

  walk(dir);
  return images;
}

async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================');

  const rootDir = process.cwd();
  const images = await findImages(rootDir);

  if (images.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${images.length} images to optimize\n`);

  let successCount = 0;
  for (const imagePath of images) {
    const relativePath = path.relative(rootDir, imagePath);
    const outputPath = path.join(rootDir, 'dist', relativePath);
    const outputDir = path.dirname(outputPath);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const success = await optimizeImage(imagePath, outputPath);
    if (success) successCount++;
  }

  console.log(`\n✅ Optimization complete: ${successCount}/${images.length} images optimized`);
}

main().catch(console.error);