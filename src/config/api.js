const envUrl = import.meta.env.VITE_API_URL;
export const API_URL = envUrl !== undefined && envUrl !== '' ? envUrl : '';
