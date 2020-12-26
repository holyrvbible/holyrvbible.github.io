if (typeof BookNames === "undefined") BookNames = {};

BookNames["en"] = (function () {
  const BkShort = [
    "Gen",
    "Exo",
    "Lev",
    "Num",
    "Deu",
    "Jos",
    "Jdg",
    "Rut",
    "1Sa",
    "2Sa",
    "1Ki",
    "2Ki",
    "1Ch",
    "2Ch",
    "Ezr",
    "Neh",
    "Est",
    "Job",
    "Psa",
    "Prv",
    "Ecc",
    "SoS",
    "Isa",
    "Jer",
    "Lam",
    "Ezk",
    "Dan",
    "Hos",
    "Joe",
    "Amo",
    "Oba",
    "Jon",
    "Mic",
    "Nah",
    "Hab",
    "Zep",
    "Hag",
    "Zec",
    "Mal",
    "Mat",
    "Mrk",
    "Luk",
    "Joh",
    "Act",
    "Rom",
    "1Co",
    "2Co",
    "Gal",
    "Eph",
    "Phi",
    "Col",
    "1Th",
    "2Th",
    "1Ti",
    "2Ti",
    "Tit",
    "Phm",
    "Heb",
    "Jam",
    "1Pe",
    "2Pe",
    "1Jo",
    "2Jo",
    "3Jo",
    "Jud",
    "Rev",
  ];
    
  const BkRef = [
    "Gen.",
    "Exo.",
    "Lev.",
    "Num.",
    "Deut.",
    "Josh.",
    "Judg.",
    "Ruth",
    "1 Sam.",
    "2 Sam.",
    "1 Kings",
    "2 Kings",
    "1 Chron.",
    "2 Chron.",
    "Ezra",
    "Neh.",
    "Esth.",
    "Job",
    "Psa.",
    "Prov.",
    "Eccl.",
    "S. S.",
    "Isa.",
    "Jer.",
    "Lam.",
    "Ezek.",
    "Dan.",
    "Hosea",
    "Joel",
    "Amos",
    "Oba.",
    "Jonah",
    "Micah",
    "Nahum",
    "Hab.",
    "Zeph.",
    "Hag.",
    "Zech.",
    "Mal.",
    "Matt.",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Rom.",
    "1 Cor.",
    "2 Cor.",
    "Gal.",
    "Eph.",
    "Phil.",
    "Col.",
    "1 Thes.",
    "2 Thes.",
    "1 Tim.",
    "2 Tim.",
    "Titus",
    "Philem.",
    "Heb.",
    "James",
    "1 Pet.",
    "2 Pet.",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Rev.",
  ];
  
  const BkName = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Songs",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation",
  ];
  
  // Returns a nicer name than `1 Peter', i.e. `First Peter'.
  function getBkLongName(name) {
    const c = name.charAt(0);
    if (c == "1") return "First" + name.substring(1);
    if (c == "2") return "Second" + name.substring(1);
    if (c == "3") return "Third" + name.substring(1);
    return name;
  }
  
  const BkLongName = BkName.map((name) => getBkLongName(name));

  // Exports.
  return { BkShort, BkRef, BkName, BkLongName };
})();
