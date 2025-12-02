/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { Decrypt } from '../../helpers/encryption.helpers';
import { token_cookie_name } from '../../helpers/middleware.helpers';

/**
 * ViewCounter Component - Display view count with eye icon (TikTok-style)
 * 
 * @param {Object} props
 * @param {string} props.type - 'cube' or 'ad'
 * @param {number} props.id - ID of the content
 * @param {boolean} props.autoTrack - Auto track view when component mounts (default: false)
 * @param {string} props.size - Size: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 */
export default function ViewCounter({
    type = 'cube',
    id,
    autoTrack = false,
    size = 'md',
    className = ''
}) {
    const [viewCount, setViewCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

    // Get auth token from cookie
    const getAuthToken = () => {
        try {
            const enc = Cookies.get(token_cookie_name);
            console.log('🔑 Token Debug:', {
                cookie_name: token_cookie_name,
                has_encrypted: !!enc,
                enc_preview: enc ? enc.substring(0, 30) + '...' : null
            });

            if (!enc) return null;

            const decrypted = Decrypt(enc);
            console.log('🔓 Decrypted:', {
                has_decrypted: !!decrypted,
                token_preview: decrypted ? decrypted.substring(0, 20) + '...' : null
            });

            return decrypted;
        } catch (error) {
            console.error('Failed to get auth token:', error);
            return null;
        }
    };

    // Get or generate session ID based on user authentication
    const getSessionId = () => {
        if (typeof window === 'undefined') return null;

        const token = getAuthToken();

        // If user is authenticated, clear guest session and return null (backend will use user_id)
        if (token) {
            localStorage.removeItem('view_session_id');
            return null;
        }

        // For guests, get or create session ID
        let sessionId = localStorage.getItem('view_session_id');
        if (!sessionId) {
            sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('view_session_id', sessionId);
        }
        return sessionId;
    };

    // Fetch view count
    const fetchViewCount = async () => {
        if (!id) return;

        try {
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE}/views/${type}/${id}`, { headers });
            const data = await response.json();

            if (data.success) {
                setViewCount(data.view_count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch view count:', error);
        } finally {
            setLoading(false);
        }
    };

    // Track view
    const trackView = async () => {
        if (!id) return;

        try {
            const token = getAuthToken();
            const sessionId = getSessionId();

            console.log('🔍 ViewCounter Debug:', {
                has_token: !!token,
                token_preview: token ? token.substring(0, 20) + '...' : null,
                session_id: sessionId,
                type,
                id
            });

            const headers = {
                'Content-Type': 'application/json',
            };

            // Add auth token if user is logged in
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Add session ID header for guests
            if (sessionId) {
                headers['X-Session-ID'] = sessionId;
            }

            const response = await fetch(`${API_BASE}/track/${type}/${id}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ session_id: sessionId }),
            });

            const result = await response.json();
            console.log('✅ Track Response:', result);

            // Refresh count after tracking
            fetchViewCount();
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    };

    // Auto track on mount if enabled
    useEffect(() => {
        if (autoTrack && id) {
            trackView();
        } else if (id) {
            fetchViewCount();
        }
    }, [id, autoTrack]);

    // Format number (1000 -> 1K, 1000000 -> 1M)
    const formatCount = (count) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return count.toString();
    };

    // Size styles
    const sizeStyles = {
        sm: {
            container: 'text-xs gap-1',
            icon: 'w-3 h-3',
            text: 'text-xs'
        },
        md: {
            container: 'text-sm gap-1.5',
            icon: 'w-4 h-4',
            text: 'text-sm'
        },
        lg: {
            container: 'text-base gap-2',
            icon: 'w-5 h-5',
            text: 'text-base'
        }
    };

    const styles = sizeStyles[size] || sizeStyles.md;

    if (loading) {
        return (
            <div className={`flex items-center ${styles.container} text-gray-400 ${className}`}>
                <div className={`${styles.icon} animate-pulse bg-gray-300 rounded`}></div>
                <span className={`${styles.text} animate-pulse bg-gray-300 rounded w-8 h-3`}></span>
            </div>
        );
    }

    return (
        <div className={`flex items-center ${styles.container} text-gray-600 ${className}`}>
            <FontAwesomeIcon icon={faEye} className={styles.icon} />
            <span className={`${styles.text} font-medium`}>
                {formatCount(viewCount)}
            </span>
        </div>
    );
}
