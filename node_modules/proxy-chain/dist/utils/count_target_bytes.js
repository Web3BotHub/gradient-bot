"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTargetStats = exports.countTargetBytes = void 0;
const targetBytesWritten = Symbol('targetBytesWritten');
const targetBytesRead = Symbol('targetBytesRead');
const targets = Symbol('targets');
const calculateTargetStats = Symbol('calculateTargetStats');
// @ts-expect-error TS is not aware that `source` is used in the assertion.
// eslint-disable-next-line @typescript-eslint/no-empty-function
function typeSocket(source) { }
;
const countTargetBytes = (source, target) => {
    typeSocket(source);
    source[targetBytesWritten] = source[targetBytesWritten] || 0;
    source[targetBytesRead] = source[targetBytesRead] || 0;
    source[targets] = source[targets] || new Set();
    source[targets].add(target);
    target.once('close', () => {
        source[targetBytesWritten] += target.bytesWritten;
        source[targetBytesRead] += target.bytesRead;
        source[targets].delete(target);
    });
    if (!source[calculateTargetStats]) {
        source[calculateTargetStats] = () => {
            let bytesWritten = source[targetBytesWritten];
            let bytesRead = source[targetBytesRead];
            for (const socket of source[targets]) {
                bytesWritten += socket.bytesWritten;
                bytesRead += socket.bytesRead;
            }
            return {
                bytesWritten,
                bytesRead,
            };
        };
    }
};
exports.countTargetBytes = countTargetBytes;
const getTargetStats = (socket) => {
    typeSocket(socket);
    if (socket[calculateTargetStats]) {
        return socket[calculateTargetStats]();
    }
    return {
        bytesWritten: null,
        bytesRead: null,
    };
};
exports.getTargetStats = getTargetStats;
//# sourceMappingURL=count_target_bytes.js.map