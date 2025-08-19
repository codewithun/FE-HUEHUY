import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';

export default function FloatingOriginButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/app/komunitas/komunitas');
  };

  return (
    <button
      className="fixed bottom-24 right-6 z-50 bg-primary text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-primary/90 transition-all"
      onClick={handleClick}
      aria-label="Ke Komunitas"
    >
      <FontAwesomeIcon icon={faUsers} className="text-2xl" />
    </button>
  );
}