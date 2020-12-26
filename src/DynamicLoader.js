// DynamicLoader.js

// Load files from CDNs or fallback to local file.
// 1. CDN - speeds up online page load performance.
// 2. Local fallback - allow all pages to work offline.

// Usage:
// DynamicLoader.load('lib1', ['url1.1', 'url1.2']);
// DynamicLoader.load('lib2', 'url2');
// DynamicLoader.load('lib3', ['url3.1', 'url3.2'], 'lib1');
// DynamicLoader.load('lib4', 'url4', ['lib1', 'lib2']);
const DynamicLoader = (function() {
  const DEBUG = 0;

  // Check to make sure library names in the dependencies are valid.
  const libraryNames = new Set();

  // Don't load libraries more than once.
  const loadedLibraries = new Set();

  // Libraries that will be loaded later due to dependencies.
  const pendingLibraries = new Map();

  function debug(message) {
    if (DEBUG) {
      console.debug(`[DynamicLoader] DEBUG ${message}`);
    }
  }

  function info(message) {
    console.log(`[DynamicLoader] INFO ${message}`);
  }

  function warn(message) {
    console.warn(`[DynamicLoader] WARN ${message}`);
  }

  function error(message) {
    console.error(`[DynamicLoader] ERROR ${message}`);
  }

  function isLoaded(libraryName) {
    return loadedLibraries.has(libraryName);
  }

  function checkAndMarkLoading(libraryName) {
    const isLoading = libraryNames.has(libraryName);
    if (!isLoading) {
      libraryNames.add(libraryName);
    }
    return isLoading;
  }

  function wrapAsArray(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  // Options: {
  //   name: string (required)
  //   hrefs: string or array of strings (required)
  //   dependsOn: string or array of strings (optional)
  // }
  function load(options) {
    if (Array.isArray(options)) {
      return options.forEach(option => load(option));
    }

    if (!options.name) {
      return error('Missing "name" property in ' + JSON.stringify(options));
    }
    if (!options.hrefs) {
      return error('Missing "hrefs" property in ' + JSON.stringify(options));
    }

    for (const key in options) {
      if (key !== 'name' && key !== 'hrefs' && key !== 'dependsOn') {
        return error(`Unknown option "${key}" in ` + JSON.stringify(options));
      }
    }

    if (checkAndMarkLoading(options.name)) return;

    checkLoadFilesFirst(options);
    loadInternal(options.name, options.hrefs, options.dependsOn);
  }

    // If we are in local file mode (dev mode), then load local files first (faster).
    function checkLoadFilesFirst(options) {
    if (Array.isArray(options.hrefs) && options.hrefs.length > 1 && location.protocol === 'file:') {
      const hrefs = [];
      for (const href of options.hrefs) {
        if (href.toLocaleLowerCase().startsWith('http')) {
          hrefs.push(href);
        } else {
          hrefs.unshift(href);
        }
      }
      options.hrefs = hrefs;

      debug(`Reordered hrefs to load local files first: ${JSON.stringify(hrefs)}`);
    }
  }

  function loadInternal(libraryName, tryHrefs, dependsOn) {
    tryHrefs = wrapAsArray(tryHrefs);

    // If we have any unloaded dependencies, add it to the pending list.
    if (dependsOn) {
      dependsOn = wrapAsArray(dependsOn);
      for (const depName of dependsOn) {
        if (!libraryNames.has(depName)) {
          return error(`Unknown dependency "${depName}".` +
            ` Please call load('${depName}', ...) before calling load('${libraryName}', ...).`);
        }
        if (!isLoaded(depName)) {
          return pendingLibraries.set(libraryName, { tryHrefs, dependsOn });
        }
      }
    }

    // Load this library since the dependencies have already been satisfied.
    debug(`Start loading ${libraryName}`);
    const url = tryHrefs[0];
    let element;

    if (url.endsWith(".css") || url.toLocaleLowerCase().endsWith(".css")) {
      element = document.createElement("link");
      element.rel = "stylesheet";
      element.href = url;
    } else { // assume JS file
      element = document.createElement("script");
      element.src = url;
    }

    element.onload = () => {
      debug(`Loaded ${libraryName} from ${url}`);
      loadedLibraries.add(libraryName);

      // Continue loading libraries that depend on this one, if any.
      continueLoading();
    };

    // Log error and try loading next url.
    element.onerror = () => {
      warn(`Failed to load ${libraryName}: ${url}`);

      if (tryHrefs.length > 1) {
        // No need to check dependencies anymore since it was already satisfied.
        loadInternal(libraryName, tryHrefs.slice(1));
      } else {
        error(`Failed to load ${libraryName} from all sources.`);
      }
    };

    document.head.appendChild(element);
  }

  function continueLoading() {
    const readyLibs = [];

    for (const [
      libraryName,
      loadingInfo,
    ] of pendingLibraries.entries()) {
      // If all dependencies have now been satisfied, then load it now.
      let allDependenciesLoaded = true;
      for (const depName of loadingInfo.dependsOn) {
        if (!isLoaded(depName)) {
          debug(`Dependency ${depName} for ${libraryName} not loaded yet.`);
          allDependenciesLoaded = false;
          break;
        }
      }
      if (allDependenciesLoaded) {
        readyLibs.push([libraryName, loadingInfo.tryHrefs]);
      }
    }

    if (readyLibs.length === 0) return;

    // Remove pending libraries to avoid processing them again.
    for (const [libraryName] of readyLibs) {
      pendingLibraries.delete(libraryName);
    }

    // Load all ready libraries.
    for (const [libName, tryHrefs] of readyLibs) {
      loadInternal(libName, tryHrefs);
    }
  }

  // Exports.
  return {load};
})();
