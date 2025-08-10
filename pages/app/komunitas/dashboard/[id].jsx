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

    // Tunggu sampai router ready dan client-side rendering
    if (!isClient || !router.isReady) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md">
                <div className="container mx-auto relative z-10 pb-28">
                    <div className="w-full bg-gradient-to-br from-red-400 to-red-600 h-32 flex items-center justify-center">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2 text-sm">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pass community ID sebagai prop ke CommunityDashboard
    return <CommunityDashboard communityId={id} />;
}
