import fs from "fs";
import path from "path";

const fontFilePath = process.argv[2];

if (!fontFilePath) {
  console.error("Usage: node generate-font-base64.js <path/to/font.ttf_or_woff>");
  process.exit(1);
}

const absolutePath = path.resolve(fontFilePath);

try {
  const fontData = fs.readFileSync(absolutePath);
  const base64String = fontData.toString("base64");
  
  // Determine font format for data URL prefix
  let fontFormat = "application/octet-stream"; // Default
  if (fontFilePath.toLowerCase().endsWith(".ttf")) {
    fontFormat = "font/ttf";
  } else if (fontFilePath.toLowerCase().endsWith(".woff")) {
    fontFormat = "font/woff";
  } else if (fontFilePath.toLowerCase().endsWith(".woff2")) {
    fontFormat = "font/woff2";
  }

  console.log(`data:${fontFormat};base64,${base64String}`);
} catch (error) {
  console.error(`Error reading font file: ${error.message}`);
  process.exit(1);
}