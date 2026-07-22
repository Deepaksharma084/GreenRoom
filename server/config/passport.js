//Talk to Google
//Verify Google identity
//Return profile

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        async (accessToken, refreshToken, profile, done) => {
            try {

                // only verify Google here.
                // Database work will happen in googleCallback().

                return done(null, profile);

            } catch (err) {
                return done(err, null);
            }
        }
    )
);

export default passport;