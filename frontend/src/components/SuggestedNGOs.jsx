import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, MapPin, Send, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuggestedNGOs = ({ donation }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (donation) {
      fetchSuggestions();
    }
  }, [donation]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching AI matches for donation:', donation);
      
      // Call AI service directly
      const response = await axios.post('http://localhost:8000/api/ai/match-donations', {
        type: donation.category || donation.type || "Clothing",
        season: donation.season || "All Season",
        quantity: donation.quantity || 1,
        latitude: donation.location?.latitude || donation.location?.coordinates?.[1] || 12.9716,
        longitude: donation.location?.longitude || donation.location?.coordinates?.[0] || 77.5946,
        description: donation.description || "",
        max_distance: 50
      });
      
      console.log('✅ AI Response:', response.data);
      
      if (response.data.success) {
        // Map AI response to UI format
        const mappedNGOs = response.data.matches.map(match => ({
          _id: match.ngo_id,
          name: match.ngo_name,
          match_score: (match.match_score / 100).toFixed(2),
          distance: match.distance,
          city: match.location?.city || 'Unknown',
          contact: match.contact || '',
          trust_score: 4.5,
          match_reasons: [
            `${match.distance}km away`,
            `${match.match_score}% compatibility`
          ]
        }));
        
        setSuggestions(mappedNGOs);
        console.log('✅ Displaying', mappedNGOs.length, 'matched NGOs');
      }
    } catch (error) {
      console.error('❌ Failed to fetch AI suggestions:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      toast.error("Could not fetch AI suggestions. Make sure AI service is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (ngoId) => {
    try {
      const api = (await import('../lib/api')).default;
      await api.post(`/donations/${donation._id}/invite`, { ngoId });
      toast.success("Invitation sent successfully!");
      setInvited([...invited, ngoId]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send invitation");
    }
  };

  if (loading) {
    return (
      <div className="mt-8 text-center py-6 bg-gray-50 rounded-lg border border-dashed">
        <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-500">AI is finding the best NGOs for your item...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Suggested Matches ({suggestions.length} found)
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-700"
          onClick={() => navigate('/donor/browse-needs')}
        >
          <Search className="h-4 w-4 mr-2" />
          Browse All NGOs
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div className="grid gap-4">
          {suggestions.map((ngo) => (
            <Card key={ngo._id} className="border-purple-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900">{ngo.name}</h4>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {Math.round(parseFloat(ngo.match_score) * 100)}% Match
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {ngo.city}
                    </span>
                    <span>{ngo.distance}km away</span>
                    <span>Trust: {ngo.trust_score}/5</span>
                  </div>

                  {ngo.match_reasons && (
                    <p className="text-xs text-purple-600 mt-2">
                      💡 {ngo.match_reasons.join(' • ')}
                    </p>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    className={invited.includes(ngo._id) ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"}
                    onClick={() => handleInvite(ngo._id)}
                    disabled={invited.includes(ngo._id)}
                  >
                    {invited.includes(ngo._id) ? (
                      <>Sent <ExternalLink className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Invite <Send className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">No AI matches found nearby.</p>
          <Button variant="link" onClick={() => navigate('/donor/browse-needs')}>
            Browse the full NGO directory
          </Button>
        </div>
      )}
    </div>
  );
};

export default SuggestedNGOs;
