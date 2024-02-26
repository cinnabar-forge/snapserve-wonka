/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const pluginAssetsPath = path.dirname(fileURLToPath(import.meta.url));

function calculateFolderSize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  });

  return totalSize;
}

function findLongestFilename(dirPath) {
  const files = fs.readdirSync(dirPath);
  return files.reduce((a, b) => (a.length > b.length ? a : b), "");
}

function countFiles(dirPath) {
  return fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isFile()).length;
}

function getFileTypeDistribution(dirPath) {
  const files = fs.readdirSync(dirPath);
  const distribution = files.reduce((acc, file) => {
    const ext = path.extname(file).toLowerCase();
    acc[ext] ? acc[ext]++ : (acc[ext] = 1);
    return acc;
  }, {});

  return Object.entries(distribution)
    .map(([type, count]) => `${count} file(s) of type ${type}`)
    .join(", ");
}

function getNewestFile(dirPath) {
  const files = fs.readdirSync(dirPath).map((file) => {
    const filePath = path.join(dirPath, file);
    return { file, mtime: fs.statSync(filePath).mtime };
  });

  const newest = files.reduce((a, b) => (a.mtime > b.mtime ? a : b), files[0]);
  return newest.file;
}

function getOldestFile(dirPath) {
  const files = fs.readdirSync(dirPath).map((file) => {
    const filePath = path.join(dirPath, file);
    return { file, mtime: fs.statSync(filePath).mtime };
  });

  const oldest = files.reduce((a, b) => (a.mtime < b.mtime ? a : b), files[0]);
  return oldest.file;
}

function getAverageFileSize(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalSize = 0;

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  });

  const averageSize =
    files.length > 0 ? (totalSize / files.length / 1024).toFixed(2) : 0;
  return `${averageSize}KB`;
}

function generateFacts(folder) {
  const facts = [];
  const totalSize = calculateFolderSize(folder);
  const sizeInKb = (totalSize / 1024).toFixed(2);
  const longestFilename = findLongestFilename(folder);
  const filesCount = countFiles(folder);
  const fileTypeDistribution = getFileTypeDistribution(folder);
  const newestFile = getNewestFile(folder);
  const oldestFile = getOldestFile(folder);
  const averageFileSize = getAverageFileSize(folder);

  facts.push(`This folder is ${sizeInKb}KB`);
  facts.push(`The longest filename is ${longestFilename}`);
  facts.push(`This folder contains ${filesCount} files`);
  facts.push(`File type distribution: ${fileTypeDistribution}`);
  facts.push(`The newest file is ${newestFile}`);
  facts.push(`The oldest file is ${oldestFile}`);
  facts.push(`Average file size is ${averageFileSize}`);

  return facts;
}

function selectRandomFact(facts) {
  const index = Math.floor(Math.random() * facts.length);
  return facts[index];
}

export default function (app, folder) {
  console.log(pluginAssetsPath);
  app.use("/.SNAPSERVE-PLUGIN-ASSETS", express.static(pluginAssetsPath));
  app.get("/", (req, res) => {
    const facts = generateFacts(folder);
    const randomFact = selectRandomFact(facts);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SNAPSERVE WONKA</title>
      </head>
      <body>
        <div style="text-align: center;">
          <img src="/.SNAPSERVE-PLUGIN-ASSETS/wonka.jpg" alt="Wonka" style="width: 256px; height: auto; margin-bottom: 10px;">
          <p>This is an example <a href="https://github.com/cinnabar-forge/snapserve"/>SnapServe</a> mode of serving <code>${folder}</code></p>
          <p><b>Fun Fact</b></br>${randomFact}</p>
        </div>
      </body>
      </html>
    `;

    res.send(htmlContent);
  });
}
