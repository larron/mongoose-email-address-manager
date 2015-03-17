# Mongoose Email Address Manager #

Manage multiple email addresses per user (or other model/doc) with this mongoose schema plugin.

Something like...

    {
        email_addresses: [
            {
                email_address: {type: String, unique: unique},
                primary: Date,
                verification: {
                    date: Date,
                    code: String,
                    code_expiration: Date
                }
            }
        ]
    }

Install it...

    npm install mongoose-email-address-manager

Plug it in...

    var db = require('mongoose'),
        emailAddressManagerPlugin = require('mongoose-email-address-manager'),
        UserSchema = db.Schema(),
        options = {
            unique: true, // defaults to true will throw error if emails are not unique
            verificationCodePrefix: 'emvc-', // useful for web pages that deal with more than one type of access code / validation code (like mobile numbers)
            verificationCodeExpiration: 0, // the amount of hours to add to the expiration date of validation code, defaults to never expire (0)
            emailValidationRegex: /^.+@.+$/ // very simple regex validator for email addresses, overwrite if you want something more powerful :)
        };

        UserSchema.plugin(emailAddressManagerPlugin, options);

Make the model...

    var User = db.model('user', UserSchema);

Make the instance or find the instance with the statics below ...

    var user = new User({
        email_addresses: [{
            email_address: 'me@larron..com'
        }]
    });

Use the statics...

    User.findOneByEmail - like mongooses findOne except the first arg is an email_address instead of a condition
    User.findByEmail - same here... this is useful if unique is set to false and more than one doc has the same email
    User.findByEmailVerificationCode - find the doc by one of it's email verification codes
    User.emailExists - use this to check if email exists within entire collection so you can quickly throw that "email already exists" error on your signup forms or something with that cool new API

Empower your self with easy methods on the instance...

    user.getPrimaryEmail // returns the email object
    user.setPrimaryEmail // sets email_address as primary and removes primary from the other email object
    user.findEmail // find the email object within the doc
    user.removeEmail // removes and saves the doc with the loss of an email address
    user.emailExists // do we have the email in the doc? It's always a yes or no answer
    user.isPrimaryEmail // is it?
    user.startEmailVerificationProcess // this configures and saves some stuff like a verification code and expiration date for that verification code
    user.getEmailByVerificationCode // if you don't have the doc in memory find it first with the static: findByEmailVerificationCode
    user.verifyEmail // verify that email
    user.isVerifiedEmail // returns boolean on rather or not that email address has been verified

Use the one and only extremely powerful virtual field that hands down that primary email address at all times unless it's undefined

    user.email; // the primary email or equivalent of user.getPrimaryEmail().email_address

Misc Notes

On creation/save the first email will become primary pre save if there is not a current primary email address unless there are no email addresses.

Please refer to the tests for further use.

Found a bug? Let me know or kindly fix it...

Want a feature? I like features! Just ask...

MIT
