const envUrl = import.meta.env.VITE_API_URL
export const API_URL: string = envUrl !== undefined ? envUrl : 'http://localhost:3001'
