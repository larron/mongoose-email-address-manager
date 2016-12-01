import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import dirtyChai from 'dirty-chai'

chai.use(chaiAsPromised)
chai.use(dirtyChai)

global.expect = expect
