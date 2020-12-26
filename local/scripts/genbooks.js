#!/usr/local/bin/node

const fs = require("fs");
const inputDir = `../data/`;
const outputDir = "../../src/data/";
const meta = require(outputDir + "BibleMetadata.js");

console.log("Begin genbooks.js");

const validLocales = ["en", "zh-CN"];
let globalLocale = "";

const readFileNonEmptyLines = (fileName) => {
  const data = fs.readFileSync(fileName, "utf-8");
  return data.split(/\r?\n/).filter((s) => s.length > 0);
};

const splitFirst = (s, ch) => {
  const i = s.indexOf(ch);
  if (i < 0) throw new Error(`Char '${ch}' missing in '${s}'`);
  return [s.substring(0, i), s.substring(i + 1)];
};

// Same as JSON.stringify(), but avoiding redundant quotes.
// Assume no quotes in the key.
const writeObjectJson = (out, obj, addNewlines = false) => {
  let comma = "";

  out.write(`{`);
  for (const [key, value] of Object.entries(obj)) {
    if (!value) continue;
    if (comma) out.write(comma);
    if (comma && addNewlines) out.write("\n");

    const keyIsVariable = key.match(/^[_a-zA-Z]\w*$/);
    out.write(keyIsVariable ? key : `'${key}'`);

    out.write(`:`);

    const valueStr = value + "";
    const valueIsNumber = valueStr.match(/^\d+$/);
    out.write(valueIsNumber ? valueStr : JSON.stringify(value));

    comma = addNewlines ? "," : ", ";
  }
  out.write(`}`);
};

// Books with only one chapter are linked like "Phm2", so transform them
// to "Phm1:2" (ch=1) so that the refs can link correctly.
const fixOneChapterOnlyBookRefs = (s) => {
  let t = "";
  while (s) {
    const match = s.match(/^([^{]*)\{(\w[a-z][a-z])([^|]*)\|/);
    if (!match) {
      t += s;
      break;
    }
    s = s.slice(match[0].length);
    const prefix = match[1];
    const bkAbbr = match[2];
    const linkSuffix = match[3];

    if (meta.BkOneChapterOnly.has(bkAbbr) && linkSuffix.match(/^\d/)) {
      t += `${prefix}{${bkAbbr}1:${linkSuffix}|`;
    } else {
      t += match[0];
    }
  }
  return t;
};

const writeBookHeader = (writeStreams) => {
  console.log("Writing all book headers...");

  const intros = require(`${inputDir}${globalLocale}/intros.js`);

  for (let bk = 0; bk < meta.BkAbbr.length; bk++) {
    const bkAbbr = meta.BkAbbr[bk];
    const out = writeStreams[bk];

    out.write(
      `BkData['${bkAbbr}'] = {
bigTitle: '${intros.BkBigTitle[bkAbbr]}',
intro: [\n`
    );

    writeIntro(out, bkAbbr);

    out.write(`],
subject: '${intros.BkSubj[bkAbbr]}',\n`);
  }
};

const writeIntro = (out, bkAbbr) => {
  const intros = require(`${inputDir}${globalLocale}/intros.js`);
  const intro = intros.BkIntro[bkAbbr];
  const lines = intro.split("<br>");

  for (const line of lines) {
    // Some intro lines have no header text.
    if (line.match(/^[\w\s]+: /)) {
      const [label, text] = splitFirst(line, ":");
      const t = fixOneChapterOnlyBookRefs(text.slice(1));
      out.write(`['${label}', '${t}'],\n`);
    } else {
      const t = fixOneChapterOnlyBookRefs(line);
      out.write(`['', '${t}'],\n`);
    }
  }
};

const writeBookVerses = (writeStreams) => {
  console.log("Writing all book verses...");

  const verses = readFileNonEmptyLines(`${inputDir}${globalLocale}/verses.txt`);

  let vi = 0;
  for (let bk = 0; bk < meta.BkAbbr.length; bk++) {
    const bkAbbr = meta.BkAbbr[bk];
    const out = writeStreams[bk];
    out.write(`verses: {\n`);

    while (vi < verses.length && verses[vi].startsWith(bkAbbr)) {
      const verse = verses[vi++];
      const [vref, text] = splitFirst(verse, " ");

      out.write(`'${vref.substring(3)}': '${text}',\n`);
    }

    out.write(`},\n`);
  }
};

const writeBookOutlines = (writeStreams) => {
  console.log("Writing all book outlines...");

  const outlines = readFileNonEmptyLines(
    `${inputDir}${globalLocale}/outlines.txt`
  );

  let lastParsed = null;
  let bkAbbr = "";
  let bk = -1;
  let out = null;
  let vref = null;
  let currentBookOutlines = null;

  for (const outline of outlines) {
    const parsed = parseOutline(outline);

    // Make sure the sequence is increasing only.
    if (
      lastParsed &&
      lastParsed.bkAbbr === parsed.bkAbbr &&
      (lastParsed.ch > parsed.ch ||
        (lastParsed.ch === parsed.ch && lastParsed.vn > parsed.vn))
    ) {
      console.error(
        `Outline out of order:\n` +
          `Last: ${JSON.stringify(lastParsed)}\n` +
          `This: ${JSON.stringify(parsed)}`
      );
    }

    // bkAbbr+ch+vn are deleted below, so we have to clone the parsed object.
    lastParsed = { ...parsed };

    if (parsed.bkAbbr != bkAbbr) {
      if (currentBookOutlines) {
        convertOutlineJumpLabels(currentBookOutlines);
        writeOneBookOutlines(out, currentBookOutlines);
      }

      bk++;
      if (bk != meta.BkAbbrNum[parsed.bkAbbr]) {
        throw new Error("Book number out of sync");
      }
      out = writeStreams[bk];
      bkAbbr = meta.BkAbbr[bk];
      vref = "";

      currentBookOutlines = {};
    }

    const thisVref = `${parsed.ch}:${parsed.vn}`;

    delete parsed.bkAbbr;
    delete parsed.ch;
    delete parsed.vn;

    if (!currentBookOutlines[thisVref]) {
      currentBookOutlines[thisVref] = [];
    }
    currentBookOutlines[thisVref].push(parsed);
  }

  writeOneBookOutlines(out, currentBookOutlines);
};

const parseOutline = (outline) => {
  let data = null;
  let match = outline.match(/^Psa(\d+) (\d+) (.*)/);
  if (match) {
    data = {
      bkAbbr: "Psa",
      ch: parseInt(match[1]), // chapter
      vn: -1, // verse
      lv: parseInt(match[2]), // level
      text: match[3],
    };
  } else {
    // TODO - match for "b" verse parts.
    match = outline.match(
      /^((\w+): )?(\[((text)|(outline))\]\s+)?(\w\w\w)(\d+):(\d+)(b)?\s+(\d+)\s+(\S.*\S)$/
    );
    if (match) {
      data = {
        bkAbbr: match[7],
        ch: parseInt(match[8]),
        vn: parseInt(match[9]),
        lv: parseInt(match[11]),
        text: match[12],
      };

      if (match[2]) data.label = match[2]; // label
      if (match[10]) data.b = 1; // part b of verse

      if (match[3]) data.type = match[5] ? "TEXT" : "OUTLINE";
    }
  }

  if (!data) {
    throw new Error(`Bad outline: ${outline}`);
  }

  // Check for parens.
  if (data.text[0] === "(" && data.text[data.text.length - 1] === ")") {
    data.text = data.text.substring(1, data.text.length - 1);
    data.parens = 1;
  }

  // Get vref if any.
  const pipeIndex = data.text.indexOf("|");
  if (pipeIndex > 0) {
    data.vrefs = data.text.substring(pipeIndex + 1);
    data.text = data.text.substring(0, pipeIndex);
  }

  // Get outline numeral (point).
  match = data.text.match(/^(\S+\.) (\S.*)$/);
  if (match) {
    data.pt = match[1]; // point
    data.text = match[2];
  } else {
    match = data.text.match(/^(\(\S+\)) (\S.*)$/);
    if (match) {
      data.pt = match[1];
      data.text = match[2];
    }
  }

  return data;
};

const convertOutlineJumpLabels = (outlines) => {
  // Collect all labels.
  const labelToAllOutlinesRef = {};
  const labelToTextRef = {};

  for (const [vref, verseOutlines] of Object.entries(outlines)) {
    let serialNumber = 0;
    for (const outline of verseOutlines) {
      serialNumber++;
      if (!outline.label) continue;

      if (outline.type !== "TEXT") {
        labelToAllOutlinesRef[outline.label] = `${vref}o${serialNumber}`;
      }

      if (outline.type !== "OUTLINE") {
        labelToTextRef[outline.label] = `${vref}o${serialNumber}`;
      }
    }
  }

  for (const verseOutlines of Object.values(outlines)) {
    let serialNumber = 0;
    for (const outline of verseOutlines) {
      serialNumber++;
      if (!outline.label) continue;

      if (outline.type !== "TEXT") {
        if (!labelToTextRef[outline.label]) {
          console.error(
            `Outline label "${
              outline.label
            }" has no jump ref to text: ${JSON.stringify(outline)}`
          );
        }
        outline.jumpToText = labelToTextRef[outline.label];
      }

      if (outline.type !== "OUTLINE") {
        if (!labelToAllOutlinesRef[outline.label]) {
          console.error(
            `Outline label "${
              outline.label
            }" has no jump ref to all outlines: ${JSON.stringify(outline)}`
          );
        }
        outline.jumpToAllOutlines = labelToAllOutlinesRef[outline.label];
      }
    }
  }
};

const writeOneBookOutlines = (out, outlines) => {
  out.write(`outlines: {\n`);

  for (const [vref, verseOutlines] of Object.entries(outlines)) {
    out.write(`'${vref}': [\n`);

    for (const outline of verseOutlines) {
      writeObjectJson(out, outline);
      out.write(`,\n`);
    }

    out.write(`],\n`);
  }

  out.write(`},\n`);
};

const writeNotesRefs = (writeStreams) => {
  console.log("Writing all book notes and refs...");

  const notesRefs = readFileNonEmptyLines(
    `${inputDir}${globalLocale}/notesrefs.txt`
  );

  let lastBkAbbr = "";
  let bk = -1;
  let out = null;
  let lastVref = "";

  for (const nr of notesRefs) {
    const match = nr.match(/^(\w\w\w)(\d+):(\d+)\^(\S+)\s+(\S.*)$/);
    if (!match) throw new Error(`Bad note/ref: ${nr}`);

    const [, bkAbbr, ch, vn, sup, text] = match;
    if (lastBkAbbr != bkAbbr) {
      if (lastVref) out.write(`],\n`);
      if (lastBkAbbr) out.write(`},\n`);
      lastVref = "";

      bk++;
      if (bk != meta.BkAbbrNum[bkAbbr]) {
        throw new Error("Book number out of sync");
      }

      out = writeStreams[bk];
      lastBkAbbr = bkAbbr;

      out.write(`notesRefs: {\n`);
    }

    const vref = ch + ":" + vn;
    if (lastVref !== vref) {
      if (lastVref) out.write("],\n");
      lastVref = vref;
      out.write(`'${vref}': [\n`);
    }

    // Break up text.
    const data = { sup };

    if (globalLocale === "en") {
      if (text.includes("<br>")) {
        // Has footnote text.
        const a = text.split("<br>");
        if (a[0].includes(" ")) {
          // Has vrefs.
          [data.word, data.vrefs] = splitFirst(a[0], " ");
        } else {
          data.word = a[0];
        }

        if (a.length > 1) {
          data.lines = a.slice(1).map(fixOneChapterOnlyBookRefs);
        }
      } else {
        // Only has vrefs.
        [data.word, data.vrefs] = splitFirst(text, " ");
      }
    } else {
      data.word = "";
      data.vrefs = "";
      data.lines = text.split("<br>");
    }

    writeObjectJson(out, data);
    out.write(`,\n`);
  }

  out.write("],\n");
  out.write(`},\n`);
};

const writePsalmTitles = (out) => {
  console.log("Writing all Psalm titles...");

  const psaTitles = readFileNonEmptyLines(
    `${inputDir}${globalLocale}/psa_titles.txt`
  );

  // File is split into 3 sections:
  // 1. Chapter titles.
  // 2. Verse insert headers.
  // 3. Chapter title notes and refs
  const chTitle = {};
  let i = 0;
  while (i < psaTitles.length) {
    const line = psaTitles[i++];
    if (line == "VVINSERTS") break;

    // Psalm titles.
    const match = line.match(/^(\d+):Title\s+(\S.*\S)$/);
    if (!match) {
      throw new Error(`Bad psalm vv insert: ${line}`);
    }
    const [, ch, title] = match;
    chTitle[ch] = title;
  }

  writeObjectEntries(out, "chTitle", chTitle);

  const vvInsert = {};
  while (i < psaTitles.length) {
    const line = psaTitles[i++];
    if (line == "NOTES") break;
    if (!line) continue;

    // Inserted text.
    const match = line.match(/^x(\d+:\d+)\s+(\S.*\S)$/);
    if (!match) {
      throw new Error(`Bad psalm insert data: ${line}`);
    }
    const [, chvn, title] = match;
    vvInsert[chvn] = title;
  }

  writeObjectEntries(out, "vvInsert", vvInsert);

  // File continues with list of all title footnotes and cross-refs.
  out.write(`chTitleNote: {\n`);
  let lastCh = "";

  while (i < psaTitles.length) {
    const line = psaTitles[i++];
    if (!line) continue;

    const match = line.match(/^(\d+):Title (\S+) (\S.*)$/);
    if (!match) {
      throw new Error(`Bad psalm title note: ${line}`);
    }

    const [, ch, sup, rest] = match;

    let word = "";
    let vrefs = "";
    let text = "";

    const m = rest.match(/^(\S+?)<br>(.+)$/);
    if (m) {
      word = m[1];
      text = m[2];
    } else {
      const m1 = rest.match(/^(\S+?) (\S.*?)(<br>(\S.*))?$/);
      if (m1) {
        word = m1[1];
        vrefs = m1[2];
        text = m1[4];
      } else {
        text = rest;
      }
    }

    if (ch != lastCh) {
      if (lastCh) out.write("],\n");
      out.write(`'${ch}': [\n`);
      lastCh = ch;
    }

    writeObjectJson(out, { sup, word, vrefs, text });
    out.write(`,\n`);
  }

  out.write(`],\n},\n`);
};

const writeObjectEntries = (out, name, obj) => {
  out.write(`${name}: `);
  writeObjectJson(out, obj, true);
  out.write(`,\n`);
};

const writeBookEnd = (writeStreams) => {
  for (const out of writeStreams) {
    out.end("};");
  }
};

const main = () => {
  // Must specify locale as program argument.
  const userArgs = process.argv.slice(2);
  if (userArgs.length < 1) {
    console.error(`Usage: node genbooks.js [locale...]`);
    console.error(`Valid locales are: ${JSON.stringify(validLocales)}`);
    process.exit(1);
  }

  if (userArgs.some((locale) => !validLocales.includes(locale))) {
    console.error(`Invalid locale(s): ${JSON.stringify(userArgs)}`);
    console.error(`Valid locales are: ${JSON.stringify(validLocales)}`);
    process.exit(2);
  }

  for (const locale of userArgs) {
    // Set one global variable rather than passing it everywhere.
    globalLocale = locale;

    // Open all output files for writing.
    const writeStreams = [];
    for (const bkAbbr of meta.BkAbbr) {
      writeStreams.push(
        fs.createWriteStream(`${outputDir}${locale}/books/${bkAbbr}.js`)
      );
    }

    // Write to all files using data from input files.
    writeBookHeader(writeStreams);
    writeBookVerses(writeStreams);
    writeBookOutlines(writeStreams);
    writeNotesRefs(writeStreams);
    writePsalmTitles(writeStreams[meta.BkAbbrNum["Psa"]]);
    writeBookEnd(writeStreams);
  }
};

main();

console.log("End genbooks.js");
