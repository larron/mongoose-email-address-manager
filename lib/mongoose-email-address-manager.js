'use-strict';

var emailAddressManagerPlugin = function(schema, options){

    var options = options || {},
        index = ('index' in options) ? options.index : true,
        unique = ('unique' in options) ? options.unique : true,
        sparse = ('sparse' in options) ? options.sparse : true,
        verificationCodePrefix = options.verificationCodePrefix || 'emvc-',
        verificationCodeExpiration = options.verificationCodeExpiration || 0,
        emailValidationRegex = options.emailValidationRegex || /^.+@.+$/,
        isObject = function(o){
            return Object.prototype.toString.call(o) == "[object Object]";
        };

    schema.add({
        email_addresses: [
            {
                email_address: {type: String, unique: unique, sparse: sparse},
                primary: Date,
                verification: {
                    date: Date,
                    code: String,
                    code_expiration: Date
                }
            }
        ]
    });

    if(index){
        schema.index({'email_addresses.email_address': 1});
        schema.index({'email_addresses.verification.code': 1});
    }

    schema.virtual('email').get(function(){
        var email = this.getPrimaryEmail();
        if(email) return email.email_address;
    });

    schema.pre('save', function(next){
        if(!this.email && this.email_addresses.length > 0) 
            this.email_addresses[0].primary = new Date;
        next();
    });
    
    schema.statics.findOneByEmail = function(email){
        arguments[0] = {'email_addresses.email_address': email};
        this.findOne.apply(this, arguments);
    };

    schema.statics.findByEmail = function(email){
        arguments[0] = {'email_addresses.email_address': email};
        this.find.apply(this, arguments);
    };

    schema.statics.findByEmailVerificationCode = function(code){
        arguments[0] = {'email_addresses.verification.code': code};
        this.findOne.apply(this, arguments);
    };

    schema.statics.emailExists = function(email, callback){
        this.findOneByEmail(email, function(err, doc){
            callback(err, !!doc);
        });
    };

    schema.methods.getPrimaryEmail = function(){
        var em;
        this.email_addresses.forEach(function(email){
            if(email.primary) em = email;
        });
        return em;
    };

    schema.methods.setPrimaryEmail = function(email, callback){
        var currentPrimaryEmail = this.getPrimaryEmail(),
            newPrimaryEmail = (isObject(email)) ? email : this.findEmail(email);
        if(currentPrimaryEmail && newPrimaryEmail){
            currentPrimaryEmail.primary = undefined;
        }
        if(newPrimaryEmail){
            newPrimaryEmail.primary = new Date();
            if(callback){
                this.save(function(err, doc){
                    if(err) return callback(err);
                    callback(null, newPrimaryEmail);
                });
            }
            else return newPrimaryEmail;
        }
        else return (callback) ? callback('Email does not exist') : null;
    };

    schema.methods.findEmail = function(emailToFind){
        var em;
        this.email_addresses.forEach(function(email){
            if(email.email_address == emailToFind) em = email;
        });
        return em;
    };

    schema.methods.removeEmail = function(email, callback){
        if(isObject(email)) var email = email.email_address;
        var keep = [],
            removedEmail = null;
        this.email_addresses.forEach(function(em){
            if(em.email_address != email) keep.push(em);
            else removedEmail = em;
        });
        this.email_addresses = keep;
        if(removedEmail){
            if(callback){
                this.save(function(err, doc){
                    if(err) return callback(err);
                    callback(null, removedEmail);
                });
            }
            else return removedEmail;
        }
        else return (callback) ? callback('Email does not exist') : null;
    };

    schema.methods.emailExists = function(email){
        return !!this.findEmail(email);
    };

    schema.methods.isPrimaryEmail = function(email){
        if(isObject(email)) var email = email.email_address;
        return this.email == email;
    };

    schema.methods.generateEmailVerificationCode = function(){
        return verificationCodePrefix + function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b}();
    };

    schema.methods.generateEmailVerificationCodeExpiration = function(hours){
        var d = new Date();
        d.setTime(d.getTime() + (hours*60*60*1000)); 
        return d;
    };

    schema.methods.generateEmailVerification = function(email, expirationHours){
        email.verification = {
            code: this.generateEmailVerificationCode()
        };
        if(expirationHours > 0) email.verification.code_expiration = this.generateEmailVerificationCodeExpiration(expirationHours);
        return email;
    };

    schema.methods.startEmailVerificationProcess = function(email, codeExpirationInHours, callback){
        if(!callback) var callback = codeExpirationInHours, codeExpirationInHours = verificationCodeExpiration;
        var email = (isObject(email)) ? email : this.findEmail(email);
        if(email){
            if(email.verification && email.verification.date) callback('Email is already verified');
            else{
                this.generateEmailVerification(email, codeExpirationInHours);
                this.save(function(err, doc){
                    if(err) return callback(err);
                    callback(null, email);
                });
            }
        }
        else callback('Email does not exist');
    };

    schema.methods.getEmailByVerificationCode = function(code){
        var em;
        this.email_addresses.forEach(function(email){
            if(email.verification && email.verification.code == code) em = email;
        });
        return em;
    };

    schema.methods.verifyEmail = function(verificationCode, callback){
        var email = this.getEmailByVerificationCode(verificationCode);
        if(email){
            if(email.verification){
                if(email.verification.date) return callback('Email is already verified');
                else if(email.verification.code_expiration && email.verification.code_expiration.getTime() <= new Date().getTime()) return callback('Email validation code has expired');
                email.verification.date = new Date();
                this.save(function(err, doc){
                    if(err) return callback(err);
                    callback(null, email);
                });
            }
            else callback('Must start the email verification process on this email before verifying it');
        }
        else callback('Email does not exist');
    };

    schema.methods.isVerifiedEmail = function(email){
        var email = (isObject(email)) ? email : this.findEmail(email);
        return !!(email && email.verification && email.verification.date);
    };

    schema.path('email_addresses').validate(function(emails){
        var count = 0;
        emails.forEach(function(email){
            if(email.primary) count++;
        });
        return count <= 1;
    }, 'More than one primary email address');

    schema.path('email_addresses').schema.path('email_address').validate(function(email){
        return emailValidationRegex.test(email);
    }, 'Invalid email address');

};
exports = module.exports = emailAddressManagerPlugin;
