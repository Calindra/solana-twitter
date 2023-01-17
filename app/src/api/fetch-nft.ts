interface MetadataResponse {
    image: string;
}

const cachedPromises = new Map<String, Promise<MetadataResponse>>();

async function _fetchMetadata(uri: string): Promise<MetadataResponse> {
    const res = await fetch(uri, { redirect: 'follow' });
    const metadata: unknown = await res.json();

    if (typeof metadata != 'object' || metadata == null || !('image' in metadata)) {
        throw new Error('Invalid metadata');
    }

    return metadata as MetadataResponse;
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
