// TODO: implement mockgoose when/if this is fixed: https://github.com/mccormicka/Mockgoose/issues/114
var mocha = require('mocha'),
    should = require('should'),
    mongoose = require('mongoose'),
    mockgoose = require('mockgoose'),
    schema = mongoose.Schema(),
    emailAddressManagerPlugin = require('../lib/mongoose-email-address-manager');

    //mockgoose(mongoose);
    mongoose.connect('mongodb://localhost/mongoose-email-address-manager');
    schema.plugin(emailAddressManagerPlugin, {unique: !1});

describe('Mongoose Email Address Manager', function(){

    var User = mongoose.model('user', schema),
        user;

    beforeEach(function(done){
        //mockgoose.reset();
        user = new User({
            email_addresses: [
                {email_address: 'me@larronarmstead.com'},
                {email_address: 'larron@larronarmstead.com'},
                {email_address: 'la@larronarmstead.com'},
            ]
        });
        user.save(function(err, doc){
            if(err) return done(err);
            done();
        });
    });

    // TODO: remove this when mockgoose works
    afterEach(function(done){
        user.remove(function(err, doc){
            if(err) return done(err);
            done();
        });
    });

    describe('Email address validation', function(){

      it('should validate all email addresses', function(done){
        user.email_addresses.push({email_address: 'bad-email'});
        user.save(function(err, user){
          should(err).exist;
          done();
        });
      });

    });

    describe('.findOneByEmail', function(){

        it('should find one doc by an email address', function(done){
            User.findOneByEmail('me@larronarmstead.com', function(err, doc){
                if(err) return done(err);
                doc.email_addresses.should.have.length(3);
                doc.email_addresses[0].email_address.should.eql('me@larronarmstead.com');
                doc.email_addresses[1].email_address.should.eql('larron@larronarmstead.com');
                doc.email_addresses[2].email_address.should.eql('la@larronarmstead.com');
                done();
            });
        });

    });

    describe('.findByEmail', function(){

        var user2;

        beforeEach(function(done){
            user2 = new User({
                email_addresses: [
                    {email_address: 'me@larronarmstead.com'}
                ]
            });
            user2.save(function(err, doc){
                if(err) return done(err);
                done();
            });
        });

        afterEach(function(done){
            user2.remove(function(err, doc){
                if(err) return done(err);
                done();
            });
        });

        it('should find all docs by an email address', function(done){
            User.findByEmail('me@larronarmstead.com', function(err, docs){
                if(err) return done(err);
                docs.should.have.length(2);
                done();
            });
        });

    });

    // Broken with mockgoose, verify that it works when above ticket is fixed
    describe('.findByEmailVerificationCode', function(){

        it('should find one doc by an email verification code', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', function(err, email){
                if(err) return done(err);
                User.findByEmailVerificationCode(email.verification.code, function(err, doc){
                    if(err) return done(err);
                    doc.getEmailByVerificationCode(email.verification.code).email_address.should.eql('me@larronarmstead.com');
                    done();
                });
            });
        });

    });

    describe('.emailExists', function(){

        it('should return true for existing email', function(done){
            User.emailExists('me@larronarmstead.com', function(err, exists){
                if(err) return done(err);
                exists.should.be.true;
                done();
            });
        });

        it('should return false for a non existing email', function(done){
            User.emailExists('mee@larronarmstead.com', function(err, exists){
                if(err) return done(err);
                exists.should.be.false;
                done();
            });
        });

    });

    describe('.getPrimaryEmail', function(){

        it('should find the primary email addresss object', function(){
            user.getPrimaryEmail().email_address.should.eql('me@larronarmstead.com');
        });

        it('should work as an alias for the virtual email field', function(){
            user.email.should.eql('me@larronarmstead.com');
        });

    });

    describe('.setPrimaryEmail', function(){

        it('should set an email address as primary', function(done){
            user.setPrimaryEmail('larron@larronarmstead.com', function(err, email){
                if(err) return done(err);
                email.email_address.should.eql('larron@larronarmstead.com');
                user.findEmail('me@larronarmstead.com').email_address.should.not.have.property('primary');
                done();
            });
        });

    });

    describe('.findEmail', function(){

        it('should find an email object by email address', function(){
            var email = user.findEmail('larron@larronarmstead.com');
            email.email_address.should.eql('larron@larronarmstead.com');
        });

    });

    describe('.removeEmail', function(){

        it('should remove an email address', function(done){
            user.removeEmail('me@larronarmstead.com', function(err, email){
                if(err) return done(err);
                should.not.exist(user.findEmail(email.email_address));
                done();
            });
        });

    });

    describe('.emailExists', function(){

        it('should return true if email exists', function(){
            user.emailExists('me@larronarmstead.com').should.be.true;
        });

        it('should return false if email does not exist', function(){
            user.emailExists('mee@larronarmstead.com').should.be.false;
        });

    });

    describe('.isPrimaryEmail', function(){

        it('should return true if email is primary', function(){
            user.isPrimaryEmail('me@larronarmstead.com').should.be.true;
        });

        it('should return false if email is not primary', function(){
            user.isPrimaryEmail('larron@larronarmstead.com').should.be.false;
        });

    });

    describe('.startEmailVerificationProcess', function(){

        it('should configure email address verification process with no code expiration date', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', function(err, email){
                if(err) return done(err);
                should.exist(email.verification.code);
                should.not.exist(email.verification.code_expiration);
                done();
            });
        });

        it('should configure email address verification process with code expiration date', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', 1, function(err, email){
                if(err) return done(err);
                should.exist(email.verification.code);
                should.exist(email.verification.code_expiration);
                done();
            });
        });

    });

    describe('.getEmailByVerificationCode', function(){

        it('should get email address by verification code', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', function(err, email){
                if(err) return done(err);
                user.getEmailByVerificationCode(email.verification.code).should.eql(email);
                done();
            });
        });

    });

    describe('.verifyEmail', function(){

        it('should verify an email addresss', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', function(err, email){
                user.verifyEmail(email.verification.code, function(err, email){
                    if(err) return done(err);
                    should.exist(email.verification.date);
                    done();
                });
            });
        });

        it('should not verify an email addresss because the validation code is expired', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', .00000000000000001, function(err, email){
                user.verifyEmail(email.verification.code, function(err, email){
                    should.exist(err);
                    done();
                });
            });
        });

    });

    describe('.isVerifiedEmail', function(){

        it('should return true if email address is verified', function(done){
            user.startEmailVerificationProcess('me@larronarmstead.com', function(err, email){
                user.verifyEmail(email.verification.code, function(err, email){
                    if(err) return done(err);
                    user.isVerifiedEmail('me@larronarmstead.com').should.be.true;
                    done();
                });
            });
        });

        it('should return false if email address is not verified', function(){
            user.isVerifiedEmail('me@larronarmstead.com').should.be.false;
        });

    });

});
