/// <reference types="node" />
/// <reference types="node" />
import type net from 'net';
import type tls from 'tls';
type AdditionalProps = {
    proxyChainId?: number;
};
export type Socket = net.Socket & AdditionalProps;
export type TLSSocket = tls.TLSSocket & AdditionalProps;
export {};
//# sourceMappingURL=socket.d.ts.map