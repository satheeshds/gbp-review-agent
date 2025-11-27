/**
 * Google My Business API Client
 * Handles low-level HTTP communication with Google My Business API
 */

import { GoogleAuthService } from './googleAuth.js';
import { logger } from '../utils/logger.js';
import { GOOGLE_API, ERROR_CODES } from '../utils/constants.js';
import { buildApiUrl } from '../utils/pathHelpers.js';

export class GoogleMyBusinessApiClient {
    constructor(private authService: GoogleAuthService) {}
    
    /**
     * Makes an authenticated GET request to the API
     */
    async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
        await this.authService.refreshTokenIfNeeded();
        
        const auth = this.authService.getAuthenticatedClient();
        const accessToken = (await auth.getAccessToken()).token;
        
        const url = buildApiUrl(GOOGLE_API.BASE_URL, path, params);
        
        logger.debug(`API GET Request`, { url });
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        return this.handleResponse<T>(response);
    }
    
    /**
     * Makes an authenticated PUT request to the API
     */
    async put<T = any>(path: string, body: any): Promise<T> {
        await this.authService.refreshTokenIfNeeded();
        
        const auth = this.authService.getAuthenticatedClient();
        const accessToken = (await auth.getAccessToken()).token;
        
        const url = `${GOOGLE_API.BASE_URL}/${path}`;
        
        logger.debug(`API PUT Request`, { url, body });
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        return this.handleResponse<T>(response);
    }
    
    /**
     * Makes an authenticated POST request to the API
     */
    async post<T = any>(path: string, body: any): Promise<T> {
        await this.authService.refreshTokenIfNeeded();
        
        const auth = this.authService.getAuthenticatedClient();
        const accessToken = (await auth.getAccessToken()).token;
        
        const url = `${GOOGLE_API.BASE_URL}/${path}`;
        
        logger.debug(`API POST Request`, { url, body });
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        return this.handleResponse<T>(response);
    }
    
    /**
     * Handles API response and error processing
     */
    private async handleResponse<T>(response: any): Promise<T> {
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`API request failed: ${response.status}`, { errorText });
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        logger.debug(`API Response received`, { status: response.status });
        
        return data as T;
    }
    
    /**
     * Gets the first account from the authenticated user
     */
    async getFirstAccount(): Promise<any> {
        const auth = this.authService.getAuthenticatedClient();
        const { google } = await import('googleapis');
        const mybusinessaccountmanagement = google.mybusinessaccountmanagement({ 
            version: 'v1', 
            auth 
        });
        
        const response = await mybusinessaccountmanagement.accounts.list({
            pageSize: 1
        });
        
        const accounts = response.data.accounts || [];
        
        if (accounts.length === 0) {
            throw new Error('No business accounts found');
        }
        
        return accounts[0];
    }
}
