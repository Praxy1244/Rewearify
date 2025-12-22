import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecommendationsFAB = () => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate('/donor/recommendations')}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-50 group"
      title="View Personalized Recommendations"
    >
      <Sparkles className="w-6 h-6" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
        For You ✨
      </span>
    </button>
  );
};

export default RecommendationsFAB;
