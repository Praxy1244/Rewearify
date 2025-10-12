import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components//ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { useApp } from '../../contexts/AppContext';
import { 
  Building2, 
  MapPin, 
  Shield, 
  Users, 
  Package, 
  Calendar, 
  Mail, 
  Phone,
  Search,
  Star,
  Heart
} from 'lucide-react';

const Organizations = () => {
  const { organizations } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  const getVerificationBadge = (verified, activePartner) => {
    const badges = [];
    
    if (verified) {
      badges.push(
        <Badge key="verified" className="bg-green-100 text-green-800 flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Verified</span>
        </Badge>
      );
    }
    
    if (activePartner) {
      badges.push(
        <Badge key="partner" variant="secondary" className="bg-blue-100 text-blue-800 flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>Active Partner</span>
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partner Organizations</h1>
              <p className="text-gray-600 mt-1">Discover NGOs and organizations in our network</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Building2 className="w-4 h-4" />
              <span>{filteredOrganizations.length} organizations</span>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <img 
                  src={org.image} 
                  alt={org.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                  {getVerificationBadge(org.verified, org.activePartner)}
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{org.name}</h3>
                  <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{org.location}</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3">{org.description}</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Established</span>
                    </span>
                    <span className="font-medium">{org.establishedYear}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Donations</span>
                    </span>
                    <span className="font-medium">{org.totalDonationsReceived.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>People Helped</span>
                    </span>
                    <span className="font-medium">{org.peopleHelped.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleViewDetails(org)} 
                  className="w-full"
                  variant="outline"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <Search className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600">Try adjusting your search query.</p>
          </div>
        )}
      </div>

      {/* Organization Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Organization Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6">
              {/* Header Image */}
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={selectedOrg.image} 
                  alt={selectedOrg.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Organization Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedOrg.name}</h2>
                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOrg.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getVerificationBadge(selectedOrg.verified, selectedOrg.activePartner)}
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed">{selectedOrg.description}</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {selectedOrg.establishedYear}
                    </div>
                    <div className="text-sm text-gray-600">Established</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {selectedOrg.totalDonationsReceived.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Donations</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {selectedOrg.peopleHelped.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">People Helped</div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedOrg.contactEmail}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedOrg.contactPhone}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Organization
                    </Button>
                    <Button className="w-full">
                      <Heart className="w-4 h-4 mr-2" />
                      Partner With Us
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;