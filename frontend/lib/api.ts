const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const api = {
    get: async (endpoint: string, options: RequestInit = {}) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        return res.json();
    },

    post: async (endpoint: string, body: any, options: RequestInit = {}) => {
        const isFormData = body instanceof FormData;
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers },
            body: isFormData ? body : JSON.stringify(body),
            ...options,
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        return res.json();
    }
};
