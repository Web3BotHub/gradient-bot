"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runfiles = exports._BAZEL_OUT_REGEX = exports.Runfiles = void 0;
const runfiles_1 = require("./runfiles");
Object.defineProperty(exports, "Runfiles", { enumerable: true, get: function () { return runfiles_1.Runfiles; } });
const paths_1 = require("./paths");
Object.defineProperty(exports, "_BAZEL_OUT_REGEX", { enumerable: true, get: function () { return paths_1.BAZEL_OUT_REGEX; } });
/** Instance of the runfile helpers. */
exports.runfiles = new runfiles_1.Runfiles(process.env);
