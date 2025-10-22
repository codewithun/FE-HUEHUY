import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CommunityDashboard from './home';

export default function CommunityDashboardPage() {
    const router = useRouter();
    const { id } = router.query;
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Admin-style loading state
    if (!isClient || !router.isReady) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
                <div className="container mx-auto relative z-10 pb-28">
                    <div className="bg-slate-50 p-6 border-b border-slate-200">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-sm text-slate-600">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pass community ID sebagai prop ke CommunityDashboard
    return <CommunityDashboard communityId={id} />;
}
