"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validHeadersOnly = void 0;
const http_1 = require("http");
const is_hop_by_hop_header_1 = require("./is_hop_by_hop_header");
/**
 * @see https://nodejs.org/api/http.html#http_message_rawheaders
 */
const validHeadersOnly = (rawHeaders) => {
    const result = [];
    let containsHost = false;
    for (let i = 0; i < rawHeaders.length; i += 2) {
        const name = rawHeaders[i];
        const value = rawHeaders[i + 1];
        try {
            (0, http_1.validateHeaderName)(name);
            (0, http_1.validateHeaderValue)(name, value);
        }
        catch (error) {
            // eslint-disable-next-line no-continue
            continue;
        }
        if ((0, is_hop_by_hop_header_1.isHopByHopHeader)(name)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        if (name.toLowerCase() === 'host') {
            if (containsHost) {
                // eslint-disable-next-line no-continue
                continue;
            }
            containsHost = true;
        }
        result.push(name, value);
    }
    return result;
};
exports.validHeadersOnly = validHeadersOnly;
//# sourceMappingURL=valid_headers_only.js.map