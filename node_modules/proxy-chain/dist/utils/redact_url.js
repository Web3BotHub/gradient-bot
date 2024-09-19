"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactUrl = void 0;
const url_1 = require("url");
const redactUrl = (url, passwordReplacement = '<redacted>') => {
    if (typeof url !== 'object') {
        url = new url_1.URL(url);
    }
    if (url.password) {
        return url.href.replace(`:${url.password}`, `:${passwordReplacement}`);
    }
    return url.href;
};
exports.redactUrl = redactUrl;
//# sourceMappingURL=redact_url.js.map