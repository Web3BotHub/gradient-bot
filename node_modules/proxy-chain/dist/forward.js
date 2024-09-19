"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forward = void 0;
const tslib_1 = require("tslib");
const http_1 = tslib_1.__importDefault(require("http"));
const https_1 = tslib_1.__importDefault(require("https"));
const stream_1 = tslib_1.__importDefault(require("stream"));
const util_1 = tslib_1.__importDefault(require("util"));
const valid_headers_only_1 = require("./utils/valid_headers_only");
const get_basic_1 = require("./utils/get_basic");
const count_target_bytes_1 = require("./utils/count_target_bytes");
const statuses_1 = require("./statuses");
const pipeline = util_1.default.promisify(stream_1.default.pipeline);
/**
 * The request is read from the client and is resent.
 * This is similar to Direct / Chain, however it uses the CONNECT protocol instead.
 * Forward uses standard HTTP methods.
 *
 * ```
 * Client -> Apify (HTTP) -> Web
 * Client <- Apify (HTTP) <- Web
 * ```
 *
 * or
 *
 * ```
 * Client -> Apify (HTTP) -> Upstream (HTTP) -> Web
 * Client <- Apify (HTTP) <- Upstream (HTTP) <- Web
 * ```
 */
const forward = async (request, response, handlerOpts) => new Promise(async (resolve, reject) => {
    const proxy = handlerOpts.upstreamProxyUrlParsed;
    const origin = proxy ? proxy.origin : request.url;
    const options = {
        method: request.method,
        headers: (0, valid_headers_only_1.validHeadersOnly)(request.rawHeaders),
        insecureHTTPParser: true,
        localAddress: handlerOpts.localAddress,
        family: handlerOpts.ipFamily,
        lookup: handlerOpts.dnsLookup,
    };
    // In case of proxy the path needs to be an absolute URL
    if (proxy) {
        options.path = request.url;
        try {
            if (proxy.username || proxy.password) {
                options.headers.push('proxy-authorization', (0, get_basic_1.getBasicAuthorizationHeader)(proxy));
            }
        }
        catch (error) {
            reject(error);
            return;
        }
    }
    const fn = origin.startsWith('https:') ? https_1.default.request : http_1.default.request;
    // We have to force cast `options` because @types/node doesn't support an array.
    const client = fn(origin, options, async (clientResponse) => {
        try {
            // This is necessary to prevent Node.js throwing an error
            let statusCode = clientResponse.statusCode;
            if (statusCode < 100 || statusCode > 999) {
                statusCode = statuses_1.badGatewayStatusCodes.STATUS_CODE_OUT_OF_RANGE;
            }
            // 407 is handled separately
            if (clientResponse.statusCode === 407) {
                reject(new Error('407 Proxy Authentication Required'));
                return;
            }
            response.writeHead(statusCode, clientResponse.statusMessage, (0, valid_headers_only_1.validHeadersOnly)(clientResponse.rawHeaders));
            // `pipeline` automatically handles all the events and data
            await pipeline(clientResponse, response);
            resolve();
        }
        catch {
            // Client error, pipeline already destroys the streams, ignore.
            resolve();
        }
    });
    client.once('socket', (socket) => {
        (0, count_target_bytes_1.countTargetBytes)(request.socket, socket);
    });
    // Can't use pipeline here as it automatically destroys the streams
    request.pipe(client);
    client.on('error', (error) => {
        var _a;
        if (response.headersSent) {
            return;
        }
        const statusCode = (_a = statuses_1.errorCodeToStatusCode[error.code]) !== null && _a !== void 0 ? _a : statuses_1.badGatewayStatusCodes.GENERIC_ERROR;
        response.statusCode = !proxy && error.code === 'ENOTFOUND' ? 404 : statusCode;
        response.setHeader('content-type', 'text/plain; charset=utf-8');
        response.end(http_1.default.STATUS_CODES[response.statusCode]);
        resolve();
    });
});
exports.forward = forward;
//# sourceMappingURL=forward.js.map