export const decodedBase64 = (base64: String) => {
    return Buffer.from(base64, 'base64').toString('ascii');
}