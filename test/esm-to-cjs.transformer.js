/**
 * Jest transformer for ESM-only dependencies shipped as `.mjs`
 * (e.g. @thallesp/nestjs-better-auth). TypeScript always emits ESM for `.mjs` files, so
 * the source is transpiled as if it were a `.js` file with module=CommonJS.
 */
const ts = require('typescript');

module.exports = {
  process(sourceText) {
    // import.meta is a syntax error once the module is CommonJS.
    const source = sourceText.replace(
      /import\.meta\.url/g,
      "require('url').pathToFileURL(__filename).href",
    );
    const { outputText } = ts.transpileModule(source, {
      fileName: 'esm-dependency.js',
      compilerOptions: {
        allowJs: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });
    return { code: outputText };
  },
};
