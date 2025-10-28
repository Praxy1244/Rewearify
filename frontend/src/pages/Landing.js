import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, TrendingUp, CheckCircle, Star, Globe, Shirt, Gift, HandHeart, Leaf } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import axios from 'axios';

// --- Best Practice: Isolate data fetching and complex logic into custom hooks ---
const useSlideshow = (slides, duration = 5000) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, duration);
    return () => clearInterval(timer);
  }, [slides.length, duration]);

  return { currentSlide, setCurrentSlide };
};

const usePlatformStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // This now points to your real backend endpoint.
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/public/stats`);
        if (response.data) {
          setStats(response.data);
        } else {
          // If the API returns empty data, we set stats to 0.
          setStats({ total_donations: 0, clothes_distributed: 0, partnered_ngos: 0, lives_impacted: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch stats. Displaying 0 as a fallback.");
        // If the API call fails, we set stats to 0.
        setStats({ total_donations: 1, clothes_distributed: 1, partnered_ngos: 1, lives_impacted: 1 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

const slideImages = [
  {
    url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop',
    alt: 'Community hands coming together in support',
    caption: 'Building stronger communities through sustainable giving'
  },
  {
    url: 'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?q=80&w=2070&auto=format&fit=crop',
    alt: 'Hands organizing donated clothes',
    caption: 'Transforming wardrobes, transforming lives'
  },
  {
    url: 'https://images.pexels.com/photos/6994963/pexels-photo-6994963.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    alt: 'Community donation distribution center',
    caption: 'Organized impact, maximized reach'
  },
];

const Landing = () => {
  const { currentSlide, setCurrentSlide } = useSlideshow(slideImages);
  const { stats, loading: loadingStats } = usePlatformStats();
  const navigate = useNavigate();

  const StatCard = ({ value, label, loading }) => (
    <div className="backdrop-blur-sm bg-black/30 border border-white/20 rounded-lg p-4 text-center">
      {loading ? (
        <Skeleton className="h-9 w-2/3 mx-auto bg-white/30" />
      ) : (
        <div className="text-3xl font-bold text-emerald-400 mb-1">
          {value ? value.toLocaleString() : '0'}
        </div>
      )}
      <div className="text-sm text-[#F3EBDD]">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3EBDD]">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {slideImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide.url} alt={slide.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E1E1E]/80 via-[#1E1E1E]/50 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="animate-slide-in-left">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Sustainable <span className="text-emerald-400">Giving</span> Starts Here
                </h1>
                <p className="text-xl md:text-2xl text-[#F3EBDD] mb-8 leading-relaxed">
                  {slideImages[currentSlide].caption}
                </p>
              </div>

              <div className="animate-slide-in-right flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg px-8 py-4 transition-transform hover:scale-105" onClick={() => navigate('/signup')}>
                  <Gift className="mr-2 h-5 w-5" />
                  Donate Clothes
                </Button>
                <Button size="lg" variant="outline" className="border-[#F3EBDD] text-[#F3EBDD] hover:bg-[#F3EBDD] hover:text-[#1E1E1E] text-lg px-8 py-4 transition-colors" onClick={() => navigate('/signup')}>
                  <HandHeart className="mr-2 h-5 w-5" />
                  Join as NGO
                </Button>
              </div>

              <div className="animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard value={stats?.total_donations} label="Total Donations" loading={loadingStats} />
                  <StatCard value={stats?.clothes_distributed} label="Clothes Distributed" loading={loadingStats} />
                  <StatCard value={stats?.partnered_ngos} label="Partner NGOs" loading={loadingStats} />
                  <StatCard value={stats?.lives_impacted} label="Lives Impacted" loading={loadingStats} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {slideImages.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-emerald-400' : 'bg-white/50'}`} aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
      </section>

      {/* For Donors Section */}
      <section id="for-donors" className="py-20 bg-gradient-to-b from-[#F3EBDD] to-[#e7d3c1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E1E1E] mb-6">For Donors</h2>
            <p className="text-xl text-[#1E1E1E]/80 max-w-3xl mx-auto">
              Turn your unused clothes into hope. Every donation is matched with verified NGOs using AI-powered recommendations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Shirt className="h-8 w-8 text-white" />} title="Easy Donation" description="Simply upload photos and details of your clothes. Our platform handles the rest." />
            <FeatureCard icon={<TrendingUp className="h-8 w-8 text-white" />} title="Smart Matching" description="AI matches your donations with NGOs that need them most, maximizing impact." />
            <FeatureCard icon={<CheckCircle className="h-8 w-8 text-white" />} title="Track Impact" description="Follow your donation journey and see the real impact on communities." />
          </div>
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 transition-transform hover:scale-105" onClick={() => navigate('/signup')}>
              Start Donating <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* For NGOs Section */}
      <section id="for-ngos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E1E1E] mb-6">For NGOs</h2>
            <p className="text-xl text-[#1E1E1E]/80 max-w-3xl mx-auto">
              Access a steady stream of quality clothing donations matched to your community's specific needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Globe className="h-8 w-8 text-emerald-600" />} title="Global Network" description="Connect with donors worldwide and access a diverse range of clothing donations." variant="light" />
            <FeatureCard icon={<Star className="h-8 w-8 text-emerald-600" />} title="Quality Assurance" description="AI-powered verification ensures you receive quality donations that meet your standards." variant="light" />
            <FeatureCard icon={<Users className="h-8 w-8 text-emerald-600" />} title="Community Impact" description="Detailed analytics help you measure and communicate your impact to stakeholders." variant="light" />
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
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E1E1E] mb-6">How It Works</h2>
            <p className="text-xl text-[#1E1E1E]/80 max-w-3xl mx-auto">
              A simple, transparent process that connects donors with NGOs for maximum impact.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-bold text-[#1E1E1E] mb-8 text-center">For Donors</h3>
              <div className="space-y-8">
                <TimelineStep step="1" title="Upload Donation" description="Add details of your clothes." />
                <TimelineStep step="2" title="AI Matching" description="Our AI finds the best NGO matches for your donation." />
                <TimelineStep step="3" title="Admin Review" description="Quality check and verification process." />
                <TimelineStep step="4" title="NGO Selection" description="NGOs request your items based on their needs." />
                <TimelineStep step="5" title="Delivery & Impact" description="Track delivery and see your impact in real-time." />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1E1E1E] mb-8 text-center">For NGOs</h3>
              <div className="space-y-8">
                <TimelineStep step="1" title="Register & Verify" description="Complete profile with your organization details." variant="light" />
                <TimelineStep step="2" title="Browse Marketplace" description="View available donations with AI-powered recommendations." variant="light" />
                <TimelineStep step="3" title="Request Items" description="Select donations that match your community needs." variant="light" />
                <TimelineStep step="4" title="Coordinate Pickup" description="Arrange collection from donors or distribution centers." variant="light" />
                <TimelineStep step="5" title="Report Impact" description="Share outcomes and build community trust." variant="light" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Best Practice: Create small, reusable components for repeated patterns ---
const FeatureCard = ({ icon, title, description, variant = 'dark' }) => (
  <Card className={`${variant === 'dark' ? 'bg-white/80' : 'bg-white border-emerald-200'} backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
    <CardContent className="p-8 text-center">
      <div className={`w-16 h-16 ${variant === 'dark' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-emerald-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#1E1E1E] mb-4">{title}</h3>
      <p className="text-[#1E1E1E]/70 leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const TimelineStep = ({ step, title, description, variant = 'dark' }) => (
  <div className="flex items-start space-x-4">
    <div className={`w-10 h-10 ${variant === 'dark' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-emerald-200 text-emerald-800'} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {step}
    </div>
    <div>
      <h4 className="text-lg font-semibold text-[#1E1E1E] mb-2">{title}</h4>
      <p className="text-[#1E1E1E]/70">{description}</p>
    </div>
  </div>
);

export default Landing;

