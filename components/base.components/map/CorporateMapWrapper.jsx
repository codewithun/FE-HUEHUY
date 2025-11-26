/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import { GoogleMap, InfoBox, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import CubeComponent from '../../construct.components/CubeComponent';

const mapContainerStyle = {
    width: '100%',
    height: '500px',
};

const INFOBOX_MIN_WIDTH = 220;

export default function CorporateMapWrapper({ position, dataAds }) {
    const [selectedCube, setSelectedCube] = useState(null);
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyD74gvRdtA7NAo4j8ENoOsdy3QGXU6Oklc',
        libraries: ['places'],
    });

    if (!isLoaded) {
        return (
            <div className="h-[500px] rounded-[20px] bg-slate-100 animate-pulse flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-300 border-t-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    const getCubeName = (cube) => {
        // Prioritas: ads title > address > code
        const firstAdTitle = cube?.ads?.[0]?.title;
        return firstAdTitle || cube?.address || cube?.code || 'Tanpa Nama';
    };

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={10}
            center={position ? position : { lat: -6.905977, lng: 107.613144 }}
            options={{
                streetViewControl: false,
                fullscreenControl: false,
                disableDefaultUI: true,
                keyboardShortcuts: false,
                gestureHandling: 'greedy',
                scrollwheel: true,
            }}
        >
            {dataAds?.map((ad, key) => {
                // Pastikan koordinat valid sebelum render InfoBox
                if (!ad?.map_lat || !ad?.map_lng) return null;

                return (
                    <InfoBox
                        position={{
                            lat: parseFloat(ad?.map_lat),
                            lng: parseFloat(ad?.map_lng),
                        }}
                        options={{
                            closeBoxURL: '',
                            enableEventPropagation: true,
                            boxStyle: {
                                overflow: 'visible',
                                background: 'transparent',
                                border: 'none',
                            },
                        }}
                        key={key}
                    >
                        <div
                            className="relative flex flex-col items-center cursor-pointer"
                            // 👉 bikin konten "menggantung" di titik peta, tapi anchor-nya tetap
                            style={{ transform: 'translate(-50%, -100%)' }}
                            onClick={() =>
                                setSelectedCube(selectedCube?.id === ad?.id ? null : ad)
                            }
                        >
                            {selectedCube?.id === ad?.id && (
                                <div
                                    className="mb-1 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200"
                                    style={{
                                        minWidth: `${INFOBOX_MIN_WIDTH}px`,
                                        maxWidth: '600px',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                        zIndex: 9999,
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <p className="text-sm font-semibold text-gray-800 text-center">
                                        {getCubeName(ad)}
                                    </p>
                                </div>
                            )}

                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                                {ad?.picture_source ? (
                                    <img src={ad?.picture_source} className="w-12" alt="" />
                                ) : (
                                    <CubeComponent
                                        size={18}
                                        color={`${ad?.cube_type?.color}`}
                                    />
                                )}
                            </div>
                        </div>
                    </InfoBox>
                );
            })}
        </GoogleMap>
    );
}
