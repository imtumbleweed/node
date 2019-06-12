declare class Hasher {
    constructor(size?: 224 | 256 | 384 | 512);

    update(data: Buffer): this;
    update(data: string, encoding?: BufferEncoding): this;

    digest(): Buffer;
    digest(encoding: "binary"): Buffer;
    digest(encoding: BufferEncoding): string;

    reset(): this;
}

export class SHA3 extends Hasher {
    static SHA3Hash: typeof Hasher;
}

export const SHA3Hash: typeof Hasher;

export const Keccak: typeof Hasher;

export default SHA3;
