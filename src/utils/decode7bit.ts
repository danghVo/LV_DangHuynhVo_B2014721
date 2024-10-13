export function decode7bit(buffer) {
  let length = 0,
    shift = 0,
    offset = 0;
  let byte;

  do {
    byte = buffer[offset++];
    length |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte >= 0x80);

  return buffer.slice(offset, offset + length);
}
