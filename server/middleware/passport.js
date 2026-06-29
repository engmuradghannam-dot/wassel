const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });

    if (!user) {
      user = await User.create({
        name:     profile.displayName,
        email:    profile.emails[0].value,
        googleId: profile.id,
        avatar:   profile.photos?.[0]?.value,
        role:     'user',
        isActive: true,
        isOnline: true,
        lastSeen: new Date()
      });
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user.googleId = profile.id;
      if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
      await user.save();
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
