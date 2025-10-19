/**
 * Google OAuth Authentication Service
 */

import { google } from 'googleapis';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { GoogleOAuthTokens, AuthState } from '../types/index.js';

export class GoogleAuthService {
    private config = getConfig();
    private oauth2Client: any;
    private tokens: GoogleOAuthTokens | null = null;
    
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            this.config.googleClientId,
            this.config.googleClientSecret,
            this.config.googleRedirectUri
        );
        
        // Set up token refresh handling
        this.oauth2Client.on('tokens', (tokens: any) => {
            if (tokens.refresh_token) {
                this.tokens = {
                    ...this.tokens,
                    ...tokens,
                    expires_at: Date.now() + (tokens.expires_in * 1000)
                };
                logger.debug('Tokens refreshed');
            }
        });
    }
    
    /**
     * Generate the authorization URL for OAuth flow
     */
    getAuthUrl(state?: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/business.manage',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];
        
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: state,
            prompt: 'consent'
        });
    }
    
    /**
     * Handle the OAuth callback and exchange code for tokens
     */
    async handleCallback(code: string, state?: string): Promise<GoogleOAuthTokens> {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            
            this.tokens = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                scope: tokens.scope,
                token_type: tokens.token_type || 'Bearer',
                expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
                expires_at: tokens.expiry_date || (Date.now() + 3600000)
            };
            
            this.oauth2Client.setCredentials(tokens);
            
            logger.info('OAuth authentication successful');
            return this.tokens;
            
        } catch (error) {
            logger.error('OAuth callback error:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }
    
    /**
     * Get the current authentication state
     */
    getAuthState(): AuthState {
        return {
            isAuthenticated: !!this.tokens && this.isTokenValid(),
            tokens: this.tokens || undefined
        };
    }
    
    /**
     * Check if the current token is valid (not expired)
     */
    private isTokenValid(): boolean {
        if (!this.tokens) return false;
        return Date.now() < this.tokens.expires_at;
    }
    
    /**
     * Get the authenticated OAuth2 client for making API calls
     */
    getAuthenticatedClient(): any {
        if (!this.tokens || !this.isTokenValid()) {
            throw new Error('Not authenticated or token expired');
        }
        
        return this.oauth2Client;
    }
    
    /**
     * Refresh the access token if needed
     */
    async refreshTokenIfNeeded(): Promise<void> {
        if (!this.tokens) {
            throw new Error('No tokens available');
        }
        
        if (this.isTokenValid()) {
            return; // Token is still valid
        }
        
        if (!this.tokens.refresh_token) {
            throw new Error('No refresh token available');
        }
        
        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            
            this.tokens = {
                ...this.tokens,
                access_token: credentials.access_token!,
                expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
                expires_at: credentials.expiry_date || (Date.now() + 3600000)
            };
            
            logger.debug('Access token refreshed');
            
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw new Error('Failed to refresh access token');
        }
    }
    
    /**
     * Revoke the current tokens and clear authentication
     */
    async logout(): Promise<void> {
        if (this.tokens?.access_token) {
            try {
                await this.oauth2Client.revokeCredentials();
            } catch (error) {
                logger.warn('Error revoking tokens:', error);
            }
        }
        
        this.tokens = null;
        this.oauth2Client.setCredentials({});
        logger.info('User logged out');
    }
}