import { Buffer } from "node:buffer";
const MAX_PROTOBUF_GROUP_DEPTH = 64;
export function decodeHandshakeMessage(data) {
    const reader = new ProtoReader(data);
    const message = {};
    while (!reader.done()) {
        const tag = reader.tag();
        const field = tag >>> 3;
        if (field === 2) {
            requireBytesWireType(tag, field);
            message.clientHello = {
                ...message.clientHello,
                ...decodeClientHello(reader.bytes()),
            };
        }
        else if (field === 3) {
            requireBytesWireType(tag, field);
            message.serverHello = {
                ...message.serverHello,
                ...decodeServerHello(reader.bytes()),
            };
        }
        else if (field === 4) {
            requireBytesWireType(tag, field);
            message.clientFinish = {
                ...message.clientFinish,
                ...decodeClientFinish(reader.bytes()),
            };
        }
        else {
            reader.skip(field, tag & 7);
        }
    }
    return message;
}
export function encodeHandshakeMessage(message) {
    const writer = new ProtoWriter();
    if (message.clientHello) {
        writer.bytesField(2, encodeClientHello(message.clientHello));
    }
    if (message.serverHello) {
        writer.bytesField(3, encodeServerHello(message.serverHello));
    }
    if (message.clientFinish) {
        writer.bytesField(4, encodeClientFinish(message.clientFinish));
    }
    return writer.finish();
}
function decodeClientHello(data) {
    const reader = new ProtoReader(data);
    let ephemeral;
    let extendedCiphertext;
    let payload;
    let staticKey;
    let useExtended;
    while (!reader.done()) {
        const tag = reader.tag();
        const field = tag >>> 3;
        if (field === 1) {
            requireBytesWireType(tag, field);
            ephemeral = reader.bytes();
        }
        else if (field === 2) {
            requireBytesWireType(tag, field);
            staticKey = reader.bytes();
        }
        else if (field === 3) {
            requireBytesWireType(tag, field);
            payload = reader.bytes();
        }
        else if (field === 4) {
            requireVarintWireType(tag, field);
            useExtended = reader.uint32() !== 0;
        }
        else if (field === 5) {
            requireBytesWireType(tag, field);
            extendedCiphertext = reader.bytes();
        }
        else {
            reader.skip(field, tag & 7);
        }
    }
    return {
        ...(ephemeral === undefined ? {} : { ephemeral }),
        ...(extendedCiphertext === undefined ? {} : { extendedCiphertext }),
        ...(payload === undefined ? {} : { payload }),
        ...(staticKey === undefined ? {} : { staticKey }),
        ...(useExtended === undefined ? {} : { useExtended }),
    };
}
function decodeServerHello(data) {
    const reader = new ProtoReader(data);
    let ephemeral;
    let extendedStatic;
    let payload;
    let staticKey;
    while (!reader.done()) {
        const tag = reader.tag();
        const field = tag >>> 3;
        if (field === 1) {
            requireBytesWireType(tag, field);
            ephemeral = reader.bytes();
        }
        else if (field === 2) {
            requireBytesWireType(tag, field);
            staticKey = reader.bytes();
        }
        else if (field === 3) {
            requireBytesWireType(tag, field);
            payload = reader.bytes();
        }
        else if (field === 4) {
            requireBytesWireType(tag, field);
            extendedStatic = reader.bytes();
        }
        else {
            reader.skip(field, tag & 7);
        }
    }
    return {
        ...(ephemeral === undefined ? {} : { ephemeral }),
        ...(extendedStatic === undefined ? {} : { extendedStatic }),
        ...(payload === undefined ? {} : { payload }),
        ...(staticKey === undefined ? {} : { staticKey }),
    };
}
function decodeClientFinish(data) {
    const reader = new ProtoReader(data);
    let extendedCiphertext;
    let payload;
    let staticKey;
    while (!reader.done()) {
        const tag = reader.tag();
        const field = tag >>> 3;
        if (field === 1) {
            requireBytesWireType(tag, field);
            staticKey = reader.bytes();
        }
        else if (field === 2) {
            requireBytesWireType(tag, field);
            payload = reader.bytes();
        }
        else if (field === 3) {
            requireBytesWireType(tag, field);
            extendedCiphertext = reader.bytes();
        }
        else {
            reader.skip(field, tag & 7);
        }
    }
    return {
        ...(extendedCiphertext === undefined ? {} : { extendedCiphertext }),
        ...(payload === undefined ? {} : { payload }),
        ...(staticKey === undefined ? {} : { staticKey }),
    };
}
function encodeClientHello(clientHello) {
    const writer = new ProtoWriter();
    if (clientHello.ephemeral !== undefined) {
        writer.bytesField(1, clientHello.ephemeral);
    }
    if (clientHello.staticKey !== undefined) {
        writer.bytesField(2, clientHello.staticKey);
    }
    if (clientHello.payload !== undefined) {
        writer.bytesField(3, clientHello.payload);
    }
    if (clientHello.useExtended !== undefined) {
        writer.boolField(4, clientHello.useExtended);
    }
    if (clientHello.extendedCiphertext !== undefined) {
        writer.bytesField(5, clientHello.extendedCiphertext);
    }
    return writer.finish();
}
function encodeClientFinish(clientFinish) {
    const writer = new ProtoWriter();
    if (clientFinish.staticKey !== undefined) {
        writer.bytesField(1, clientFinish.staticKey);
    }
    if (clientFinish.payload !== undefined) {
        writer.bytesField(2, clientFinish.payload);
    }
    if (clientFinish.extendedCiphertext !== undefined) {
        writer.bytesField(3, clientFinish.extendedCiphertext);
    }
    return writer.finish();
}
function requireBytesWireType(tag, field) {
    const wireType = tag & 7;
    if (wireType !== 2) {
        throw new Error(`Invalid WhatsApp handshake wire type ${wireType} for length-delimited field ${field}.`);
    }
}
function requireVarintWireType(tag, field) {
    const wireType = tag & 7;
    if (wireType !== 0) {
        throw new Error(`Invalid WhatsApp handshake wire type ${wireType} for varint field ${field}.`);
    }
}
function encodeServerHello(serverHello) {
    const writer = new ProtoWriter();
    if (serverHello.ephemeral !== undefined) {
        writer.bytesField(1, serverHello.ephemeral);
    }
    if (serverHello.staticKey !== undefined) {
        writer.bytesField(2, serverHello.staticKey);
    }
    if (serverHello.payload !== undefined) {
        writer.bytesField(3, serverHello.payload);
    }
    if (serverHello.extendedStatic !== undefined) {
        writer.bytesField(4, serverHello.extendedStatic);
    }
    return writer.finish();
}
class ProtoReader {
    #offset = 0;
    #buffer;
    constructor(data) {
        this.#buffer = Buffer.from(data);
    }
    done() {
        return this.#offset >= this.#buffer.length;
    }
    bytes() {
        const length = this.uint32();
        this.#require(length);
        const value = this.#buffer.subarray(this.#offset, this.#offset + length);
        this.#offset += length;
        return value;
    }
    skip(field, wireType, groupDepth = 0) {
        if (wireType === 0) {
            this.#skipVarint();
            return;
        }
        if (wireType === 1) {
            this.#require(8);
            this.#offset += 8;
            return;
        }
        if (wireType === 2) {
            const length = this.uint32();
            this.#require(length);
            this.#offset += length;
            return;
        }
        if (wireType === 3) {
            if (groupDepth >= MAX_PROTOBUF_GROUP_DEPTH) {
                throw new Error("WhatsApp handshake protobuf group nesting exceeds the supported depth.");
            }
            while (!this.done()) {
                const tag = this.tag();
                const nestedField = tag >>> 3;
                const nestedWireType = tag & 7;
                if (nestedWireType === 4) {
                    if (nestedField !== field) {
                        throw new Error("Mismatched WhatsApp handshake protobuf end group.");
                    }
                    return;
                }
                this.skip(nestedField, nestedWireType, groupDepth + 1);
            }
            throw new Error("Unterminated WhatsApp handshake protobuf group.");
        }
        if (wireType === 4) {
            throw new Error("Unexpected WhatsApp handshake protobuf end group.");
        }
        if (wireType === 5) {
            this.#require(4);
            this.#offset += 4;
            return;
        }
        throw new Error(`Unsupported WhatsApp handshake wire type: ${wireType}.`);
    }
    tag() {
        const tag = this.uint32();
        if (tag >>> 3 === 0) {
            throw new Error("Invalid WhatsApp handshake protobuf field number 0.");
        }
        return tag;
    }
    uint32() {
        let value = 0;
        let shift = 0;
        while (shift < 32) {
            this.#require(1);
            const byte = this.#buffer[this.#offset];
            this.#offset += 1;
            if (byte === undefined) {
                throw new Error("Unexpected end of WhatsApp handshake protobuf.");
            }
            if (shift === 28 && byte > 0x0f) {
                throw new Error("Invalid WhatsApp handshake varint.");
            }
            value |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) {
                return value >>> 0;
            }
            shift += 7;
        }
        throw new Error("Invalid WhatsApp handshake varint.");
    }
    #skipVarint() {
        for (let index = 0; index < 10; index += 1) {
            this.#require(1);
            const byte = this.#buffer[this.#offset];
            this.#offset += 1;
            if (byte === undefined || (index === 9 && byte > 1)) {
                throw new Error("Invalid WhatsApp handshake varint.");
            }
            if ((byte & 0x80) === 0) {
                return;
            }
        }
        throw new Error("Invalid WhatsApp handshake varint.");
    }
    #require(length) {
        if (this.#offset + length > this.#buffer.length) {
            throw new Error("Unexpected end of WhatsApp handshake protobuf.");
        }
    }
}
class ProtoWriter {
    #parts = [];
    boolField(field, value) {
        this.uint32(field << 3);
        this.uint32(value ? 1 : 0);
    }
    bytesField(field, value) {
        this.uint32((field << 3) | 2);
        this.uint32(value.byteLength);
        this.#parts.push(Buffer.from(value));
    }
    finish() {
        return Buffer.concat(this.#parts);
    }
    uint32(value) {
        let remaining = value >>> 0;
        const bytes = [];
        while (remaining > 127) {
            bytes.push((remaining & 0x7f) | 0x80);
            remaining >>>= 7;
        }
        bytes.push(remaining);
        this.#parts.push(Buffer.from(bytes));
    }
}
//# sourceMappingURL=handshake.js.map