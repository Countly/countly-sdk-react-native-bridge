#!/usr/bin/env node
/**
 * Fails the build when the typings (Countly.d.ts) and the public API record (api/countly-sdk-react-native-bridge.api)
 * name different members. The record is what the SDK exposes at runtime; the Public API workflow keeps it current.
 *
 *   node .github/scripts/check_typings.cjs
 *
 * A member the record has and the typings lack stops a TypeScript app from calling it ("Property does not exist").
 * A member the typings have and the record lacks compiles, and then fails in the app ("is not a function").
 * .github/typings-allowlist.txt lists deliberate differences, one "<path> <reason>" per line.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..", "..");
const RECORD = "api/countly-sdk-react-native-bridge.api";
const ALLOWLIST = ".github/typings-allowlist.txt";
// The same depth the public API dump walks to.
const MAX_DEPTH = 4;

/**
 * Returns the member paths of the record, without their kinds.
 * @returns {Set<string>} paths such as "Countly.events.recordEvent"
 */
function recordedPaths() {
    const lines = fs.readFileSync(path.join(ROOT, RECORD), "utf8").split(/\r?\n/).filter(Boolean);
    return new Set(lines.map((line) => line.split(" ")[0]));
}

/**
 * Returns the deliberate differences between the typings and the record.
 * @returns {Map<string, string>} path to reason
 */
function allowlist() {
    const file = path.join(ROOT, ALLOWLIST);
    const entries = new Map();
    if (!fs.existsSync(file)) {
        return entries;
    }
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const space = trimmed.indexOf(" ");
            entries.set(space < 0 ? trimmed : trimmed.slice(0, space), space < 0 ? "" : trimmed.slice(space + 1));
        }
    }
    return entries;
}

/**
 * Compiles the typings with a file that imports the package the way an app does.
 * @param {string} packageName the name in package.json, which the typings declare their modules under
 * @returns {{checker: ts.TypeChecker, entry: ts.SourceFile}} the type checker and the importing file
 */
function compile(packageName) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "countly-typings-"));
    const entryPath = path.join(dir, "entry.ts");
    fs.writeFileSync(entryPath, `import Countly from "${packageName}";\nimport CountlyConfig from "${packageName}/CountlyConfig";\nexport { Countly, CountlyConfig };\n`);
    const program = ts.createProgram([path.join(ROOT, "Countly.d.ts"), entryPath], {
        strict: true,
        noEmit: true,
        types: [],
        lib: ["lib.es2020.d.ts"],
    });
    const errors = ts.getPreEmitDiagnostics(program);
    if (errors.length > 0) {
        for (const error of errors) {
            console.log(`::error::${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`);
        }
        process.exit(1);
    }
    return { checker: program.getTypeChecker(), entry: program.getSourceFile(entryPath) };
}

/**
 * Adds the path of a type and, for object types, of each member below it, the way the public API dump walks a value.
 * @param {ts.TypeChecker} checker the type checker
 * @param {ts.Node} anchor a node the member types are resolved at
 * @param {ts.Type} type the type at path
 * @param {string} at the dotted path that reaches the type
 * @param {Set<string>} paths the paths collected so far
 * @param {number} depth how many members deep the type is
 */
function describeType(checker, anchor, type, at, paths, depth) {
    paths.add(at);
    const isObject = (type.flags & ts.TypeFlags.Object) !== 0;
    if (!isObject || depth >= MAX_DEPTH || type.getCallSignatures().length > 0 || checker.isArrayType(type)) {
        return;
    }
    for (const member of checker.getPropertiesOfType(type)) {
        const name = member.getName();
        if (!name.startsWith("_") && name !== "prototype") {
            describeType(checker, anchor, checker.getTypeOfSymbolAtLocation(member, anchor), `${at}.${name}`, paths, depth + 1);
        }
    }
}

/**
 * Returns the member paths the typings declare for the default export of the package and for CountlyConfig.
 * @param {string} packageName the name in package.json
 * @returns {Set<string>} paths in the format of the record
 */
function typedPaths(packageName) {
    const { checker, entry } = compile(packageName);
    const paths = new Set();
    for (const statement of entry.statements) {
        if (!ts.isImportDeclaration(statement) || !statement.importClause || !statement.importClause.name) {
            continue;
        }
        const name = statement.importClause.name;
        const symbol = checker.getAliasedSymbol(checker.getSymbolAtLocation(name));
        const type = checker.getTypeOfSymbolAtLocation(symbol, name);
        if (type.getConstructSignatures().length > 0) {
            paths.add(name.text);
            for (const member of checker.getPropertiesOfType(type)) {
                if (member.getName() !== "prototype" && !member.getName().startsWith("_")) {
                    paths.add(`${name.text}.${member.getName()}`);
                }
            }
            for (const member of checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))) {
                if (!member.getName().startsWith("_")) {
                    paths.add(`${name.text}.prototype.${member.getName()}`);
                }
            }
        } else {
            describeType(checker, name, type, name.text, paths, 0);
        }
    }
    return paths;
}

/** Compares the typings with the record and exits non-zero on an unlisted difference. */
function main() {
    const packageName = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).name;
    const recorded = recordedPaths();
    const typed = typedPaths(packageName);
    const allowed = allowlist();
    const problems = [];
    for (const member of [...recorded].sort()) {
        if (!typed.has(member) && !allowed.has(member)) {
            problems.push(`${member} exists at runtime, but Countly.d.ts does not declare it: TypeScript apps cannot call it.`);
        }
    }
    for (const member of [...typed].sort()) {
        if (!recorded.has(member) && !allowed.has(member)) {
            problems.push(`${member} is declared in Countly.d.ts, but does not exist at runtime: apps that call it fail.`);
        }
    }
    for (const member of [...allowed.keys()].sort()) {
        if (recorded.has(member) === typed.has(member)) {
            problems.push(`${member} is in ${ALLOWLIST}, but the typings and the record agree on it now: remove the line.`);
        }
    }
    console.log(`${recorded.size} members in ${RECORD}, ${typed.size} declared in Countly.d.ts, ${allowed.size} listed in ${ALLOWLIST}.`);
    if (problems.length > 0) {
        for (const problem of problems) {
            console.log(`::error file=Countly.d.ts::${problem}`);
        }
        process.exit(1);
    }
    console.log("The typings declare every member the SDK exposes, and nothing more.");
}

main();
