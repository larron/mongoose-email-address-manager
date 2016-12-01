import 'babel-polyfill'
import { Schema } from 'mongoose'

export default (schema, options) => {
  const config = {
    _id: true,
    index: true,
    unique: true,
    sparse: true,
    required: false,
    verificationCodePrefix: 'emvc-',
    verificationCodeExpiration: 0,
    emailValidationRegex: /^.+@.+$/,
    style(key) {
      return key
    },
    ...options
  }

  const {
    _id,
    index,
    unique,
    sparse,
    required,
    verificationCodePrefix,
    verificationCodeExpiration,
    emailValidationRegex,
    style: s
  } = config

  schema.add({
    [s('email_addresses')]: [
      new Schema({
        [s('email_address')]: {
          type: String,
          unique,
          sparse,
          required: true
        },
        [s('primary')]: Date,
        [s('verification')]: {
          [s('date')]: Date,
          [s('code')]: String,
          [s('code_expiration')]: Date
        }
      }, { _id })
    ]
  })

  const emailAddressKey = `${s('email_addresses')}.${s('email_address')}`
  const verificationCodeKey = `${s('email_addresses')}.${s('verification')}.${s('code')}`
  const isObject = o => Object.prototype.toString.call(o) === '[object Object]'
  const generateEmailVerificationCode = () => verificationCodePrefix + function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b}() // eslint-disable-line
  const generateEmailVerificationCodeExpiration = (hours) => {
    const d = new Date()
    d.setTime(d.getTime() + hours * 60 * 60 * 1000)

    return d
  }
  const generateEmailVerification = (email, hours) => {
    email[s('verification')] = {
      [s('code')]: generateEmailVerificationCode()
    }

    if (hours > 0) email[s('verification')][s('code_expiration')] = generateEmailVerificationCodeExpiration(hours)

    return email
  }


  if (index) {
    schema.index({ [emailAddressKey]: 1 })
    schema.index({ [verificationCodeKey]: 1 })
  }

  schema.virtual('email').get(function () {
    const email = this.getPrimaryEmail()

    return email
      ? email[s('email_address')]
      : null
  })

  schema.pre('save', function (next) {
    if (!this.email && this[s('email_addresses')].length > 0) {
      this[s('email_addresses')][0][s('primary')] = new Date()
    }

    next()
  })

  schema.statics.findOneByEmail = function (email, ...rest) {
    const query = { [emailAddressKey]: email }

    return this.findOne(query, ...rest)
  }

  schema.statics.findByEmail = function (email, ...rest) {
    const query = { [emailAddressKey]: email }

    return this.find(query, ...rest)
  }

  schema.statics.findByEmailVerificationCode = function (code, ...rest) {
    const query = { [verificationCodeKey]: code }

    return this.findOne(query, ...rest)
  }

  schema.statics.emailExists = async function (email) {
    const doc = await this.findOneByEmail(email)

    return !!doc
  }

  schema.methods.addEmail = function (emailToAdd) {
    this[s('email_addresses')].push(
      isObject(emailToAdd)
      ? emailToAdd
      : { [s('email_address')]: emailToAdd }
    )

    return this.getEmail(emailToAdd)
  }

  schema.methods.addEmailAndSave = async function (emailToAdd) {
    const email = this.addEmail(emailToAdd)
    await this.save()

    return email
  }

  schema.methods.getEmail = function (emailToFind) {
    return this[s('email_addresses')].find(
      email => email[s('email_address')] === (
        isObject(emailToFind)
          ? emailToFind[s('email_address')]
          : emailToFind
      )
    )
  }

  schema.methods.emailExists = function (email) {
    return !!this.getEmail(email)
  }

  schema.methods.getPrimaryEmail = function () {
    return this[s('email_addresses')].find(
      email => email[s('primary')]
    )
  }

  schema.methods.isPrimaryEmail = function (emailToFind) {
    const email = this.getEmail(emailToFind)

    return email
      ? s('primary') in email
      : false
  }

  schema.methods.setPrimaryEmail = function (email) {
    const currentPrimaryEmail = this.getPrimaryEmail()
    const newPrimaryEmail = this.getEmail(email)

    if (!newPrimaryEmail) throw new Error('Email does not exist')

    if (currentPrimaryEmail !== newPrimaryEmail) {
      if (currentPrimaryEmail) currentPrimaryEmail[s('primary')] = undefined

      newPrimaryEmail[s('primary')] = new Date()
    }

    return newPrimaryEmail
  }

  schema.methods.setPrimaryEmailAndSave = async function (email) {
    const primaryEmail = this.setPrimaryEmail(email)

    await this.save()
    return primaryEmail
  }

  schema.methods.removeEmail = function (emailToRemove) {
    const email = this.getEmail(emailToRemove)

    if (email) {
      this[s('email_addresses')] = this[s('email_addresses')].filter(
        em => em !== email
      )

      if (this[s('email_addresses')].length && !this.email) {
        this.setPrimaryEmail(this[s('email_addresses')][0])
      }
    }

    return this[s('email_addresses')]
  }

  schema.methods.removeEmailAndSave = async function (emailToRemove) {
    this.removeEmail(emailToRemove)
    await this.save()

    return this[s('email_addresses')]
  }

  schema.methods.startEmailVerificationProcess = function (
    emailToVerify,
    hours = verificationCodeExpiration
  ) {
    const email = this.getEmail(emailToVerify)

    if (email) {
      if (this.isVerifiedEmail(email)) {
        throw new Error('Email is already verified')
      } else {
        generateEmailVerification(email, hours)

        return email
      }
    } else {
      throw new Error('Email does not exist')
    }
  }

  schema.methods.startEmailVerificationProcessAndSave = async function (...rest) {
    const email = this.startEmailVerificationProcess(...rest)
    await this.save()

    return email
  }

  schema.methods.getEmailByVerificationCode = function (code) {
    return this[s('email_addresses')].find(email =>
      email[s('verification')] && email[s('verification')][s('code')] === code
    )
  }

  schema.methods.setVerifiedEmail = function (code) {
    const email = this.getEmailByVerificationCode(code)

    if (email) {
      if (email[s('verification')]) {
        if (this.isVerifiedEmail(email)) {
          throw new Error('Email is already verified')
        } else if (
          email[s('verification')][s('code_expiration')]
          && email[s('verification')][s('code_expiration')].getTime()
          <= new Date().getTime()
        ) {
          throw new Error('Email validation code has expired')
        } else {
          email[s('verification')][s('date')] = new Date()
        }
      }
    } else {
      throw new Error('Email does not exist with that code')
    }

    return email
  }

  schema.methods.setVerifiedEmailAndSave = async function (code) {
    const email = this.setVerifiedEmail(code)
    await this.save()

    return email
  }

  schema.methods.isVerifiedEmail = function (emailToVerify) {
    const email = this.getEmail(emailToVerify)

    return !!(email && email[s('verification')] && email[s('verification')][s('date')])
  }

  schema.path(s('email_addresses')).validate(emails =>
    emails.filter(email => email[s('primary')]).length <= 1
  , 'More than one primary email address')

  schema.path(s('email_addresses')).schema.path(s('email_address')).validate(
    email => emailValidationRegex.test(email),
    'Invalid email address'
  )

  if (required) {
    schema.path(s('email_addresses')).validate(
      emails => emails.length,
      'Email address required'
    )
  }
}
