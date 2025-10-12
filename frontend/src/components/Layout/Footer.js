import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
     <footer className="bg-charcoal text-sand py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
             
              <p className="mt-4 text-sand/80 leading-relaxed">
                Connecting sustainable fashion with humanitarian impact. Building a world where every piece of clothing finds its purpose.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">How It Works</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">For Donors</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">For NGOs</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Impact Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Facebook</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">Instagram</a></li>
                <li><a href="#" className="text-sand/80 hover:text-emerald-400 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sand/20 mt-12 pt-8 text-center">
            <p className="text-sand/60">© 2024 Rewearify. All rights reserved. Made with ❤️ for a sustainable future.</p>
          </div>
        </div>
      </footer>
  );
};

export default Footer;