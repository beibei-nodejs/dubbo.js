import { DecoderV2 } from 'hessian.js';

const RESPONSE_OK             = 20;
const RESPONSE_WITH_EXCEPTION = 0;
const RESPONSE_VALUE          = 1;
const RESPONSE_NULL_VALUE     = 2;

export default function decode(heap, protocol) {
  if (protocol.toLowerCase() === 'jsonrpc') {
    try {
      const resp = heap.split('\r\n\r\n');
      const headers = resp[0].split('\r\n');
      const stateCode = headers[0].split(' ')[1];
      //console.log(resp, headers, stateCode);
      if (Number(stateCode) === 200) {
        heap = JSON.parse(resp[1]);
      }

      return Promise.resolve({
        code: stateCode,
        body: heap
      });
    } catch {
      return Promise.reject({
        code: -1,
        msg: heap
      });
    }
  }

  let flag; let
    result;

  if (heap[3] !== RESPONSE_OK) {
    return Promise.resolve(heap.slice(18, heap.length - 1).toString());
  }

  try {
    result = new DecoderV2(heap.slice(16, heap.length));
    flag = result.readInt();

    switch (flag) {
      case RESPONSE_NULL_VALUE:
        return Promise.resolve(null);

      case RESPONSE_VALUE:
        return Promise.resolve(result.read());

      case RESPONSE_WITH_EXCEPTION:
        const e = result.read();
        return Promise.reject(
          e instanceof Error
            ? e
            : new Error(e)
        );

      default:
        return Promise.reject(
          new Error(`Unknown result flag, expect '0' '1' '2', get ${flag}`)
        );
    }

  } catch (err) {
    return Promise.reject(err);
  }
}
