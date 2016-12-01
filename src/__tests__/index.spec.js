import User from './models/user'
import UniqueUser from './models/unique-user'

describe('Mongoose Email Address Manager', () => {
  let user

  const primaryEmail = 'me@larronarmstead.com'
  const secondaryEmail = 'larron@larronarmstead.com'
  const newEmail = 'new@email.com'
  const badEmail = 'bad@email.com'
  const verificationCode = 'emvc-code'
  const badVerificationCode = 'emvc-code-bad'
  const expiredVerificationCode = 'emvc-code-expired'
  const verifiedVerificationCode = 'emvc-code-verified'
  const emailWithVerificationCode = 'la@larronarmstead.com'
  const emailWithExpiredVerificationCode = 'ev@larronarmstead.com'
  const emailWithVerification = 'lala@larronarmstead.com'

  const doc = {
    emailAddresses: [
      { emailAddress: primaryEmail },
      { emailAddress: secondaryEmail },
      {
        emailAddress: emailWithVerificationCode,
        verification: { code: verificationCode }
      },
      {
        emailAddress: emailWithExpiredVerificationCode,
        verification: {
          code: expiredVerificationCode,
          codeExpiration: new Date(2006, 6, 6)
        }
      },
      {
        emailAddress: emailWithVerification,
        verification: {
          code: verifiedVerificationCode,
          date: new Date()
        }
      }
    ]
  }


  before(async () => {
    user = await User.create(doc)
  })

  context('using the virtuals', () => {
    it('should return the primary email', () =>
      expect(user.email).to.eql(primaryEmail)
    )
  })

  context('_id option', () => {
    it('should remove _id fields when set to false', () =>
      expect(user.getEmail(primaryEmail)).not.to.have.property('_id')
    )
  })

  context('unique option', () => {
    before(async () => {
      await UniqueUser.create(doc)
    })

    it('should block duplicate emails', () => {
      expect(UniqueUser.create(doc)).to.be.rejectedWith('dup key')
    })
  })

  context('required option', () => {
    it('should require an email address', () =>
      expect(User.create({})).to.be.rejectedWith('validation failed')
    )
  })

  context('style option', () => {
    it('should have camelCase styled keys', () =>
      expect(user).to.have.property('emailAddresses')
    )
  })

  context('using the statics', () => {
    it('should find one by email', async () => {
      const result = await User.findOneByEmail(primaryEmail)

      expect(result).to.have.property('emailAddresses')
    })

    it('should find by email', async () => {
      const result = await User.findByEmail(primaryEmail)

      expect(result[0]).to.have.property('emailAddresses')
    })

    it('should find by an email verification code', async () => {
      const result = await User.findByEmailVerificationCode(verificationCode)

      expect(result).to.have.property('emailAddresses')
    })

    it('should confirm that an email exists', async () => {
      const result = await User.emailExists(primaryEmail)

      expect(result).to.be.true()
    })
  })

  context('using the instance methods', () => {
    it('should get the primary email address', () => {
      const email = user.getPrimaryEmail()

      expect(email.emailAddress).to.eql(primaryEmail)
    })

    it('should get the email by string', () => {
      const email = user.getEmail(primaryEmail)

      expect(email.emailAddress).to.eql(primaryEmail)
    })

    it('should get the email by obejct', () => {
      const email = user.getEmail({ emailAddress: primaryEmail })

      expect(email.emailAddress).to.eql(primaryEmail)
    })

    it('should determine if email exists', () =>
      expect(user.emailExists(primaryEmail)).to.be.true()
    )

    it('should determine if email does not exist', () =>
      expect(user.emailExists('bad@email.com')).to.be.false()
    )

    it('should confirm if is primary email by string', () =>
      expect(user.isPrimaryEmail(primaryEmail)).to.be.true()
    )

    it('should confirm if is primary email by object', () =>
      expect(user.isPrimaryEmail({
        emailAddress: primaryEmail
      })).to.be.true()
    )

    context('modifying methods', () => {
      beforeEach(async () => {
        user = await User.create(doc)
      })

      it('should add an email by string', () => {
        const count = user.emailAddresses.length
        user.addEmail(newEmail)

        expect(user.emailAddresses).to.have.lengthOf(count + 1)
      })

      it('should add an email by object', () => {
        const count = user.emailAddresses.length
        user.addEmail({ emailAddress: newEmail })

        expect(user.emailAddresses).to.have.lengthOf(count + 1)
      })

      it('should add an email by string and save', async () => {
        const count = user.emailAddresses.length
        await user.addEmailAndSave(newEmail)

        expect(user.emailAddresses).to.have.lengthOf(count + 1)
      })

      it('should add an email by object', async () => {
        const count = user.emailAddresses.length
        await user.addEmailAndSave({ emailAddress: newEmail })

        expect(user.emailAddresses).to.have.lengthOf(count + 1)
      })

      it('should set the email as primary by string', () => {
        const email = user.setPrimaryEmail(secondaryEmail)

        expect(email.emailAddress).to.eql(secondaryEmail)
        expect(user.email).to.eql(secondaryEmail)
      })

      it('should set the email as primary by object', () => {
        const email = user.setPrimaryEmail({ emailAddress: secondaryEmail })

        expect(email.emailAddress).to.eql(secondaryEmail)
        expect(user.email).to.eql(secondaryEmail)
      })

      it('should fail when setting a bad primary email', () =>
        expect(() => user.setPrimaryEmail(badEmail)).to.throw('does not exist')
      )

      it('should set the email as primary by string and save', async () => {
        const email = await user.setPrimaryEmailAndSave(secondaryEmail)

        expect(email.emailAddress).to.eql(secondaryEmail)
        expect(user.email).to.eql(secondaryEmail)
      })

      it('should set the email as primary by object and save', async () => {
        const email = await user.setPrimaryEmailAndSave({ emailAddress: primaryEmail })

        expect(email).to.exist()
        expect(email.emailAddress).to.eql(primaryEmail)
      })

      it('should fail when setting a bad primary email and saving', () =>
        expect(user.setPrimaryEmailAndSave(badEmail)).to.be.rejectedWith('does not exist')
      )

      it('should start email verification process', () => {
        const email = user.startEmailVerificationProcess(primaryEmail)

        expect(email).to.have.property('verification')
      })

      it('should fail email verification process with bad email', () =>
        expect(() => user.startEmailVerificationProcess(badEmail)).to.throw('does not exist')
      )

      it('should fail email verification process with already verified email', () =>
        expect(() => user.startEmailVerificationProcess(emailWithVerification)).to.throw('already verified')
      )

      it('should start email verification process and save', async () => {
        const email = await user.startEmailVerificationProcessAndSave(primaryEmail)

        expect(email).to.have.property('verification')
      })

      it('should fail email verification process with bad email while saving', () =>
        expect(user.startEmailVerificationProcessAndSave(badEmail)).to.be.rejectedWith('does not exist')
      )

      it('should fail email verification process with already verified email while saving', () =>
        expect(user.startEmailVerificationProcessAndSave(emailWithVerification)).to.be.rejectedWith('already verified')
      )

      it('should get email by verification code', () => {
        const email = user.getEmailByVerificationCode(verificationCode)

        expect(email.emailAddress).to.eql(emailWithVerificationCode)
      })

      it('should verify an email', () => {
        const email = user.setVerifiedEmail(verificationCode)

        expect(email.emailAddress).to.eql(emailWithVerificationCode)
      })

      it('should not verify an email with no existence or code', () =>
        expect(() => user.setVerifiedEmail(badVerificationCode)).to.throw('does not exist')
      )

      it('should not verify an already verified email', () =>
        expect(() => user.setVerifiedEmail(verifiedVerificationCode)).to.throw('already verified')
      )

      it('should not verify an email with an expired code', () =>
        expect(() => user.setVerifiedEmail(expiredVerificationCode)).to.throw('code has expired')
      )

      it('should verify an email and save', async () => {
        const email = await user.setVerifiedEmailAndSave(verificationCode)

        expect(email.emailAddress).to.eql(emailWithVerificationCode)
      })

      it('should not verify an email with no existence or code while saving', () =>
        expect(user.setVerifiedEmailAndSave(badVerificationCode)).to.be.rejectedWith('does not exist')
      )

      it('should not verify an already verified email while saving', () =>
        expect(user.setVerifiedEmailAndSave(verifiedVerificationCode)).to.be.rejectedWith('already verified')
      )

      it('should not verify an email with an expired code while saving', () =>
        expect(user.setVerifiedEmailAndSave(expiredVerificationCode)).to.be.rejectedWith('code has expired')
      )

      it('should confirm that an email is verified', () =>
        expect(user.isVerifiedEmail(emailWithVerification)).to.be.true()
      )

      it('should confirm that an email is not verified', () =>
        expect(user.isVerifiedEmail(primaryEmail)).to.be.false()
      )
    })

    context('destructive methods', () => {
      beforeEach(async () => {
        user = await User.create(doc)
      })

      it('should remove an email by string', () => {
        const count = user.emailAddresses.length
        user.removeEmail(primaryEmail)

        expect(user.emailAddresses).to.have.lengthOf(count - 1)
      })

      it('should remove an email by object', () => {
        const count = user.emailAddresses.length
        user.removeEmail({ emailAddress: primaryEmail })

        expect(user.emailAddresses).to.have.lengthOf(count - 1)
      })

      it('should remove a primary email and select a new primary', async () => {
        await user.removeEmailAndSave(primaryEmail)

        expect(user.email).not.to.eql(primaryEmail)
      })

      it('should remove an email by string and save', async () => {
        const count = user.emailAddresses.length
        await user.removeEmailAndSave(primaryEmail)

        expect(user.emailAddresses).to.have.lengthOf(count - 1)
      })

      it('should remove an email by object and save', async () => {
        const count = user.emailAddresses.length
        await user.removeEmailAndSave({ emailAddress: primaryEmail })

        expect(user.emailAddresses).to.have.lengthOf(count - 1)
      })
    })
  })
})
