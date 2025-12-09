
const API_URL = 'http://localhost:3001/api';

export const fileService = {
    /**
     * Uploads a file to the backend. 
     * If backend is offline, falls back to local Base64 conversion (Demo Mode).
     */
    async uploadFile(file: File, folder?: string): Promise<{ url: string; name: string; type: 'image' | 'file' }> {
        const type = file.type.startsWith('image/') ? 'image' : 'file';

        // 1. Try Uploading to Server
        try {
            const formData = new FormData();
            formData.append('file', file);

            const query = folder ? `?folder=${folder}` : '';
            
            // Add timeout to prevent hanging if backend is down
            const res = await fetch(`${API_URL}/upload${query}`, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(2000) 
            });

            if (res.ok) {
                const data = await res.json();
                return {
                    url: data.url,
                    name: data.originalName,
                    type: type
                };
            }
        } catch (error) {
            console.info("Falha no upload para o servidor (Offline). Usando Base64 local como alternativa.");
        }

        // 2. Fallback: Convert to Base64 (Data URL)
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    resolve({
                        url: event.target.result as string,
                        name: file.name,
                        type: type
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }
};
