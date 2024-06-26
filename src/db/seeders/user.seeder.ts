import { hash } from 'bcrypt'
import { User } from '../models'
import { loggerUtils } from '../../utils'

const SALT_ROUNDS = 10

export const seedUsers = async () => {
  await User.deleteMany({})
  loggerUtils.logger.info('Deleted all users!')

  const users = [
    {
      email: 'user@mailinator.com',
      password: await hash('Password@789', SALT_ROUNDS),
      isAuthToken: 'false',
      firstname: 'Dummy_2',
      lastname: 'Dummy_2',
      gender: 'female',
      dateOfBirth: new Date('2008-01-01'),
      mobileNumber: 8642204572,
      address: 'Demo_Address_1',
      city: 'Demo_City_1',
      state: 'Demo_State_1',
      paidAmount: 0
    }
  ]

  const insertedUsers = await User.insertMany(users)
  loggerUtils.logger.info('Inserted new users!')

  return insertedUsers
}
