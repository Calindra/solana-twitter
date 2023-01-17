
const cachedPromises = new Map<String, Promise<any>>();

async function _fetchMetadata(uri: string) {
    const res = await fetch(uri, { redirect: 'follow' });
    const metadata = await res.json();
    return metadata;
}

export async function fetchMetadata(nft: { uri: string }) {
    const promise = cachedPromises.get(nft.uri);
    if (promise) {
        return promise;
    }
    const newPromise = _fetchMetadata(nft.uri);
    cachedPromises.set(nft.uri, newPromise)
    return newPromise;
}
