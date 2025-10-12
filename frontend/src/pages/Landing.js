import React, { useState, useEffect } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, TrendingUp, CheckCircle, Star, Globe, Shirt, Gift, HandHeart,Leaf } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const slideImages = [
  {
    url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca',
    alt: 'Community hands coming together in support',
    caption: 'Building stronger communities through sustainable giving'
  },
  {
    url: 'https://images.unsplash.com/photo-1522543558187-768b6df7c25c',
    alt: 'Women supporting each other in community',
    caption: 'Empowering lives through clothing donations'
  },
  {
    url: 'https://images.unsplash.com/photo-1461532257246-777de18cd58b',
    alt: 'People helping each other',
    caption: 'Every donation creates a ripple of hope'
  },
  {
    url: 'https://images.pexels.com/photos/6994963/pexels-photo-6994963.jpeg',
    alt: 'Community donation distribution center',
    caption: 'Organized impact, maximized reach'
  },
  {
    url: 'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26',
    alt: 'Hands organizing donated clothes',
    caption: 'Transforming wardrobes, transforming lives'
  }
];

const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({
    total_donations: 12847,
    clothes_distributed: 45290,
    partnered_ngos: 127,
    lives_impacted: 8934
  });
  const navigate = useNavigate();

  // Slideshow effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/public/stats`);
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.log("Using demo stats data");
        // Demo data is already set in initial state
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const RewearifyLogo = () => (
     <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-green-600 group-hover:text-green-700 transition-colors" />
              <Heart className="h-4 w-4 text-green-500 absolute -top-1 -right-1 group-hover:text-green-600 transition-colors" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
              ReWearify
            </span>
          </Link>
  );

  return (
    <div className="min-h-screen">

      {/* Hero Section with Slideshow */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {slideImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="animate-slide-in-left">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Sustainable
                  <span className="block text-emerald-400">Giving</span>
                  <span className="block">Starts Here</span>
                </h1>
                <p className="text-xl md:text-2xl text-sand mb-8 leading-relaxed">
                  {slideImages[currentSlide].caption}
                </p>
              </div>

              <div className="animate-slide-in-right flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="gradient-emerald text-white text-lg px-8 py-4 btn-hover" onClick={() => navigate('/signup')}>
                  <Gift className="mr-2 h-5 w-5" />
                  Donate Clothes
                </Button>
                <Button size="lg" variant="outline" className="border-sand text-sand hover:bg-sand hover:text-charcoal text-lg px-8 py-4" onClick={() => navigate('/signup')}>
                  <HandHeart className="mr-2 h-5 w-5" />
                  Join as NGO
                </Button>
              </div>

              {/* Live Stats */}
              <div className="animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="glass rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                      {(stats?.total_donations || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-sand">Total Donations</div>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                      {(stats?.clothes_distributed || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-sand">Clothes Distributed</div>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                      {(stats?.partnered_ngos || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-sand">Partner NGOs</div>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                      {(stats?.lives_impacted || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-sand">Lives Impacted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slideshow indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2">
            {slideImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-emerald-400' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* For Donors Section */}
      <section id="for-donors" className="py-20 gradient-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">For Donors</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">
              Turn your unused clothes into hope. Every donation is matched with verified NGOs using AI-powered recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shirt className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Easy Donation</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  Simply upload photos and details of your clothes. Our platform handles the rest.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Smart Matching</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  AI matches your donations with NGOs that need them most, maximizing impact.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Track Impact</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  Follow your donation journey and see the real impact on communities.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="gradient-emerald text-white px-8 py-4 btn-hover" onClick={() => navigate('/signup')}>
              Start Donating <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* For NGOs Section */}
      <section id="for-ngos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">For NGOs</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">
              Access a steady stream of quality clothing donations matched to your community's specific needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-emerald-200 hover:border-emerald-400 transition-colors hover:shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Global Network</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  Connect with donors worldwide and access a diverse range of clothing donations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 hover:border-emerald-400 transition-colors hover:shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Quality Assurance</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  AI-powered verification ensures you receive quality donations that meet your standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 hover:border-emerald-400 transition-colors hover:shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-4">Community Impact</h3>
                <p className="text-charcoal/70 leading-relaxed">
                  Detailed analytics help you measure and communicate your impact to stakeholders.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-4" onClick={() => navigate('/signup')}>
              Register Your NGO <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">How It Works</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">
              A simple, transparent process that connects donors with NGOs for maximum impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Donor Timeline */}
            <div>
              <h3 className="text-2xl font-bold text-charcoal mb-8 text-center">For Donors</h3>
              <div className="space-y-8">
                {[
                  { step: "1", title: "Upload Donation", desc: "Add details of your clothes" },
                  { step: "2", title: "AI Matching", desc: "Our AI finds the best NGO matches for your donation" },
                  { step: "3", title: "Admin Review", desc: "Quality check and verification process" },
                  { step: "4", title: "NGO Selection", desc: "NGOs request your items based on their needs" },
                  { step: "5", title: "Delivery & Impact", desc: "Track delivery and see your impact in real-time" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 gradient-emerald rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-charcoal mb-2">{item.title}</h4>
                      <p className="text-charcoal/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NGO Timeline */}
            <div>
              <h3 className="text-2xl font-bold text-charcoal mb-8 text-center">For NGOs</h3>
              <div className="space-y-8">
                {[
                  { step: "1", title: "Register & Verify", desc: "Complete profile with your organization details" },
                  { step: "2", title: "Browse Marketplace", desc: "View available donations with AI-powered recommendations" },
                  { step: "3", title: "Request Items", desc: "Select donations that match your community needs" },
                  { step: "4", title: "Coordinate Pickup", desc: "Arrange collection from donors or distribution centers" },
                  { step: "5", title: "Report Impact", desc: "Share outcomes and build community trust" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-charcoal mb-2">{item.title}</h4>
                      <p className="text-charcoal/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default Landing;