"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BAZEL_OUT_REGEX = void 0;
// NB: on windows thanks to legacy 8-character path segments it might be like
// c:/b/ojvxx6nx/execroot/build_~1/bazel-~1/x64_wi~1/bin/internal/npm_in~1/test
exports.BAZEL_OUT_REGEX = /(\/bazel-out\/|\/bazel-~1\/x64_wi~1\/)/;
