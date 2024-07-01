import moment from 'moment'
import loggerUtils from './logger.utils'
import { HttpError } from '../libs'
import { httpStatusConstant, messageConstant } from '../constant'

const validateAgeLimit = (dateOfBirth: string): boolean => {
  try {
    const isValidDate = moment(dateOfBirth, true).isValid()
    if (!isValidDate) {
      throw new HttpError(messageConstant.INVALID_DATE_FORMAT, httpStatusConstant.BAD_REQUEST)
    }

    const minAllowedDate = moment().subtract(12, 'years').startOf('day')
    if (moment(dateOfBirth) > minAllowedDate) {
      throw new HttpError(messageConstant.INVALID_AGE, httpStatusConstant.BAD_REQUEST)
    }

    return true
  } catch (error) {
    loggerUtils.logger.error('Error validating age limit:', error)
    return false
  }
}

const calculateNumberOfFreeDays = (issueDate: Date, quantityAvailable: number): number | null => {
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
  } catch (error) {
    loggerUtils.logger.error('Error calculating number of free days:', error)
    throw error
  }
}

const generatePlaceholderID = (prefix: string, numDigits: number): string => {
  if (numDigits < 0) {
    throw new Error('Number of digits cannot be negative')
  }

  const randomDigits = Math.floor(Math.random() * 10 ** numDigits)
    .toString()
    .padStart(numDigits, '0')
  return `${prefix}${randomDigits}`
}

const validateDateRange = async (
  startDate?: string,
  endDate?: string,
  monthYear?: string
): Promise<void> => {
  if (monthYear) {
    const [month, year] = String(monthYear).split('-')
    if (!month || !year || isNaN(Number(month)) || isNaN(Number(year))) {
      console.log('Invalid monthYear:', { month, year })
      throw new HttpError(messageConstant.INVALID_DATE_FORMAT, httpStatusConstant.BAD_REQUEST)
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new HttpError(messageConstant.INVALID_DATE_FORMAT, httpStatusConstant.BAD_REQUEST)
    }

    const monthDifference =
      (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
    const dayDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (monthDifference > 6 || dayDifference > 182) {
      throw new HttpError(messageConstant.INVALID_DATE_RANGE, httpStatusConstant.BAD_REQUEST)
    }
  }
}

export default {
  validateAgeLimit,
  calculateNumberOfFreeDays,
  generatePlaceholderID,
  validateDateRange
}
