import { hash } from 'bcrypt'
import { Admin } from '../models'
import { loggerUtils } from '../../utils'
import { IAdmin } from '../../interfaces'

const SALT_ROUNDS = 10

export const seedAdmins = async () => {
  await Admin.deleteMany({})
  loggerUtils.logger.info('Deleted all admins!')

  const admins = [
    {
      email: 'admin@mailinator.com',
      password: await hash('Password@789', SALT_ROUNDS),
      isAuthToken: false,
      firstname: 'Dummy',
      lastname: 'Dummy',
      gender: 'male',
      dateOfBirth: new Date('2011-01-01'),
      mobileNumber: BigInt(8542103572),
      address: 'Demo_Address',
      city: 'Demo_City',
      state: 'Demo_State',
      paidAmount: 0
    }
  ]

  const insertedAdmin: IAdmin[] = await Admin.insertMany(admins)
  loggerUtils.logger.info('Inserted new admins!')
  return insertedAdmin
}
