/* eslint-disable no-console */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function JoinRequestPopup({ show, onClose, communityName }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md text-center animate-fadeIn">
        <FontAwesomeIcon icon={faClock} className="text-yellow-500 text-4xl mb-3" />
        <h2 className="text-xl font-bold mb-2 text-gray-800">
          Permintaan Bergabung Dikirim!
        </h2>
        <p className="text-gray-600 mb-4">
          Kamu telah mengirim permintaan bergabung ke <b>{communityName}</b>.  
          Tunggu persetujuan admin komunitas sebelum bisa mengakses semua fitur.
        </p>
        <button
          onClick={onClose}
          className="mt-3 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-all"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
