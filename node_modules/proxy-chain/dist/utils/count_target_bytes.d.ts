import net from 'net';
type Stats = {
    bytesWritten: number | null;
    bytesRead: number | null;
};
export declare const countTargetBytes: (source: net.Socket, target: net.Socket) => void;
export declare const getTargetStats: (socket: net.Socket) => Stats;
export {};
//# sourceMappingURL=count_target_bytes.d.ts.map