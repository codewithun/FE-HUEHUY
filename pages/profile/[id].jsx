/* eslint-disable no-console */
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function PublicProfile() {
    const router = useRouter();
    const { id } = router.query;
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchUserProfile();
        }
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/public`);
            const result = await response.json();

            if (response.ok && result.message === 'success') {
                setUserData(result.data);
            } else {
                setError('User not found or profile not available');
            }
        } catch (err) {
            setError('Failed to load profile');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => router.push('/')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{userData?.name} - HUEHUY Profile</title>
                <meta name="description" content={`Public profile of ${userData?.name} on HUEHUY platform`} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Image 
                                    src="/logo.png" 
                                    alt="HUEHUY" 
                                    width={40} 
                                    height={40}
                                    className="rounded-lg"
                                />
                                <h1 className="text-xl font-bold text-gray-800">HUEHUY</h1>
                            </div>
                            <button 
                                onClick={() => router.push('/')}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Visit Platform
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-12 text-center">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    {userData?.picture_source ? (
                                        <Image 
                                            src={userData.picture_source} 
                                            alt={userData.name}
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-600">
                                                {userData?.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {userData?.verified_at && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">{userData?.name}</h2>
                            <p className="text-indigo-100 text-lg">{userData?.code}</p>
                        </div>

                        {/* Profile Details */}
                        <div className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Role</p>
                                            <p className="font-medium text-gray-800">{userData?.role?.name || 'User'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <p className="font-medium text-gray-800">
                                                {userData?.verified_at ? 'Verified Member' : 'Member'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Platform</p>
                                            <p className="font-medium text-gray-800">{userData?.platform}</p>
                                        </div>
                                    </div>

                                    {userData?.joined_date && (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Member Since</p>
                                                <p className="font-medium text-gray-800">{userData.joined_date}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-8 py-6 text-center border-t">
                            <p className="text-sm text-gray-600 mb-3">
                                This profile was accessed via QR code scan
                            </p>
                            <div className="flex justify-center space-x-4">
                                <a 
                                    href={userData?.website || 'https://huehuy.app'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                    Visit HUEHUY
                                </a>
                                <button 
                                    onClick={() => router.push('/login')}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                >
                                    Join Platform
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}