class RAGService {
    constructor() {
        this.store = [];
        this.MAX_CHUNKS_PER_DOC = 300;
        this.CHUNK_SIZE = 800;
        this.CHUNK_OVERLAP = 150;
    }
    async indexDocument(docId, text, openai) {
        // Check if document is already indexed to avoid redundant work
        if (this.store.some(c => c.docId === docId))
            return;
        const rawChunks = this.splitText(text);
        const chunksToProcess = rawChunks.slice(0, this.MAX_CHUNKS_PER_DOC);
        try {
            // Batch embedding request for performance
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunksToProcess,
            });
            const embeddings = response.data;
            embeddings.forEach((item, index) => {
                this.store.push({
                    text: chunksToProcess[index],
                    embedding: item.embedding,
                    docId: docId
                });
            });
            console.log(`[RAG] Indexed ${embeddings.length} chunks for document: ${docId}`);
        }
        catch (e) {
            console.error("[RAG] Indexing failed:", e.message);
        }
    }
    splitText(text) {
        const chunks = [];
        if (!text)
            return chunks;
        for (let i = 0; i < text.length; i += (this.CHUNK_SIZE - this.CHUNK_OVERLAP)) {
            chunks.push(text.slice(i, i + this.CHUNK_SIZE));
            // Safety break to prevent infinite loops if sizing is weird
            if (chunks.length >= this.MAX_CHUNKS_PER_DOC)
                break;
        }
        return chunks;
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let mA = 0;
        let mB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            mA += a[i] * a[i];
            mB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
    }
    async retrieve(query, openai, docIds) {
        if (this.store.length === 0)
            return [];
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query,
            });
            const queryEmbedding = response.data[0].embedding;
            // Filter store by relevant docIds if provided
            const relevantStore = docIds.length > 0
                ? this.store.filter(c => docIds.includes(c.docId))
                : this.store;
            const scored = relevantStore.map(chunk => ({
                text: chunk.text,
                score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
            }));
            const results = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 4) // Top 4 chunks
                .map(s => s.text);
            return results;
        }
        catch (e) {
            console.error("[RAG] Retrieval failed:", e.message);
            return [];
        }
    }
    clearAll() {
        this.store = [];
    }
}
export const ragService = new RAGService();
