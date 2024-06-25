import moment from 'moment'
import loggerUtils from './logger.utils'

const validateAgeLimit = (dateOfBirth: string): boolean => {
  try {
    const isValidDate = moment(dateOfBirth, true).isValid()
    if (!isValidDate) {
      throw new Error('dateOfBirth must be a valid date format')
    }

    const minAllowedDate = moment().subtract(12, 'years').startOf('day')
    if (moment(dateOfBirth) > minAllowedDate) {
      throw new Error('Age must be 12 years old!')
    }

    return true
  } catch (error: any) {
    loggerUtils.logger.error('Error validating age limit:', error)
    return false
  }
}

const numberOfFreeDays = (issueDate: Date, quantityAvailable: number): number | null => {
  try {
    const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24
    const today = new Date()

    if (quantityAvailable === 1) {
      const timeDifference = issueDate.getTime() - today.getTime()
      const daysDifference = Math.floor(timeDifference / DAY_IN_MILLISECONDS)
      return Math.max(daysDifference, 0)
    } else {
      return null
    }
  } catch (error: any) {
    loggerUtils.logger.error('Error calculating number of free days:', error)
    throw error
  }
}

const generatePlaceholderbookID = (): string => {
  try {
    const prefix = '999'
    const randomDigits = Math.floor(Math.random() * 10 ** 10)
      .toString()
      .padStart(10, '0')
    return `${prefix}${randomDigits}`
  } catch (error) {
    throw error
  }
}

export default {
  validateAgeLimit,
  numberOfFreeDays,
  generatePlaceholderbookID
}
