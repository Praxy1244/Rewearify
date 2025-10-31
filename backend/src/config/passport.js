import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Find a user in our database who already has this Google ID
      let user = await User.findOne({ 'social.googleId': profile.id });

      if (user) {
        // If user is found, just return them
        return done(null, user);
      } else {
        // 2. If no user with that Google ID, check if an account with that email already exists
        let existingUser = await User.findOne({ email: profile.emails[0].value });
        
        if (existingUser) {
          // If a user with that email exists, link their Google ID to their account
          existingUser.social.googleId = profile.id;
          await existingUser.save();
          return done(null, existingUser);
        }

        // 3. If no user exists at all, create a brand new user
        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          'social.googleId': profile.id,
          'profile.profilePicture.url': profile.photos[0].value,
          'verification.isEmailVerified': true, // Google verifies emails
          role: 'pending' // Explicitly set the role
        });
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, false);
    }
  }));
};

