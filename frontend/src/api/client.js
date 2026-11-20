/** Error thrown for any failed API call. `details` holds per-field messages when the server sends them. */
export class ApiError extends Error {
    constructor(message, status = 0, details = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details ?? {};
    }
}

async function request(path, { method = 'GET', body } = {}) {
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError('Cannot reach the server. Make sure the backend is running.');
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
        throw new ApiError(data?.error || `Request failed (HTTP ${response.status}).`, response.status, data?.details);
    }
    return data;
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
